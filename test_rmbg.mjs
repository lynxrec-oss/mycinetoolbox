import { pipeline, env } from '@huggingface/transformers';
import path from 'path';

env.allowLocalModels = false;
env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers/dist/';

async function test() {
  console.log("Loading pipeline...");
  const segmenter = await pipeline('image-segmentation', 'briaai/RMBG-1.4');
  console.log("Pipeline loaded.");
  
  const testUrl = path.resolve('public/vite.svg');
  console.log("Segmenting", testUrl);
  
  const result = await segmenter(testUrl);
  
  if (Array.isArray(result)) {
     console.log("Result is Array of length", result.length);
     console.log("Item 0 keys:", Object.keys(result[0]));
     if (result[0].mask) {
       console.log("mask type:", result[0].mask.constructor.name);
       console.log("mask dims:", result[0].mask.width, result[0].mask.height, result[0].mask.channels);
     }
  } else {
     console.log("Result type:", typeof result, result.constructor?.name);
     console.log("Result keys:", Object.keys(result));
     if (result.width) {
       console.log("dims:", result.width, result.height, result.channels);
     }
  }
}

test().catch(console.error);
