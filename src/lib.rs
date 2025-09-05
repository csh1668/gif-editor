mod utils;

use js_sys::Uint8Array;
use wasm_bindgen::prelude::*;
use image::{imageops, DynamicImage, AnimationDecoder};
use std::io::Cursor;
use gif::{Frame, Encoder};
use imagequant::Attributes;

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
    frames: Vec<DynamicImage>,
    delays: Vec<u16>,
    width: u32,
    height: u32,
}

#[wasm_bindgen]
impl GifResizer {
    #[wasm_bindgen(constructor)]
    pub fn new() -> GifResizer {
        console_error_panic_hook::set_once();
        GifResizer {
            frames: Vec::new(),
            delays: Vec::new(),
            width: 0,
            height: 0,
        }
    }

    #[wasm_bindgen]
    pub fn load_gif(&mut self, gif_data: &[u8]) -> Result<(), JsValue> {
        console_log!("Loading GIF data, size: {} bytes", gif_data.len());
        
        let cursor = Cursor::new(gif_data);
        
        // image 크레이트의 GIF 디코더 사용
        let decoder = image::codecs::gif::GifDecoder::new(cursor)
            .map_err(|e| JsValue::from_str(&format!("Failed to create GIF decoder: {}", e)))?;
        
        let frames = decoder.into_frames();
        
        self.frames.clear();
        self.delays.clear();
        
        for (i, frame_result) in frames.enumerate() {
            let frame = frame_result.map_err(|e| JsValue::from_str(&format!("Failed to decode frame {}: {}", i, e)))?;
            
            let image = DynamicImage::ImageRgba8(frame.buffer().clone());
            
            if i == 0 {
                self.width = image.width();
                self.height = image.height();
                console_log!("Original GIF size: {}x{}", self.width, self.height);
            }
            
            // 프레임 딜레이 추출 (milliseconds를 centiseconds로 변환)
            let delay = frame.delay().numer_denom_ms();
            let delay_cs = ((delay.0 as f64 / delay.1 as f64) / 10.0) as u16;
            
            self.frames.push(image);
            self.delays.push(delay_cs.max(1)); // 최소 1cs (0.01초)
        }
        
        console_log!("Loaded {} frames", self.frames.len());
        Ok(())
    }

    #[wasm_bindgen]
    pub fn resize(&mut self, new_width: u32, new_height: u32) -> Result<Uint8Array, JsValue> {
        if self.frames.is_empty() {
            return Err(JsValue::from_str("No GIF data loaded"));
        }

        console_log!("Resizing GIF from {}x{} to {}x{}", self.width, self.height, new_width, new_height);

        let mut output = Vec::new();
        let mut encoder = Encoder::new(&mut output, new_width as u16, new_height as u16, &[])
            .map_err(|e| JsValue::from_str(&format!("Failed to create GIF encoder: {}", e)))?;

        // 전역 색상 팔레트를 사용하도록 설정
        encoder.set_repeat(gif::Repeat::Infinite)
            .map_err(|e| JsValue::from_str(&format!("Failed to set repeat: {}", e)))?;

        for (i, frame) in self.frames.iter().enumerate() {
            // 프레임을 새로운 크기로 리사이즈
            let resized = frame.resize_exact(new_width, new_height, imageops::FilterType::Lanczos3);
            let rgba_image = resized.to_rgba8();

            // 색상 양자화를 위한 imagequant 사용
            let mut liq = Attributes::new();
            liq.set_speed(5).map_err(|e| JsValue::from_str(&format!("Failed to set speed: {}", e)))?;
            liq.set_quality(0, 100).map_err(|e| JsValue::from_str(&format!("Failed to set quality: {}", e)))?;

            let rgba_data = rgba_image.as_raw();
            
            // RGBA 데이터를 imagequant::RGBA 형식으로 변환
            let rgba_pixels: Vec<imagequant::RGBA> = rgba_data
                .chunks_exact(4)
                .map(|chunk| imagequant::RGBA {
                    r: chunk[0],
                    g: chunk[1],
                    b: chunk[2],
                    a: chunk[3],
                })
                .collect();
            
            // RGBA 이미지 생성
            let mut img = liq.new_image(rgba_pixels, new_width as usize, new_height as usize, 0.0)
                .map_err(|e| JsValue::from_str(&format!("Failed to create image: {}", e)))?;

            let mut quantized = liq.quantize(&mut img)
                .map_err(|e| JsValue::from_str(&format!("Failed to quantize: {}", e)))?;

            quantized.set_dithering_level(1.0)
                .map_err(|e| JsValue::from_str(&format!("Failed to set dithering: {}", e)))?;

            let (palette, indexed_data) = quantized.remapped(&mut img)
                .map_err(|e| JsValue::from_str(&format!("Failed to remap: {}", e)))?;

            // 팔레트를 GIF 형식으로 변환
            let mut gif_palette = Vec::new();
            for color in palette {
                gif_palette.push(color.r);
                gif_palette.push(color.g);
                gif_palette.push(color.b);
            }

            // 팔레트 크기를 256색으로 패딩
            while gif_palette.len() < 768 {
                gif_palette.push(0);
            }

            let mut gif_frame = Frame::from_indexed_pixels(
                new_width as u16,
                new_height as u16,
                indexed_data,
                None,
            );

            gif_frame.delay = self.delays[i];
            gif_frame.palette = Some(gif_palette);

            encoder.write_frame(&gif_frame)
                .map_err(|e| JsValue::from_str(&format!("Failed to write frame {}: {}", i, e)))?;
        }

        drop(encoder);

        console_log!("Resize completed, output size: {} bytes", output.len());

        // 결과를 Uint8Array로 변환
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
        self.frames.len()
    }
}