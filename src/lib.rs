mod utils;

use js_sys::Uint8Array;
use wasm_bindgen::prelude::*;
use image::{imageops, DynamicImage, AnimationDecoder};
use std::io::Cursor;
use gif::{Frame, Encoder};
// use imagequant::Attributes;
use gifski_lite::{self as gifski};
use imgref::{ImgVec};
use rgb::RGBA8;
// use gifski_lite::Collector::{ImgVec as GifskiImgVec, RGBA8 as GifskiRGBA8};
// use gifski_lite::progress::NoProgress;

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

    // #[wasm_bindgen]
    // pub fn resize(&mut self, new_width: u32, new_height: u32) -> Result<Uint8Array, JsValue> {
    //     if self.frames.is_empty() {
    //         return Err(JsValue::from_str("No GIF data loaded"));
    //     }
    //
    //     console_log!("Resizing GIF from {}x{} to {}x{}", self.width, self.height, new_width, new_height);
    //
    //     let mut output = Vec::new();
    //     let mut encoder = Encoder::new(&mut output, new_width as u16, new_height as u16, &[])
    //         .map_err(|e| JsValue::from_str(&format!("Failed to create GIF encoder: {}", e)))?;
    //
    //     // 전역 색상 팔레트를 사용하도록 설정
    //     encoder.set_repeat(gif::Repeat::Infinite)
    //         .map_err(|e| JsValue::from_str(&format!("Failed to set repeat: {}", e)))?;
    //
    //     for (i, frame) in self.frames.iter().enumerate() {
    //         // 프레임을 새로운 크기로 리사이즈
    //         let resized = frame.resize_exact(new_width, new_height, imageops::FilterType::Lanczos3);
    //         let rgba_image = resized.to_rgba8();
    //
    //         // 색상 양자화를 위한 imagequant 사용
    //         let mut liq = Attributes::new();
    //         liq.set_speed(5).map_err(|e| JsValue::from_str(&format!("Failed to set speed: {}", e)))?;
    //         liq.set_quality(0, 100).map_err(|e| JsValue::from_str(&format!("Failed to set quality: {}", e)))?;
    //         // 파일 크기 절감을 위해 색상 수를 제한 (기본 128색)
    //         liq.set_max_colors(128).map_err(|e| JsValue::from_str(&format!("Failed to set max colors: {}", e)))?;
    //
    //         let rgba_data = rgba_image.as_raw();
    //
    //         // RGBA 데이터를 imagequant::RGBA 형식으로 변환
    //         let rgba_pixels: Vec<imagequant::RGBA> = rgba_data
    //             .chunks_exact(4)
    //             .map(|chunk| imagequant::RGBA {
    //                 r: chunk[0],
    //                 g: chunk[1],
    //                 b: chunk[2],
    //                 a: chunk[3],
    //             })
    //             .collect();
    //
    //         // RGBA 이미지 생성
    //         let mut img = liq.new_image(rgba_pixels, new_width as usize, new_height as usize, 0.0)
    //             .map_err(|e| JsValue::from_str(&format!("Failed to create image: {}", e)))?;
    //
    //         let mut quantized = liq.quantize(&mut img)
    //             .map_err(|e| JsValue::from_str(&format!("Failed to quantize: {}", e)))?;
    //
    //         // 높은 디더링은 LZW 압축률을 악화시킬 수 있으므로 완화
    //         quantized.set_dithering_level(0.6)
    //             .map_err(|e| JsValue::from_str(&format!("Failed to set dithering: {}", e)))?;
    //
    //         let (palette, indexed_data) = quantized.remapped(&mut img)
    //             .map_err(|e| JsValue::from_str(&format!("Failed to remap: {}", e)))?;
    //
    //         // 팔레트를 GIF 형식으로 변환
    //         let mut gif_palette = Vec::new();
    //         for color in palette {
    //             gif_palette.push(color.r);
    //             gif_palette.push(color.g);
    //             gif_palette.push(color.b);
    //         }
    //
    //         // GIF의 팔레트는 2^n 색상만 허용되므로, 최소한의 패딩만 적용
    //         // (예: 80색 → 128색으로만 패딩)
    //         let color_count = gif_palette.len() / 3;
    //         let mut target_colors = color_count.next_power_of_two().max(2);
    //         if target_colors > 256 { target_colors = 256; }
    //         while (gif_palette.len() / 3) < target_colors {
    //             gif_palette.push(0);
    //             gif_palette.push(0);
    //             gif_palette.push(0);
    //         }
    //
    //         let mut gif_frame = Frame::from_indexed_pixels(
    //             new_width as u16,
    //             new_height as u16,
    //             indexed_data,
    //             None,
    //         );
    //
    //         gif_frame.delay = self.delays[i];
    //         gif_frame.palette = Some(gif_palette);
    //
    //         encoder.write_frame(&gif_frame)
    //             .map_err(|e| JsValue::from_str(&format!("Failed to write frame {}: {}", i, e)))?;
    //     }
    //
    //     drop(encoder);
    //
    //     console_log!("Resize completed, output size: {} bytes", output.len());
    //
    //     // 결과를 Uint8Array로 변환
    //     let js_array = Uint8Array::new_with_length(output.len() as u32);
    //     js_array.copy_from(&output);
    //
    //     Ok(js_array)
    // }

    #[wasm_bindgen]
    pub fn resize_gifski(&mut self, new_width: u32, new_height: u32, quality: u8, fast: bool) -> Result<Uint8Array, JsValue> {
        if self.frames.is_empty() {
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

        let (mut collector, mut writer) = gifski::new(settings).map_err(|e| JsValue::from_str(&format!("gifski new failed: {:?}", e)))?;

        // frames를 gifski collector에 입력
        let mut pts: f64 = 0.0;
        for (i, frame) in self.frames.iter().enumerate() {
            let rgba = frame.to_rgba8();
            let (w, h) = (rgba.width() as usize, rgba.height() as usize);
            let buf: Vec<RGBA8> = rgba
                .as_raw()
                .chunks_exact(4)
                .map(|c| RGBA8::new(c[0], c[1], c[2], c[3]))
                .collect();
            let img = ImgVec::new(buf, w, h);
            // delay는 centiseconds → seconds
            let delay_cs = self.delays[i] as f64;
            let frame_duration = (delay_cs.max(1.0)) / 100.0;
            collector.add_frame_rgba(i, img, pts)
                .map_err(|e| JsValue::from_str(&format!("collector add_frame failed: {:?}", e)))?;
            pts += frame_duration;
        }
        drop(collector);

        let mut output = Vec::new();
        writer.write(&mut output)
            .map_err(|e| JsValue::from_str(&format!("gifski write failed: {:?}", e)))?;

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