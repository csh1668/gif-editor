mod utils;

use js_sys::Uint8Array;
use wasm_bindgen::prelude::*;
use image::{imageops, AnimationDecoder, DynamicImage, ImageDecoder, RgbaImage}; // <-- Import ImageDecoder and RgbaImage
use std::io::Cursor;
use gifski_lite::{self as gifski};
use imgref::ImgVec;
use rgb::RGBA8;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    fn alert(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, gif-editor!");
}

#[wasm_bindgen]
pub struct GifResizer {
    // --- KEY CHANGE ---
    // Instead of storing decoded frames, store the original compressed data.
    // This is much, much more memory efficient.
    gif_data: Vec<u8>,
    delays: Vec<u16>,
    width: u32,
    height: u32,
    num_frames: usize,
}

#[wasm_bindgen]
impl GifResizer {
    #[wasm_bindgen(constructor)]
    pub fn new() -> GifResizer {
        console_error_panic_hook::set_once();
        GifResizer {
            // Initialize with empty/zero values
            gif_data: Vec::new(),
            delays: Vec::new(),
            width: 0,
            height: 0,
            num_frames: 0,
        }
    }

    #[wasm_bindgen]
    pub fn load_gif(&mut self, gif_data_in: &[u8]) -> Result<(), JsValue> {
        console_log!("Loading GIF data, size: {} bytes", gif_data_in.len());

        // --- KEY CHANGE ---
        // Store the raw data directly.
        self.gif_data = gif_data_in.to_vec();

        // We still need to decode once to get metadata (dimensions, frame count, delays).
        // But we won't store the large pixel buffers.
        let cursor = Cursor::new(gif_data_in);
        let decoder = image::codecs::gif::GifDecoder::new(cursor)
            .map_err(|e| JsValue::from_str(&format!("Failed to create GIF decoder: {}", e)))?;

        // Get dimensions from the decoder itself
        (self.width, self.height) = decoder.dimensions();
        // self.num_frames = decoder.total_frames().unwrap_or(0);
        // self.num_frames = decoder.into_frames().size_hint().0;

        // Iterate through frames just to get their delays
        let mut num_frames = 0usize;
        self.delays = decoder.into_frames()
            .filter_map(Result::ok)
            .map(|frame| {
                num_frames += 1;
                let (num_ms, denom_ms) = frame.delay().numer_denom_ms();
                let delay_cs = if denom_ms == 0 || num_ms == 0 { 1 } else { ((num_ms as f64 / denom_ms as f64) / 10.0).round() as u16 };
                delay_cs.max(1) // Ensure a minimum delay
            })
            .collect();

        console_log!("Original GIF info: {}x{}, {} frames", self.width, self.height, self.num_frames);
        console_log!("Loaded metadata for {} frames", self.delays.len());
        Ok(())
    }

    #[wasm_bindgen]
    pub fn resize_gifski(&self, new_width: u32, new_height: u32, quality: u8, fast: bool) -> Result<Uint8Array, JsValue> {
        if self.gif_data.is_empty() {
            return Err(JsValue::from_str("No GIF data loaded"));
        }

        console_log!("Resizing (gifski-lite) from {}x{} to {}x{} (q={}, fast={})", self.width, self.height, new_width, new_height, quality, fast);

        let settings = gifski::Settings {
            width: Some(new_width),
            height: Some(new_height),
            quality: quality.min(100).max(1),
            fast,
            repeat: gifski::Repeat::Infinite,
        };

        let (mut collector, mut writer) = gifski::new(settings)
            .map_err(|e| JsValue::from_str(&format!("gifski new failed: {:?}", e)))?;

        // --- KEY CHANGE ---
        // Create a new decoder here to process the stored data as a stream.
        let cursor = Cursor::new(&self.gif_data);
        let decoder = image::codecs::gif::GifDecoder::new(cursor)
            .map_err(|e| JsValue::from_str(&format!("Failed to create stream decoder: {}", e)))?;

        let mut pts: f64 = 0.0;

        // Process frame by frame
        for (i, frame_result) in decoder.into_frames().enumerate() {
            let frame = frame_result.map_err(|e| JsValue::from_str(&format!("Failed to decode frame {}: {}", i, e)))?;

            // --- OPTIMIZATION ---
            // 1. Get the raw RGBA buffer from the decoded frame.
            let raw_buffer = frame.buffer();

            // 2. Resize the buffer directly. This is more efficient than creating a DynamicImage first.
            let resized_buffer: RgbaImage = imageops::resize(
                raw_buffer,
                new_width,
                new_height,
                // Lanczos3 is high quality but slow. Consider other filters for speed.
                // imageops::FilterType::Triangle is a good balance.
                imageops::FilterType::Lanczos3,
            );

            // 3. Convert the *resized* buffer into the format gifski needs.
            let buf: Vec<RGBA8> = resized_buffer
                .as_raw()
                .chunks_exact(4)
                .map(|c| RGBA8::new(c[0], c[1], c[2], c[3]))
                .collect();

            let img = ImgVec::new(buf, new_width as usize, new_height as usize);

            // Use the pre-calculated delay.
            let delay_cs = self.delays.get(i).cloned().unwrap_or(1) as f64;
            let frame_duration = delay_cs / 100.0;

            collector.add_frame_rgba(i, img, pts)
                .map_err(|e| JsValue::from_str(&format!("collector add_frame failed: {:?}", e)))?;

            pts += frame_duration;

            // `frame`, `resized_buffer`, `buf`, and `img` are dropped here, freeing memory
            // before the next iteration starts.
        }

        // Signal to the writer that all frames have been added.
        drop(collector);

        let mut output = Vec::new();
        writer.write(&mut output)
            .map_err(|e| JsValue::from_str(&format!("gifski write failed: {:?}", e)))?;

        console_log!("Resizing complete. New size: {} bytes", output.len());

        let js_array = Uint8Array::new_with_length(output.len() as u32);
        js_array.copy_from(&output);
        Ok(js_array)
    }

    #[wasm_bindgen(getter)]
    pub fn original_width(&self) -> u32 {
        self.width
    }

    #[wasm_bindgen(getter)]
    pub fn original_height(&self) -> u32 {
        self.height
    }

    #[wasm_bindgen(getter)]
    pub fn frame_count(&self) -> usize {
        self.num_frames
    }
}