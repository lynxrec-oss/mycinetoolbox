export interface BlogPost {
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  excerpt: string;
  coverImage: string;
  author: string;
  tags: string[];
  content: string;
}

export const CATEGORIES = [
  'All',
  'Color Grading',
  'Gear Review',
  'Lens Review',
  'Tutorial',
  'Workflow',
  'Lighting',
];

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'dehancer-vs-filmconvert-which-plugin-looks-like-film',
    title: 'Dehancer vs. FilmConvert: Which Plugin Actually Looks Like Film?',
    category: 'Color Grading',
    date: 'June 4, 2026',
    readTime: '8 min read',
    excerpt:
      'After running both plugins on RAW footage from the Blackmagic Pyxis 6K, here is my honest breakdown of grain structure, halation, color response, and which one is actually worth your money.',
    coverImage: 'https://img.youtube.com/vi/KXsOoeyBQsM/hqdefault.jpg',
    author: 'Aaron Stowers',
    tags: ['DaVinci Resolve', 'Color Grading', 'Dehancer', 'FilmConvert', 'Film Emulation'],
    content: `
<h2>The Question Every Colorist Eventually Asks</h2>
<p>There are two kings in the film emulation plugin world: <strong>Dehancer</strong> and <strong>FilmConvert Nitrate</strong>. Both promise to make your digital footage look like it was shot on actual celluloid. Both cost real money. And both have deeply passionate communities defending them online.</p>
<p>I've been using both in my DaVinci Resolve workflow for the past year — on Blackmagic RAW footage from the Pyxis 6K and BMPCC 4K, on Olympus footage, and everything in between. Here's my unfiltered, side-by-side breakdown.</p>

<h2>Grain: The Most Important Detail</h2>
<p>Film grain is not digital noise. Real grain is organic, silver-halide chemical — it lives in the image, breathes with it, responds to exposure. Digital noise is uniform, repetitive, and sits <em>on top</em> of the image like a bad texture overlay.</p>
<blockquote>Dehancer wins the grain battle. It's not close. The grain is simulated using actual scanned film stock data, and it holds up under 200% zoom in a way FilmConvert's grain simply doesn't.</blockquote>
<p>FilmConvert's grain is still excellent — far better than anything in a LUT pack — but under close inspection you can detect tiling and repetition that Dehancer avoids entirely. For projects destined for large screens or theatrical delivery, this matters.</p>

<h2>Halation: The Film Signature No Plugin Gets Cheap</h2>
<p>Halation is that red-orange glow bleeding around highlights — light physically passing through the film base and reflecting back. It's one of the most distinctive characteristics of film, and it separates real emulation from cheap imitation.</p>
<p>Dehancer's halation is meticulously controllable — you dial in the bleed distance, color temperature shift, and how far it reaches into the midtones. FilmConvert's halation is more automatic and preset-driven, but on the right stock it looks absolutely gorgeous with zero adjustment.</p>
<p>For narrative work where I'm building a specific look, I reach for Dehancer. For fast documentary turnarounds, FilmConvert's defaults get me there in seconds.</p>

<h2>Film Stock Libraries</h2>
<ul>
<li><strong>Dehancer</strong> — 24 stocks including Kodak Vision 3 250D, Vision 3 500T, Fuji Eterna 500T, Fuji Velvia 50, Ilford HP5, and several reversal stocks. Updated regularly with new additions.</li>
<li><strong>FilmConvert Nitrate</strong> — 19 stocks covering Kodak, Fuji, and Ilford families. Each is precisely calibrated and performs consistently.</li>
</ul>
<p>Both cover the essential stocks most colorists want. Dehancer has more specialty and reversal options for stylized work.</p>

<h2>Performance in DaVinci Resolve</h2>
<p>Both are OFX plugins that install cleanly into DaVinci Resolve 18 and 19. In my testing on an Apple M2 Pro with 32GB RAM, Dehancer runs significantly heavier — expect 1/4 to 1/8 resolution playback on 4K BRAW clips in real time. FilmConvert typically allows half-resolution playback without dropping frames.</p>
<p>Neither impacts final render quality. The performance cost only hits during the grading session, not delivery.</p>

<h2>Price & Ownership</h2>
<p>Dehancer is $199/year on subscription or $499 perpetual (DaVinci OFX version). FilmConvert Nitrate is $199 perpetual with optional paid upgrades. For long-term ownership economics, FilmConvert wins decisively.</p>

<h2>The Verdict</h2>
<p>If you're a working colorist or serious filmmaker who demands the highest-quality grain simulation and needs granular control over every aspect of the emulation, <strong>Dehancer is the answer</strong>. The ceiling is higher.</p>
<p>If you want something that performs beautifully out of the box, runs lighter on your timeline, and costs less over a 3-year period, <strong>FilmConvert Nitrate</strong> is an outstanding value that will serve most filmmakers completely.</p>
<p>My personal workflow: Dehancer for narrative and commercial work screened on large displays. FilmConvert when speed and timeline efficiency matter more than the last 5% of grain quality.</p>
    `,
  },
  {
    slug: 'blackmagic-pyxis-6k-vs-bmpcc-4k-real-world-take',
    title: "Blackmagic Pyxis 6K vs. BMPCC 4K: A Detroit Cinematographer's Real-World Take",
    category: 'Gear Review',
    date: 'May 28, 2026',
    readTime: '10 min read',
    excerpt:
      "I've shot on both cameras — the Pyxis 6K in North Rosedale Park and the BMPCC 4K on narrative projects across Detroit. Here's how the two cameras actually compare when the sun goes down.",
    coverImage: 'https://img.youtube.com/vi/e4cBhDcwldI/hqdefault.jpg',
    author: 'Aaron Stowers',
    tags: ['Blackmagic', 'Pyxis 6K', 'BMPCC 4K', 'Cinema Camera', 'Gear Review'],
    content: `
<h2>Why This Comparison Matters</h2>
<p>The Blackmagic Pocket Cinema Camera 4K revolutionized accessible cinema. For under $1,300, you had genuine cinema color science, RAW recording, and a sensor that could punch well above its weight class. The Pyxis 6K — Blackmagic's newer box-style cinema camera — asks a very different question: what does a mature, refined cinema camera look like when built for professionals who've already figured out their workflow?</p>
<p>I've used both extensively on location in Detroit — the Pyxis 6K on landscape and lens testing sessions in North Rosedale Park, and the BMPCC 4K on short film and documentary projects across the city. Here's what I've learned that spec sheets don't tell you.</p>

<h2>Build Quality & Ergonomics</h2>
<p>The BMPCC 4K was a brilliant piece of engineering for its price, but let's be honest: it was a compromised form factor. The battery life was infuriating, overheating on long takes was real, and the small body demanded a full cage rig before it became truly functional on set.</p>
<p>The Pyxis 6K is a different beast entirely. The box body is larger, heavier, and built for professional deployment. It runs cooler, records longer, and accepts full-size batteries that actually last a shoot. On a gimbal or shoulder rig, the weight distribution is dramatically more manageable.</p>
<blockquote>The Pyxis 6K is what the BMPCC line always wanted to be when it grew up.</blockquote>

<h2>Image Quality: Sensor Size & Resolution</h2>
<p>The Pyxis 6K records up to 6144×3456 on its full-frame sensor. The BMPCC 4K records to 4096×2160 on a Micro Four Thirds sensor. In practice, the resolution gap matters less than the sensor size gap.</p>
<p>Full frame gives you shallower depth of field at equivalent apertures, a different bokeh character, and better low-light performance. In Detroit's industrial environments — shooting in warehouses, under streetlights, in theaters with practical lighting only — the Pyxis 6K's larger sensor is a meaningful advantage.</p>

<h2>Color Science & BRAW</h2>
<p>Both cameras use Blackmagic RAW. Both have Blackmagic Gen 5 color science. In DaVinci Resolve, they grade identically — same nodes, same LUTs, same PowerGrades work on both. This is a genuine advantage of staying in the Blackmagic ecosystem.</p>
<p>The Pyxis 6K delivers slightly more dynamic range (around 13+ stops vs 12 stops on the BMPCC 4K) and cleaner shadow detail at ISO 3200 and above. Not a dramatic difference, but meaningful for challenging lighting situations.</p>

<h2>Lens Ecosystem</h2>
<p>The BMPCC 4K's MFT mount gives you access to a huge range of affordable, lightweight lenses. The crop factor makes long lenses easier to work with. The Pyxis 6K has a full-frame L-mount, which opens up Leica, Sigma, Lumix L glass — but at significantly higher prices.</p>
<p>My NiSi Athena 14mm T2.4 (PL mount with L-mount adapter) performs beautifully on the Pyxis 6K. On the BMPCC 4K's MFT mount with adapters, the setup becomes more complicated and less reliable.</p>

<h2>Workflow on Set</h2>
<p>The Pyxis 6K's built-in ND filters — up to 6 stops — are the single quality-of-life improvement that I appreciate most. No more scrambling for matte box and ND filter stacks on documentary or run-and-gun shoots. The BMPCC 4K has no built-in ND, which means external solutions every single time.</p>
<p>Recording media is another gap. The Pyxis 6K records to CFexpress cards and USB-C SSDs. The BMPCC 4K records to CFast — expensive, increasingly hard to find, and slow to transfer.</p>

<h2>The Verdict</h2>
<p>The BMPCC 4K remains one of the best value cinema cameras ever made. If you're starting out, building your first kit, or shooting projects where MFT glass and a compact footprint make sense, it's still worth every dollar.</p>
<p>The Pyxis 6K is for filmmakers who've hit the ceiling of what the BMPCC 4K can offer and want a professional-grade tool that removes friction from the workflow. If you're shooting commercially or doing serious narrative work, the upgrade is worth it.</p>
    `,
  },
  {
    slug: '3-node-davinci-resolve-grade-that-actually-works',
    title: '3-Node Color Grading in DaVinci Resolve That Actually Works',
    category: 'Tutorial',
    date: 'May 20, 2026',
    readTime: '6 min read',
    excerpt:
      'Most tutorials overcomplicate color grading. This is the exact 3-node workflow I use on every Blackmagic RAW project — clean, fast, and repeatable.',
    coverImage: 'https://img.youtube.com/vi/KXsOoeyBQsM/hqdefault.jpg',
    author: 'Aaron Stowers',
    tags: ['DaVinci Resolve', 'Color Grading', 'Tutorial', 'BRAW', 'Workflow'],
    content: `
<h2>Why 3 Nodes?</h2>
<p>Color grading tutorials on YouTube typically show 12-node setups with qualifier masks, parallel nodes, layer mixers, and serial chains that would intimidate a NASA engineer. Here's the truth: most professional colorists working on independent films and commercial work use a dead-simple base structure and only add complexity when the image demands it.</p>
<p>Three nodes. Every project. Every camera. Let me walk you through exactly what each node does and why this structure works.</p>

<h2>Node 1: Technical Correction (Balance)</h2>
<p>Node 1 is never creative. Its only job is to get the image to a technically neutral starting point.</p>
<ul>
<li><strong>Lift/Gamma/Gain wheels</strong> — set black level, midtone exposure, and highlight ceiling</li>
<li><strong>Color wheels offset</strong> — remove any color cast from the sensor or lighting</li>
<li><strong>Log wheels</strong> — if shooting LOG, bring the image to a workable viewing gamma</li>
</ul>
<p>On Blackmagic RAW footage, I typically keep Node 1 purely technical — set my blacks so they're sitting around IRE 8-12, pull highlights down if they're clipping, and remove the green-teal cast that BRAW can have in shadow regions.</p>
<blockquote>Rule: if you're making a creative decision in Node 1, you've already made a mistake.</blockquote>

<h2>Node 2: Color & Saturation</h2>
<p>Node 2 is where the look starts to take shape. With a balanced image from Node 1 feeding into it, Node 2 handles:</p>
<ul>
<li><strong>Hue vs. Saturation curves</strong> — pull down specific saturation on skin tones or push up blues in sky</li>
<li><strong>Hue vs. Hue</strong> — shift foliage green toward a warmer, filmic yellow-green</li>
<li><strong>Hue vs. Luminance</strong> — control how bright specific colors are (critical for teal shadows)</li>
<li><strong>Custom curves</strong> — your S-curve or contrast adjustment lives here</li>
</ul>
<p>I typically use Node 2 to push my shadows slightly teal-green (a Detroit-industrial influence) and warm my highlights toward amber. This is where my custom LUT or PowerGrade is applied if I'm using one.</p>

<h2>Node 3: Finishing & Vignette</h2>
<p>Node 3 is the last thing the image passes through before delivery. It handles global finishing touches:</p>
<ul>
<li><strong>Vignette</strong> — subtle darkening of corners draws the eye to center frame</li>
<li><strong>Final saturation trim</strong> — sometimes the overall saturation needs a 5% push or pull after Node 2</li>
<li><strong>Noise reduction</strong> — if the clip needs it, add Temporal NR here so it's isolated and easy to remove</li>
<li><strong>Film grain</strong> — Dehancer or FilmConvert plugin gets added on a node after Node 3, or directly on Node 3 if I'm not using a plugin</li>
</ul>

<h2>When to Break the Rules</h2>
<p>This 3-node structure is a starting point, not a prison. I add nodes when:</p>
<ul>
<li>A shot has a difficult window with blown highlights that needs a mask</li>
<li>Skin tones need isolated correction without affecting the background</li>
<li>I'm doing heavy sky replacement prep work</li>
<li>A creative effect (split toning, bleach bypass) requires its own isolated node</li>
</ul>
<p>But for 80% of the clips on any given project, this 3-node structure gets me to a finished grade in under 5 minutes per shot.</p>

<h2>Applying It Across the Edit</h2>
<p>Once you've graded your hero shot (usually the first close-up or the establishing shot), use DaVinci's <strong>Remote Grades</strong> or <strong>Stills</strong> workflow to apply the base grade across the entire timeline. Then only adjust the clips that genuinely need it.</p>
<p>This approach — grade one shot brilliantly, distribute it intelligently — is how professional colorists work efficiently on real projects without burning out.</p>
    `,
  },
  {
    slug: 'nisi-athena-14mm-shooting-wide-on-cinema-camera',
    title: 'NiSi Athena 14mm T2.4 — Shooting Wide on a Cinema Camera',
    category: 'Lens Review',
    date: 'May 12, 2026',
    readTime: '7 min read',
    excerpt:
      "The NiSi Athena 14mm T2.4 is an ultra-wide cinema prime that punches hard for its price. I tested it on the Blackmagic Pyxis 6K in North Rosedale Park — here's everything I found.",
    coverImage: '/mct-nisi-3.png',
    author: 'Aaron Stowers',
    tags: ['NiSi', 'Lens Review', 'Wide Angle', 'Cinema Lens', 'Pyxis 6K'],
    content: `
<h2>Why the 14mm Matters</h2>
<p>Ultra-wide lenses are unforgiving. They expose every optical weakness — distortion, chromatic aberration, vignetting, corner softness, flare — in ways that a 50mm can hide. When a 14mm lens handles all of those challenges well, it's genuinely remarkable.</p>
<p>The NiSi Athena 14mm T2.4 is a cinema prime built for full-frame sensors, available in PL, Sony E, Canon RF, L-mount, and Fujifilm G-mount. I tested the PL version with a PL-to-L adapter on the Blackmagic Pyxis 6K, shooting in BRAW 3:1 across a morning shoot in North Rosedale Park, Detroit.</p>

<div class="my-8 text-center">
  <a href="https://amzn.to/3Sv1Pck" target="_blank" rel="noopener noreferrer" class="inline-block hover:opacity-90 transition-opacity">
    <img src="/nisi-athena-detail-2.png" alt="NiSi Athena 14mm T2.4 side profile" class="mx-auto max-w-full md:max-w-2xl border border-outline-variant/30 shadow-md hover:border-primary/50 transition-colors duration-300" />
  </a>
  <p class="text-xs text-on-surface-variant font-mono mt-2">The NiSi Athena 14mm T2.4 prime cinema lens profile. (Click to view on Amazon ↗)</p>
</div>

<h2>The Athena Prime Lineup</h2>
<p>The Athena series now includes 8 focal lengths to cover almost any setup: 14mm T2.4, 18mm T2.2, 25mm T1.9, 35mm T1.9, 40mm T1.9, 50mm T1.9, 85mm T1.9, and 135mm T2.2. A key design highlight is that the core lenses (except the 135mm) are color-matched and share the exact same weight (around 800g depending on mount) and outer diameter. This is a game-changer for speed on set, allowing you to swap focal lengths on a gimbal or matte box setup without rebalancing or repositioning follow-focus motors.</p>

<div class="my-8 text-center">
  <a href="https://amzn.to/4v0bHby" target="_blank" rel="noopener noreferrer" class="inline-block hover:opacity-90 transition-opacity">
    <img src="/nisi-athena-beauty.jpg" alt="NiSi Athena Primes 25mm and 50mm" class="mx-auto max-w-full md:max-w-3xl border border-outline-variant/30 shadow-md hover:border-primary/50 transition-colors duration-300" />
  </a>
  <p class="text-xs text-on-surface-variant font-mono mt-2">The color-matched Athena series primes sharing unified center weights. (Click to view on Amazon ↗)</p>
</div>

<h2>Build Quality & Filter Systems</h2>
<p>Cinema-spec build is present throughout. The barrel is fully metal, the focus ring features 300° of smooth rotation with fluorescent scale markings, and the T-stop markings are engraved and painted. The lens exhibits virtually zero focus breathing, which is essential for precise pull-focus or rack-focus work.</p>
<p>At 14mm, the front element is bulbous and does not support standard front filters (unlike the 18mm to 85mm lenses which feature a unified 77mm thread). Instead, NiSi has integrated a rear drop-in filter slot on the mirrorless mounts (E, RF, L), whereas the PL-mount version utilizes rear screw-on filters. If you want to use front filtration, you will need to utilize a matte box with an 80mm clamp-on ring.</p>

<div class="my-8 text-center">
  <a href="https://amzn.to/4v0bHby" target="_blank" rel="noopener noreferrer" class="inline-block hover:opacity-90 transition-opacity">
    <img src="/nisi-athena-detail-1.png" alt="NiSi Athena Primes on grid mat" class="mx-auto max-w-full md:max-w-3xl border border-outline-variant/30 shadow-md hover:border-primary/50 transition-colors duration-300" />
  </a>
  <p class="text-xs text-on-surface-variant font-mono mt-2">Detailed view of gears and mechanics on a cutting mat. (Click to view on Amazon ↗)</p>
</div>

<h2>Sharpness & Rendering</h2>
<p>Center sharpness wide open at T2.4 is exceptional — clinical and high-contrast without feeling sterile. The micro-contrast rendering gives textures (brick, bark, concrete) a genuine three-dimensionality that is rare at this price tier.</p>

<div class="my-8 text-center">
  <a href="https://amzn.to/4v0bHby" target="_blank" rel="noopener noreferrer" class="inline-block hover:opacity-90 transition-opacity">
    <img src="/nisi-athena-lineup.jpg" alt="NiSi Athena 50mm focus test chart" class="w-full h-auto border border-outline-variant/30 shadow-md hover:border-primary/50 transition-colors duration-300" />
  </a>
  <p class="text-xs text-on-surface-variant font-mono mt-2">Calibration target testing center sharpness and contrast rendering. (Click to view on Amazon ↗)</p>
</div>

<p>Corner sharpness at T2.4 on full frame drops slightly but recovers completely by T4. For most wide-angle applications — establishing shots, environmental portraits, landscape work — the corner performance at T2.4 is entirely acceptable. Stop down to T4 if you need edges to match center.</p>

<blockquote>On the Pyxis 6K's full-frame sensor, the 14mm gives you approximately a 114° diagonal field of view (approx. 104° horizontal). Pair this with handheld shooting: the ultra-wide field of view naturally dampens micro-jitter and camera shake, resulting in organic, smooth tracking shots that look beautiful even without a heavy stabilizer rig.</blockquote>

<h2>Distortion & Chromatic Aberration</h2>
<p>Remarkably, for a 14mm lens at such an ultra-wide angle, I really didn't notice any barrel distortion during my testing. While a tiny amount of regular barrel distortion is technically expected in optics at this focal length, in real-world use it is virtually imperceptible. This makes it incredibly clean for architectural lines or straight horizons without requiring heavy software correction in post.</p>
<p>Lateral chromatic aberration is also exceptionally well controlled. Even when pushing underexposed shadow areas by +2 stops in DaVinci Resolve, I saw only minimal fringing on high-contrast edges — far cleaner than most ultra-wides in this category.</p>

<h2>Flare Character</h2>
<p>Shooting into the early morning sun in North Rosedale Park, the Athena produced controlled veiling flare with warm, diffused streaks. No sharp geometric artifacts from coatings. The look is organic and cinematic without feeling like a gimmick.</p>
<p>For cinematographers who incorporate practical lights and motivated flares into their work — shooting into street lights, through windows — the Athena's flare character is something you can actually use creatively rather than fight.</p>

<div class="my-8 text-center">
  <a href="https://www.amazon.com/s?k=Blackmagic+Pyxis+6K&tag=Khoc-20" target="_blank" rel="noopener noreferrer" class="inline-block hover:opacity-90 transition-opacity">
    <img src="/mct-nisi-1.png" alt="Aaron Stowers on set in Detroit" class="w-full h-auto border border-outline-variant/30 shadow-md hover:border-primary/50 transition-colors duration-300" />
  </a>
  <p class="text-xs text-on-surface-variant font-mono mt-2">Field testing the Athena primes natively on the Blackmagic Pyxis 6K camera rig. (Click to view camera on Amazon ↗)</p>
</div>

<h2>The Bottom Line</h2>
<p>At approximately $1,349 individual retail price, the NiSi Athena 14mm T2.4 sits in a fascinating gap in the market: above budget Rokinon/Samyang cinema primes, below Leica and Zeiss cinema glass. For independent filmmakers and smaller commercial productions, it delivers optical performance that would have cost 3-4× as much five years ago.</p>
<p>If you're building a cinema prime set and need a reliable, high-performing ultra-wide that won't embarrass itself on a full-frame sensor, the NiSi Athena 14mm T2.4 earns a firm recommendation.</p>

<div class="my-8 text-center">
  <a href="https://amzn.to/4v0bHby" target="_blank" rel="noopener noreferrer" class="inline-block hover:opacity-90 transition-opacity">
    <img src="/nisi-athena-detail-3.png" alt="NiSi Athena Prime 5-lens carrying case kit" class="mx-auto max-w-full md:max-w-2xl border border-outline-variant/30 shadow-md hover:border-primary/50 transition-colors duration-300" />
  </a>
  <p class="text-xs text-on-surface-variant font-mono mt-2">The complete NiSi Athena Prime 5-lens carrying case kit. (Click to view on Amazon ↗)</p>
</div>

<div class="note-callout">
  <strong>Placement logic at a glance:</strong> Hero + lineup + group shots go where the text makes a structural claim (this is the lens, this is the family, this is the part). Sample frames go where the text makes a performance claim (sharp, clean, flares well) — readers want photographic proof at exactly that point, not text alone. Detail/macro shots go where the text gets mechanical (filters, focus ring, mount). Keep one image style per section so the eye doesn't have to recalibrate between "this is marketing" and "this is a test result" too often.
</div>
    `,
  },
  {
    slug: 'solidpod-ssd-storage-cinema-raw-workflow',
    title: 'Why I Switched to SSD Storage for My Cinema RAW Workflow',
    category: 'Workflow',
    date: 'May 5, 2026',
    readTime: '5 min read',
    excerpt:
      "CFast cards are expensive and becoming obsolete. The SolidPod CFast-to-SSD adapter changed how I manage storage on every shoot. Here's the real-world breakdown.",
    coverImage: 'https://img.youtube.com/vi/6yEoR5cDjzw/hqdefault.jpg',
    author: 'Aaron Stowers',
    tags: ['Storage', 'CFast', 'SSD', 'SolidPod', 'Workflow', 'BMPCC'],
    content: `
<h2>The CFast Problem</h2>
<p>CFast 2.0 cards deliver excellent sustained write speeds — fast enough for Blackmagic RAW at 12:1 or even 3:1 on the BMPCC 4K. The problem isn't performance. It's economics and ecosystem fragility.</p>
<p>A 256GB CFast 2.0 card costs $150-200 from reputable brands. They're increasingly difficult to source. Transfer speeds to your editing workstation via a CFast reader are bottlenecked. And if a card fails — which they do, more often than SSDs — you're losing irreplaceable footage with very little warning.</p>
<p>I spent too long accepting this as the cost of shooting on professional cinema cameras. Then the SolidPod showed up.</p>

<h2>What the SolidPod Actually Is</h2>
<p>The SolidPod is a hardware adapter that converts a standard M.2 NVMe SSD into a CFast form factor device. You install any compatible M.2 SSD into the SolidPod housing, and the camera sees it as a CFast 2.0 card.</p>
<blockquote>This changes the economics completely. A 1TB Samsung 990 Pro NVMe SSD costs around $80. In a SolidPod housing, that becomes 1TB of cinema-grade recording media for a fraction of the CFast price.</blockquote>

<h2>Real-World Performance</h2>
<p>On the BMPCC 4K, I tested BRAW at 3:1 (highest quality, largest file size) with a Samsung 970 EVO Plus 1TB in the SolidPod. No dropped frames across a continuous 45-minute recording session. The adapter maintains write speeds well within the sustained throughput required for RAW cinema.</p>
<p>Transfer to my Mac via USB 3.1 enclosure is significantly faster than CFast readers — I'm seeing 400-500MB/s reads vs 100-150MB/s on budget CFast readers.</p>

<h2>The Setup Process</h2>
<p>Installing an SSD into the SolidPod takes about 3 minutes. The housing disassembles with a coin (no tools required), the M.2 drive seats on a standard slot, and the unit reassembles securely. I format the SolidPod directly in the camera (BMPCC 4K does this in 30 seconds) and it's ready to record.</p>
<p>At the end of the shoot, I pull the SolidPod, drop it into an M.2 NVMe enclosure, and ingest directly into my RAID at full NVMe speed. No CFast reader required. No separate card reader to forget in the rush of a wrap.</p>

<h2>Reliability Considerations</h2>
<p>NVMe SSDs have significantly longer rated endurance than CFast cards — measured in terabytes written (TBW) rather than a finite number of write cycles. A quality 1TB NVMe is rated for 600-1200TBW. At 50GB per shoot day (BRAW 3:1, Pyxis 6K), that's over 10,000 shoot days before approaching rated endurance limits.</p>
<p>I carry two SolidPods per shoot as redundancy — the same discipline you'd apply to CFast cards. Both are labeled, formatted, and ready before the first shot rolls.</p>

<h2>The One Caveat</h2>
<p>Not all M.2 NVMe drives are compatible. The SolidPod website maintains a tested compatibility list. I stick to Samsung 970/980/990 series and WD SN850 series — both are tested and reliable. Generic or budget NVMe drives may have controller compatibility issues.</p>
<p>Do your research before buying random drives. The $20 you save buying off-brand is not worth discovering incompatibility on a shoot day.</p>

<h2>Final Verdict</h2>
<p>If you're still buying CFast cards for your cinema workflow, stop. The SolidPod + quality NVMe SSD delivers equal or better performance at dramatically lower cost, with better longevity and a simpler ingest workflow. It's the storage upgrade that made me genuinely rethink my entire media management system.</p>
    `,
  },
  {
    slug: 'smallrig-bmpcc-4k-cage-review-build',
    title: 'SmallRig Cage for BMPCC 4K — Build, Balance, and What to Add First',
    category: 'Gear Review',
    date: 'April 28, 2026',
    readTime: '9 min read',
    excerpt:
      "The BMPCC 4K is useless out of the box for serious shoots. The right cage transforms it. Here's the SmallRig setup I built, what it cost, and what I'd change if I was starting over.",
    coverImage: 'https://img.youtube.com/vi/QoB6G5fc37E/hqdefault.jpg',
    author: 'Aaron Stowers',
    tags: ['SmallRig', 'BMPCC 4K', 'Camera Cage', 'Rigging', 'Gear Review'],
    content: `
<h2>Why Every BMPCC 4K Needs a Cage</h2>
<p>The Blackmagic Pocket Cinema Camera 4K is a remarkable sensor package stranded inside a compromised form factor. The grip is awkward. The battery drains in 45 minutes on a good day. There are no mounting points for accessories. The HDMI port is exposed and fragile. A cage addresses every single one of these problems.</p>
<p>The SmallRig cage system for the BMPCC 4K has been the industry standard choice for independent cinematographers since the camera launched. After two years of running this rig on short films, documentary work, and commercial shoots across Detroit, here's my real assessment.</p>

<h2>The SmallRig Cage: What It Includes</h2>
<p>The SmallRig Basic Kit for the BMPCC 4K (part #2203) includes the cage body and one top handle. This is the starting point, not the finished build. The cage itself is CNC-machined aluminum — well-finished, no sharp edges, thread quality is solid throughout.</p>
<p>The side 15mm rod ports are positioned correctly for matte boxes and follow focus systems. The bottom plate mounts directly to standard 15mm rail systems. Top NATO rail accepts handles, monitors, and wireless follow focus receivers.</p>
<blockquote>The cage transforms a $1,300 camera that feels like a consumer product into something that looks and handles like professional cinema equipment. That matters on set — both functionally and for client confidence.</blockquote>

<h2>The Build I'm Running</h2>
<p>After two years of iteration, here's what I'm running:</p>
<ul>
<li><strong>SmallRig Cage #2203</strong> — the foundation</li>
<li><strong>SmallRig Top Handle #1984</strong> — for run-and-gun and handheld work</li>
<li><strong>SmallRig 15mm rod system</strong> — 15cm rods, front rod clamp</li>
<li><strong>Tilta Nucleus-Nano follow focus</strong> — wireless, lightweight, precise</li>
<li><strong>SmallHD Focus 5" monitor</strong> — on a magic arm off the NATO rail</li>
<li><strong>Dual V-lock plate</strong> — powers both the camera and monitor simultaneously</li>
<li><strong>HDMI lock</strong> — SmallRig makes a specific HDMI cable clamp for the BMPCC 4K that's saved me from a ruined cable connector three times</li>
</ul>

<h2>Balance & Weight</h2>
<p>A fully rigged BMPCC 4K with the above setup runs around 4.5 kg (10 lbs) including a medium-weight cinema lens. This is manageable for handheld but demands a proper grip technique — the camera is too front-heavy for casual one-hand operation.</p>
<p>On a gimbal (I use a DJI Ronin-S), the rig balances well once you remove the top handle and fold the monitor arm. Gimbal setups with the BMPCC 4K require patience to balance but hold their calibration reliably across a shoot day.</p>

<h2>What I'd Do Differently Starting Over</h2>
<p>The V-lock plate system is bulkier than I'd like. If I was starting the build fresh today, I'd look at the SmallRig L-bracket + NPF battery plate solution — smaller, lighter, and more modular. V-lock makes sense for the Pyxis 6K, but for the BMPCC 4K form factor, it adds unnecessary bulk.</p>
<p>I'd also invest in the Tilta battery grip plate for the BMPCC 4K from day one. It extends battery life to around 2.5 hours per charge using LP-E6 batteries (which you likely already have from other cameras), and improves the grip ergonomics dramatically.</p>

<h2>The SmallRig Ecosystem Advantage</h2>
<p>The biggest argument for SmallRig over boutique competitors is ecosystem depth. Every piece of SmallRig hardware is designed to work with every other piece. Rods, clamps, handles, plates — they all speak the same thread language. When you're building out a rig over time with a limited budget, this interoperability is worth more than the marginal quality difference you'd get from premium alternatives.</p>
<p>Two years in, my SmallRig cage shows no wear, threads are still tight, and the anodizing hasn't chipped. For the price, that's exactly what you need it to do.</p>
    `,
  },
];
