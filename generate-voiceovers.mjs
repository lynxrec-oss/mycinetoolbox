import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load API key from .env
const envFile = readFileSync(join(__dirname, '.env'), 'utf-8');
const apiKey = envFile.match(/^ELEVENLABS_API_KEY=(.+)$/m)?.[1]?.trim();
if (!apiKey) throw new Error('ELEVENLABS_API_KEY not found in .env');

// Voice IDs
const GUY     = 'QTGiyJvep6bcx4WD1qAq'; // Guy - Serious TV Radio Announcer
const CLANCY  = 'FLpz0UhC9a7CIfUSBo6S'; // Clancy - Viral Long-Form Storyteller

// Output folder
const outDir = join('/Volumes/G-Drive/chroma key pro/tembo-videos/audio');
mkdirSync(outDir, { recursive: true });

// Voice settings
const guySettings     = { stability: 0.60, similarity_boost: 0.75, style: 0.2, use_speaker_boost: true };
const clancySettings  = { stability: 0.55, similarity_boost: 0.80, style: 0.35, use_speaker_boost: true };

// All five scripts
const videos = [
  {
    filename: '01-master-explainer.mp3',
    voice: GUY,
    settings: guySettings,
    script: `Most creators have a bio link. Very few have a bio link that actually thinks.

A static list of links doesn't know who's visiting. It doesn't know if they came from TikTok, or YouTube, or your newsletter. It just shows everyone the same thing — and hopes for the best.

Tembo Page is different. It's a smart, living creator hub — one that reads your traffic, learns your audience, and automatically serves the right content to the right people. Every time. Without you lifting a finger.

Your Dashboard gives you a real-time view of every click, every conversion, every revenue source. The Page Builder lets you design your perfect page — with a live phone preview updating as you build. And the Smart Pixel? Two lines of code that track everything — serverlessly, cookieless, frictionlessly.

Tembo's AI advisor works in the background — surfacing insights, recommending card placements, and telling you exactly when and where your audience converts best. It's like having a full-time strategist, built into your link.

An elephant never forgets. Neither should your bio link. Claim your Tembo Page — free — and let your link start thinking for you.`
  },
  {
    filename: '02-what-is-tembo.mp3',
    voice: CLANCY,
    settings: clancySettings,
    script: `What if your bio link knew exactly who was visiting — and showed them exactly what they needed to see?

Tembo Page is the smartest creator link on the internet. It reads your traffic source, rearranges your content in real time, and turns every visitor into a potential conversion.

Creators using Tembo see an average thirty-four percent lift in click-through rates. Not from posting more. Just from linking smarter.

Claim your page free. Tembo Page dot com.`
  },
  {
    filename: '03-page-builder-demo.mp3',
    voice: GUY,
    settings: guySettings,
    script: `Building your Tembo Page takes minutes — but the result looks like it took months.

The Page Builder gives you a live, three-panel workspace. On the left, your full component library — links, Spotify players, YouTube embeds, merch drops. In the center, a real-time phone preview that updates as you build. On the right, a contextual properties panel — where you control visibility, smart rules, and custom routing.

Every card you place can be set to show only to specific audiences. TikTok visitors see your trending content first. Newsletter subscribers see your archive and exclusive drops. The page adapts. Automatically.

Start building for free. No credit card. No templates. Just your page — thinking for you.`
  },
  {
    filename: '04-traffic-personalization.mp3',
    voice: CLANCY,
    settings: clancySettings,
    script: `Your TikTok audience and your YouTube audience are completely different people. Why are you showing them the same page?

Tembo Page detects where every visitor comes from — and rearranges your content in real time to match. TikTok followers see your merch and trending audio. YouTube subscribers see your latest video and membership offer. Instantly. Automatically. Every time.

On average, creators see a thirty-four percent increase in conversions — without changing a single link.

Tembo Page. Link smarter.`
  },
  {
    filename: '05-smart-pixel-setup.mp3',
    voice: GUY,
    settings: guySettings,
    script: `Setting up your Tembo Smart Pixel takes less than two minutes — and it changes everything about how you understand your audience.

Head to Settings, then Smart Pixel Setup. Copy your unique Tembo Pixel ID and paste the two-line snippet into your website's head tag. That's it. No tag managers. No cookie consent banners. No engineers required.

Once active, the Smart Pixel begins tracking every click, every traffic source, and every conversion event — feeding that data directly into your Tembo Dashboard and AI advisor. Which pages convert. Which links underperform. Which hours your audience is most active. All of it, live, in one place.

Two lines of code. Unlimited insight. That's the Tembo advantage.`
  }
];

async function generateAudio(video) {
  console.log(`\n🎙️  Generating: ${video.filename}...`);

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${video.voice}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg'
    },
    body: JSON.stringify({
      text: video.script,
      model_id: 'eleven_multilingual_v2',
      voice_settings: video.settings
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error for ${video.filename}: ${response.status} — ${err}`);
  }

  const buffer = await response.arrayBuffer();
  const outPath = join(outDir, video.filename);
  writeFileSync(outPath, Buffer.from(buffer));
  console.log(`   ✅ Saved → ${outPath}`);
}

async function main() {
  console.log('🐘 Tembo Page — ElevenLabs Voiceover Generator');
  console.log(`📁 Output folder: ${outDir}`);
  console.log(`🔑 API Key: ${apiKey.slice(0, 8)}...`);

  for (const video of videos) {
    await generateAudio(video);
  }

  console.log('\n🌅 All 5 voiceovers generated successfully!');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
