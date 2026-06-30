import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load API key from .env
const envFile = readFileSync(join(__dirname, '.env'), 'utf-8');
const apiKey = envFile.match(/^ELEVENLABS_API_KEY=(.+)$/m)?.[1]?.trim();
if (!apiKey) throw new Error('ELEVENLABS_API_KEY not found in .env');

// Output folder
const outDir = '/Volumes/G-Drive/chroma key pro/tembo-videos/audio';
mkdirSync(outDir, { recursive: true });

const MAX_DURATION = 22; // stay safely under 30s limit per call

const tracks = [
  {
    filename: 'music-cinematic-savannah.mp3',
    targetDuration: 90,
    promptInfluence: 0.4,
    prompt: `Warm cinematic instrumental background music. Subtle African percussion, light hand drums, shakers, ambient atmospheric pads, soft elegant piano, gentle bass. Sophisticated and premium feeling. Slow confident build, golden hour sunset mood. No vocals. Luxury brand ad style. Modern SaaS product reveal energy. Think premium tech meets African savannah. Tempo around 72 BPM. Cinematic, expansive, authoritative.`
  },
  {
    filename: 'music-upbeat-social.mp3',
    targetDuration: 60,
    promptInfluence: 0.45,
    prompt: `Upbeat modern cinematic background music for social media content. Driving confident rhythm, punchy clean bass, bright synth accents, energetic percussion. High energy but sophisticated and clean. No vocals, no lyrics. Viral creator content meets premium tech product. Momentum building, sharp and punchy. Around 95 BPM. Think modern SaaS launch trailer meets TikTok premium brand content.`
  }
];

async function generateClip(prompt, promptInfluence, durationSec) {
  const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg'
    },
    body: JSON.stringify({
      text: prompt,
      duration_seconds: durationSec,
      prompt_influence: promptInfluence
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error: ${response.status} — ${err}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function generateMusic(track) {
  console.log(`\n🎵 Generating: ${track.filename} (target: ${track.targetDuration}s)...`);

  const clipsNeeded = Math.ceil(track.targetDuration / MAX_DURATION);
  const clipPaths = [];

  for (let i = 0; i < clipsNeeded; i++) {
    const remaining = track.targetDuration - i * MAX_DURATION;
    const clipDuration = Math.min(remaining, MAX_DURATION);
    console.log(`   🎼 Clip ${i + 1}/${clipsNeeded} (${clipDuration}s)...`);
    const buffer = await generateClip(track.prompt, track.promptInfluence, clipDuration);
    const clipPath = join(outDir, `_clip_${track.filename}_${i}.mp3`);
    writeFileSync(clipPath, buffer);
    clipPaths.push(clipPath);
  }

  const outPath = join(outDir, track.filename);

  if (clipPaths.length === 1) {
    // Just rename the single clip
    const data = readFileSync(clipPaths[0]);
    writeFileSync(outPath, data);
    unlinkSync(clipPaths[0]);
  } else {
    // Stitch clips together with ffmpeg
    const listFile = join(outDir, `_list_${track.filename}.txt`);
    writeFileSync(listFile, clipPaths.map(p => `file '${p}'`).join('\n'));
    execSync(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${outPath}"`, { stdio: 'pipe' });
    // Cleanup temp files
    clipPaths.forEach(p => unlinkSync(p));
    unlinkSync(listFile);
  }

  console.log(`   ✅ Saved → ${outPath}`);
}

async function main() {
  console.log('🐘 Tembo Page — ElevenLabs Music Generator');
  console.log(`📁 Output folder: ${outDir}`);
  console.log(`🔑 API Key: ${apiKey.slice(0, 8)}...`);

  for (const track of tracks) {
    await generateMusic(track);
  }

  console.log('\n🌅 Both music tracks generated successfully!');
  console.log('\n📦 Full audio suite ready:');
  console.log('   🎵 music-cinematic-savannah.mp3  — For Guy videos (Master, Builder, Pixel)');
  console.log('   🎵 music-upbeat-social.mp3        — For Clancy videos (What is Tembo, Traffic)');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
