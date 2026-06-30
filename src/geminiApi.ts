// Gemini 2.5 Flash API integration for YouTube SEO Optimization
// Uses the dedicated AI Studio API key or falls back to the YouTube key
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_YOUTUBE_API_KEY;
const MODEL_FLASH_LATEST = 'gemini-flash-latest';
const MODEL_2_5_LITE = 'gemini-2.5-flash-lite';
const MODEL_FLASH_LITE_LATEST = 'gemini-flash-lite-latest';
const MODEL_3_5 = 'gemini-3.5-flash';
const MODEL_2_5 = 'gemini-2.5-flash';
const MODEL_2_0 = 'gemini-2.0-flash';

const getBaseUrlForModel = (model: string) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

export interface VideoSeoInput {
  title: string;
  description: string;
  keyword: string;
  scriptOutline: string;
  thumbnailImage?: { mimeType: string; data: string }; // Optional base64 thumbnail image
}

export interface VideoSeoTitle {
  text: string;
  score: number;
  explanation: string;
  synergyRating?: number;
}

export interface VideoSeoOutput {
  score: number;
  titles: VideoSeoTitle[];
  descriptionHook: string;
  descriptionBody: string;
  tagsUsedInDescription: string[];
  chapters: string;
  tags: string[];
  retentionAdvisory: string;
  companionArticle: string;
  affiliateProducts: {
    name: string;
    category: string;
    explanation: string;
    searchKeywords: string;
  }[];
  merchConcepts: {
    title: string;
    designIdea: string;
    tagline: string;
  }[];
  socialDistribution: {
    instagram: {
      caption: string;
      hook: string;
      hashtags: string[];
      thumbnailCropSuggestion: string;
      cta: string;
    };
    facebook: {
      caption: string;
      articleLinkPlaceholder: string;
      youtubeLinkPlaceholder: string;
      cta: string;
      hashtags: string[];
    };
    tiktok: {
      caption: string;
      hook: string;
      hashtags: string[];
      soundRecommendation: string;
    };
    reddit: {
      title: string;
      postBody: string;
      targetSubreddits: string[];
      ctaComment: string;
    };
  };
  thumbnailScore?: number; // Visual score (0-100)
  thumbnailFeedback?: string; // Visual feedback on thumbnail composition/text
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    // Quick quota check on 429 to skip retries and fail fast
    if (response.status === 429) {
      try {
        const bodyClone = response.clone();
        const errJson = await bodyClone.json();
        const errMsg = errJson?.error?.message?.toLowerCase() || '';
        if (errMsg.includes('quota') || errMsg.includes('billing') || errMsg.includes('exceeded your current quota')) {
          console.warn(`Gemini API quota/billing exhausted (429) on URL ${url}. Skipping retries.`);
          return response;
        }
      } catch (e) {
        // Continue to retry if json parsing fails
      }
    }
    
    // Retry on 503 (Service Unavailable), 429 (Too Many Requests), or 504 (Gateway Timeout)
    if ((response.status === 503 || response.status === 429 || response.status === 504) && retries > 0) {
      console.warn(`Gemini API returned status ${response.status}. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      console.warn(`Gemini API request failed with error: ${error}. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function generateVideoSeo(input: VideoSeoInput): Promise<VideoSeoOutput> {
  if (!API_KEY) {
    throw new Error('VITE_YOUTUBE_API_KEY is not defined in the environment.');
  }

  const prompt = `You are a world-class YouTube Growth & Cinematography SEO consultant. 
Your goal is to optimize the provided video details for maximum Search visibility, high Click-Through Rate (CTR), and optimal Audience Retention.

To do this, you MUST follow these specific YouTube Best Practices (TubeBuddy-Based Rules):
1. Target Keyword: Optimize around the single target keyword phrase: "${input.keyword}".
2. Title Keyword Placement: Naturally include this target keyword phrase early in the title, ideally within the first 60 characters.
3. Title Keyword Match: Every suggested title MUST include the exact target keyword phrase (or at least 80% of it) AND at least one other highly relevant tag from your generated tags list (e.g. "Dehancer", "DaVinci Resolve", "film emulation", or "color grade") to satisfy TubeBuddy's title-tag match criteria.
4. Title Length: Provide alternative titles that are 53-70 characters long (ideal to prevent search layout truncation). Hard limit is 100 characters.
5. Description Hook: Include the target keyword phrase naturally within the first 200 characters of the description.
6. First Two Sentences: The first two sentences must clearly describe the video and include the keyword naturally.
7. Description Body: Generate an optimized description body of 300-400 words. You must naturally and organically weave in at least 8-12 tags from your generated tags list into this description body. Make it read like engaging, high-quality, professional prose — do NOT use keyword stuffing or list-like structures.
8. Anti-Hallucination Protocol: You must be extremely accurate and literally truthful based ONLY on the provided script, outline, or transcript.
   - NEVER claim or imply the video covers details, breakdowns, or steps that are not explicitly stated in the script/outline/transcript.
   - If the script/outline/transcript mentions that this video is NOT a deep dive, or that a detailed walkthrough will be covered in a follow-up video, the description must state this context (e.g., mention it is Part 1 of the series, an overview/introduction, or that a detailed breakdown is coming in a future video) and NOT falsely promise a deep dive.
9. Tags Order & Structure: The first recommended tag MUST be the exact target keyword phrase. Add 20-30 closely related tag variations, common search queries, and long-tail phrases to maximize search coverage. The total character count of all tags combined when joined by commas MUST be between 440 and 495 characters (very close to the 500-character limit, but under it). This is critical to satisfy TubeBuddy's tag length check. Prefer phrase-based tags over generic single-word tags.
10. Chapters: Generate timestamped chapters if the script outline supports them. Include the keyword naturally in at least one chapter title.
11. Script Check: Analyze whether the target keyword is spoken naturally in the script/transcript. Offer tips on this in the retention advisor if it's missing or underutilized.
12. Companion Article: Generate a structured companion website article/blog post (300-400 words) summarizing this video. The article must write engaging prose explaining the topics, include section headings (formatted in Markdown like "### Section Title"), outline key actionable takeaways, and end with a call-to-action to subscribe to the channel and check out the resources.
13. Amazon Affiliate Matcher: Scan the transcript, outline, or video details for hardware, cameras, lenses, filters, desks, accessories, software, or other tools. Suggest 3-6 product items/categories that are highly relevant to the video (e.g. "DaVinci Resolve Micro Panel", "editing panel", "external SSD", "lighting"). For each product, provide: its name, product category, a brief 1-sentence explanation of why it is recommended, and a specific search phrase/keywords (like "datacolor spyderx pro") that can be appended to an Amazon search query to locate it.
14. Merch Matcher: Brainstorm 2 creative, catchy merchandise apparel designs (T-shirt, hoodie, or hat concepts) inspired by the video's theme, thumbnail text, script hooks, or jokes (e.g. "3 Nodes. That's It.", or "I Grade in Nodes"). For each concept, return a title, a brief design idea explanation (what visual print should be on the shirt), and a matching tagline.
15. Social Distribution (Draft Captions): Generate platform-optimized promo captions:
    - facebook: A Page post containing:
      - caption: A friendly, conversational body copy explaining the video's core value.
      - articleLinkPlaceholder: A placeholder string for the companion article link.
      - youtubeLinkPlaceholder: A placeholder string for the YouTube video link.
      - cta: A strong call-to-action prompting readers to click the links.
      - hashtags: 2-3 relevant hashtags.
    - instagram: An Instagram post or Reel caption containing:
      - caption: A shorter, high-impact caption.
      - hook: A compelling visual-first hook to grab scroll attention.
      - hashtags: 3 to 8 relevant hashtags.
      - thumbnailCropSuggestion: Visual instructions on how to crop or frame the image/video for vertical Reel format.
      - cta: A strong link-in-bio call-to-action.
    - tiktok: A TikTok caption containing:
      - caption: A punchy, brief caption (max 100 characters).
      - hook: A fast-paced initial visual/text hook.
      - hashtags: 3 to 5 trending-style hashtags.
      - soundRecommendation: Suggestions for background audio mood (e.g. "Low-fi hip hop, retro synthwave").
    - reddit: A subreddit-friendly text post containing:
      - title: A casual, curiosity-driven, community-friendly title (e.g. "Just tested the Pyxis 6K with NiSi Athena lenses, here's my honest take on the skin tones" or "My DaVinci Resolve color node tree template for film emulation (free download/breakdown)"). Do NOT write it like a clickbait YouTube title.
      - postBody: A detailed, value-first, conversational text post (250-350 words) written in a raw, peer-to-peer style (no marketing buzzwords, no emojis, no hashtags). Share a specific tip, grading node technique, or lesson learned in the video. It must read 100% naturally as a human filmmaker sharing knowledge.
      - targetSubreddits: An array of 2-3 specific, relevant subreddits (e.g., ["r/davinciresolve", "r/colorists", "r/videography", "r/filmmakers", "r/blackmagicdesign"]).
      - ctaComment: A friendly, casual draft comment to post under the thread containing the YouTube link: "If anyone wants to see the visual footage / node tree walkthrough, I uploaded the full breakdown here: [YouTube Link]" or similar.

Video Inputs:
- Target Keyword/Topic: "${input.keyword}"
- Draft Title: "${input.title}"
- Draft Description: "${input.description}"
- Script/Outline/Transcript: "${input.scriptOutline}"

${input.thumbnailImage ? `An image of the video thumbnail is also attached. You must audit it with critical rigor and brutal honesty:
16. Contrast & Subject: Is it bright, compelling, and high-resolution? Call out if contrast is low or subjects are cluttered/muddy.
17. Legibility: Is any overlay text readable on small mobile screens? Identify any small/thin fonts or low-contrast text that fails readability.
18. Mismatch Warning: Does the visual subject conflict with the video content or keyword?
19. Title-Thumbnail Synergy: Does the thumbnail visual or text align with the suggested titles? Recommend titles that explicitly refer to visual cues/text in the thumbnail.
Be brutally and critically honest. Do not give false praise or sugarcoat your feedback.` : `No thumbnail image is provided. IMPORTANT: You MUST NOT populate the 'thumbnailScore' or 'thumbnailFeedback' fields in your output. Leave them completely out of the response. If you generate values for these when no image is provided, it is a strict hallucination failure.`}

You must analyze these inputs against all the above rules and return your optimization results as a single raw JSON object. Do NOT wrap the JSON in markdown code blocks like \`\`\`json. Return ONLY the JSON object.

The JSON object must match the following TypeScript interface exactly:
interface VideoSeoTitle {
  text: string; // The suggested title (53-70 characters, keyword early, includes 1-2 tags from tags list).
  score: number; // An estimated CTR/SEO rank score from 0 to 100 for this specific title.
  explanation: string; // A brief explanation (1 sentence) of why this title was recommended.
  synergyRating?: number; // (ONLY if thumbnail is provided) A score from 0 to 100 rating this title's visual alignment with the thumbnail (e.g., how well it links with text like "three nodes").
}

interface AffiliateProduct {
  name: string;
  category: string;
  explanation: string;
  searchKeywords: string;
}

interface MerchConcept {
  title: string;
  designIdea: string;
  tagline: string;
}

interface SocialDistribution {
  instagram: string;
  facebook: string;
  tiktok: string;
  reddit: string;
}

interface VideoSeoOutput {
  score: number; // A score from 0 to 100 indicating how well optimized this video metadata is overall.
  titles: VideoSeoTitle[]; // 5 high-CTR, compelling alternative title ideas.
  descriptionHook: string; // The optimized first 3 lines of the description (max 150 characters) designed to maximize search CTR.
  descriptionBody: string; // The full 300-400 word optimized body weaving 8-12 tags from the tags list.
  tagsUsedInDescription: string[]; // List of tags from the tags list that you successfully wove into descriptionBody.
  chapters: string; // A timestamped chapter listing.
  tags: string[]; // 20 to 30 highly relevant SEO keywords/tags.
  retentionAdvisory: string; // Actionable scripting recommendations (3 bullet points).
  companionArticle: string; // Structured 300-400 word blog post with headings and CTA.
  affiliateProducts: AffiliateProduct[]; // 3-6 relevant Amazon gear recommendations.
  merchConcepts: MerchConcept[]; // 2 custom My Cine Toolbox merch apparel ideas.
  socialDistribution: SocialDistribution; // IG, FB, and TikTok draft captions.
  thumbnailScore?: number; // ONLY if a thumbnail image was provided.
  thumbnailFeedback?: string; // ONLY if a thumbnail image was provided.
}`;

  const parts: any[] = [
    { text: prompt }
  ];

  if (input.thumbnailImage) {
    parts.push({
      inlineData: {
        mimeType: input.thumbnailImage.mimeType,
        data: input.thumbnailImage.data
      }
    });
  }

  const requestBody = {
    contents: [
      {
        parts: parts,
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          score: { type: 'INTEGER' },
          titles: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                text: { type: 'STRING' },
                score: { type: 'INTEGER' },
                explanation: { type: 'STRING' },
                synergyRating: { type: 'INTEGER' }
              },
              required: ['text', 'score', 'explanation']
            }
          },
          descriptionHook: { type: 'STRING' },
          descriptionBody: { type: 'STRING' },
          tagsUsedInDescription: {
            type: 'ARRAY',
            items: { type: 'STRING' }
          },
          chapters: { type: 'STRING' },
          tags: {
            type: 'ARRAY',
            items: { type: 'STRING' }
          },
          retentionAdvisory: { type: 'STRING' },
          companionArticle: { type: 'STRING' },
          affiliateProducts: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                name: { type: 'STRING' },
                category: { type: 'STRING' },
                explanation: { type: 'STRING' },
                searchKeywords: { type: 'STRING' }
              },
              required: ['name', 'category', 'explanation', 'searchKeywords']
            }
          },
          merchConcepts: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING' },
                designIdea: { type: 'STRING' },
                tagline: { type: 'STRING' }
              },
              required: ['title', 'designIdea', 'tagline']
            }
          },
          socialDistribution: {
            type: 'OBJECT',
            properties: {
              instagram: {
                type: 'OBJECT',
                properties: {
                  caption: { type: 'STRING' },
                  hook: { type: 'STRING' },
                  hashtags: {
                    type: 'ARRAY',
                    items: { type: 'STRING' }
                  },
                  thumbnailCropSuggestion: { type: 'STRING' },
                  cta: { type: 'STRING' }
                },
                required: ['caption', 'hook', 'hashtags', 'thumbnailCropSuggestion', 'cta']
              },
              facebook: {
                type: 'OBJECT',
                properties: {
                  caption: { type: 'STRING' },
                  articleLinkPlaceholder: { type: 'STRING' },
                  youtubeLinkPlaceholder: { type: 'STRING' },
                  cta: { type: 'STRING' },
                  hashtags: {
                    type: 'ARRAY',
                    items: { type: 'STRING' }
                  }
                },
                required: ['caption', 'articleLinkPlaceholder', 'youtubeLinkPlaceholder', 'cta', 'hashtags']
              },
              tiktok: {
                type: 'OBJECT',
                properties: {
                  caption: { type: 'STRING' },
                  hook: { type: 'STRING' },
                  hashtags: {
                    type: 'ARRAY',
                    items: { type: 'STRING' }
                  },
                  soundRecommendation: { type: 'STRING' }
                },
                required: ['caption', 'hook', 'hashtags', 'soundRecommendation']
              },
              reddit: {
                type: 'OBJECT',
                properties: {
                  title: { type: 'STRING' },
                  postBody: { type: 'STRING' },
                  targetSubreddits: {
                    type: 'ARRAY',
                    items: { type: 'STRING' }
                  },
                  ctaComment: { type: 'STRING' }
                },
                required: ['title', 'postBody', 'targetSubreddits', 'ctaComment']
              }
            },
            required: ['instagram', 'facebook', 'tiktok', 'reddit']
          },
          thumbnailScore: { type: 'INTEGER' },
          thumbnailFeedback: { type: 'STRING' }
        },
        required: ['score', 'titles', 'descriptionHook', 'descriptionBody', 'tagsUsedInDescription', 'chapters', 'tags', 'retentionAdvisory', 'companionArticle', 'affiliateProducts', 'merchConcepts', 'socialDistribution']
      }
    },
  };

  const modelsToTry = [
    MODEL_FLASH_LATEST,
    MODEL_2_5_LITE,
    MODEL_FLASH_LITE_LATEST,
    MODEL_3_5,
    MODEL_2_5,
    MODEL_2_0
  ];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      console.log(`Attempting rank optimization scan using model: ${model}...`);
      const url = `${getBaseUrlForModel(model)}?key=${API_KEY}`;
      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error (${response.status}) on model ${model}: ${errText}`);
      }

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textResponse) {
        throw new Error(`Empty response received from Gemini API using model ${model}.`);
      }

      const result: VideoSeoOutput = JSON.parse(textResponse.trim());
      return result;
    } catch (err: any) {
      console.warn(`Model ${model} failed: ${err.message || err}`);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini models failed to generate SEO recommendations.');
}

export interface OpportunityIdea {
  title: string;
  keyword: string;
  intent: string;
  trendDirection: 'Rising' | 'Stable' | 'Declining' | 'Seasonal';
  competitionLevel: 'Low' | 'Medium' | 'High';
  thumbnailConcept: string;
  outline: string[];
  videoType: string;
  affiliatePotential: string;
  merchPotential: string;
  companionArticlePotential: string;
  socialClipPotential: string;
  hooks: {
    curiosity: string;
    painPoint: string;
    visualAction: string;
  };
  scores: {
    trendScore: number;
    searchIntentScore: number;
    competitionGapScore: number;
    channelFitScore: number;
    affiliatePotentialScore: number;
    merchPotentialScore: number;
    productionDifficultyScore: number;
    overallScore: number;
  };
  aiReasoning: string;
}

export interface OpportunityOutput {
  niche: string;
  opportunities: OpportunityIdea[];
}

export async function generateContentOpportunities(topic: string, extraContext: string = ''): Promise<OpportunityOutput> {
  if (!API_KEY) {
    throw new Error('VITE_YOUTUBE_API_KEY is not defined in the environment.');
  }

  const prompt = `You are a world-class creator strategist and trend forecasting analyst specializing in the cinematography, filmmaking, and color grading niche.
Your goal is to analyze the selected topic category: "${topic}" ${extraContext ? `combined with the following custom creator notes: "${extraContext}"` : ''}.

You must brainstorm 4 to 5 unique, highly specific, and catchy video ideas that Aaron (My Cine Toolbox) should create next.
Aaron's channel profile: Focuses on professional film emulation (Dehancer, FilmConvert), DaVinci Resolve color grading tutorials, Detroit filmmaking community vlogs/interviews, gear reviews (lenses, panels, cameras like Pyxis 6K, NiSi), and apparel merch.

For each video opportunity concept, you must provide:
1. Title: A compelling, high-CTR optimized video title.
2. Keyword: The single best target search keyword phrase to optimize this video around.
3. Intent: The target search intent (e.g. what are colorists/filmmakers searching for?).
4. Trend Direction: Must be exactly one of: "Rising", "Stable", "Declining", "Seasonal".
5. Competition Level: Must be exactly one of: "Low", "Medium", "High".
6. Thumbnail Concept: A detailed visual layout description for a high-CTR thumbnail.
7. Outline: 4 to 6 logical section/talking points or milestones representing the structure of the video.
8. Video Type: The format (e.g. "Tutorial", "Comparison", "Review", "Case Study").
9. Affiliate Potential: A brief sentence on what gear can be linked to generate Amazon affiliate revenue.
10. Merch Potential: Suggestion for apparel merch matching the topic (e.g. taglines/tees).
11. Companion Article: The angle to take for a companion article on the website.
12. Social Clip: The hook idea for short-form clips (Reels, TikToks, Shorts).
13. Score Card Metrics (0-100 rating scale):
    - trendScore: Popularity strength of the topic.
    - searchIntentScore: Value of search volume vs transactional intent.
    - competitionGapScore: Higher score means LOWER competition (a better opportunity gap).
    - channelFitScore: How well it matches Aaron's cinematography and DaVinci Resolve color grading profile.
    - affiliatePotentialScore: Value of hardware/software that can be matched.
    - merchPotentialScore: Adaptability for catchy T-shirt catchphrases.
    - productionDifficultyScore: Ease of production (100 is very easy, 0 is extremely difficult/expensive)     - overallScore: Weighted average of the scores.
14. AI Reasoning: 2-3 sentences justifying why this topic is an active opportunity gap for My Cine Toolbox.
15. High-Retention Hook Strategies: Provide three distinct hook variations:
    - curiosity: A high-interest hook challenging common filmmaker habits.
    - painPoint: An empathy-driven hook targeting a frustrating grading/rigging issue.
    - visualAction: B-roll action description + verbal hook promise.

You must return your results as a single raw JSON object matching the following TypeScript schema. Do NOT wrap the JSON in markdown code blocks like \`\`\`json. Return ONLY the JSON object.

JSON Schema format:
{
  "niche": "Cinematography & Color Grading",
  "opportunities": [
    {
      "title": "string",
      "keyword": "string",
      "intent": "string",
      "trendDirection": "Rising | Stable | Declining | Seasonal",
      "competitionLevel": "Low | Medium | High",
      "thumbnailConcept": "string",
      "outline": ["string", "string"],
      "videoType": "string",
      "affiliatePotential": "string",
      "merchPotential": "string",
      "companionArticlePotential": "string",
      "socialClipPotential": "string",
      "hooks": {
        "curiosity": "string",
        "painPoint": "string",
        "visualAction": "string"
      },
      "scores": {
        "trendScore": number,
        "searchIntentScore": number,
        "competitionGapScore": number,
        "channelFitScore": number,
        "affiliatePotentialScore": number,
        "merchPotentialScore": number,
        "productionDifficultyScore": number,
        "overallScore": number
      },
      "aiReasoning": "string"
    }
  ]
}`;

  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          niche: { type: 'STRING' },
          opportunities: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING' },
                keyword: { type: 'STRING' },
                intent: { type: 'STRING' },
                trendDirection: { type: 'STRING', enum: ['Rising', 'Stable', 'Declining', 'Seasonal'] },
                competitionLevel: { type: 'STRING', enum: ['Low', 'Medium', 'High'] },
                thumbnailConcept: { type: 'STRING' },
                outline: {
                  type: 'ARRAY',
                  items: { type: 'STRING' }
                },
                videoType: { type: 'STRING' },
                affiliatePotential: { type: 'STRING' },
                merchPotential: { type: 'STRING' },
                companionArticlePotential: { type: 'STRING' },
                socialClipPotential: { type: 'STRING' },
                hooks: {
                  type: 'OBJECT',
                  properties: {
                    curiosity: { type: 'STRING' },
                    painPoint: { type: 'STRING' },
                    visualAction: { type: 'STRING' }
                  },
                  required: ['curiosity', 'painPoint', 'visualAction']
                },
                scores: {
                  type: 'OBJECT',
                  properties: {
                    trendScore: { type: 'INTEGER' },
                    searchIntentScore: { type: 'INTEGER' },
                    competitionGapScore: { type: 'INTEGER' },
                    channelFitScore: { type: 'INTEGER' },
                    affiliatePotentialScore: { type: 'INTEGER' },
                    merchPotentialScore: { type: 'INTEGER' },
                    productionDifficultyScore: { type: 'INTEGER' },
                    overallScore: { type: 'INTEGER' }
                  },
                  required: ['trendScore', 'searchIntentScore', 'competitionGapScore', 'channelFitScore', 'affiliatePotentialScore', 'merchPotentialScore', 'productionDifficultyScore', 'overallScore']
                },
                aiReasoning: { type: 'STRING' }
              },
              required: ['title', 'keyword', 'intent', 'trendDirection', 'competitionLevel', 'thumbnailConcept', 'outline', 'videoType', 'affiliatePotential', 'merchPotential', 'companionArticlePotential', 'socialClipPotential', 'hooks', 'scores', 'aiReasoning']
            }
          }
        },
        required: ['niche', 'opportunities']
      }
    }
  };

  const modelsToTry = [
    MODEL_FLASH_LATEST,
    MODEL_2_5_LITE,
    MODEL_FLASH_LITE_LATEST,
    MODEL_3_5,
    MODEL_2_5,
    MODEL_2_0
  ];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      console.log(`Attempting content opportunities generation using model: ${model}...`);
      const url = `${getBaseUrlForModel(model)}?key=${API_KEY}`;
      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error (${response.status}) on model ${model}: ${errText}`);
      }

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textResponse) {
        throw new Error(`Empty response received from Gemini API using model ${model}.`);
      }

      const result: OpportunityOutput = JSON.parse(textResponse.trim());
      return result;
    } catch (err: any) {
      console.warn(`Model ${model} failed: ${err.message || err}`);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini models failed to generate content opportunities.');
}

export async function generateVideoScript(
  title: string,
  keyword: string,
  outline: string[],
  intent: string,
  videoType: string,
  primaryGoal?: string,
  secondaryGoal?: string,
  tertiaryGoal?: string
): Promise<string> {
  if (!API_KEY) {
    throw new Error('VITE_YOUTUBE_API_KEY is not defined in the environment.');
  }

  const prompt = `You are a world-class YouTube scriptwriter specializing in high-retention filmmaking and cinematography videos.
Your goal is to write a complete, engaging, and ready-to-record video script based on these parameters:
- Video Title: "${title}"
- Target Keyword: "${keyword}"
- Target Intent: "${intent}"
- Video Type: "${videoType}"
${primaryGoal ? `- Primary Strategic Goal: "${primaryGoal}"` : ''}
${secondaryGoal ? `- Secondary Strategic Goal: "${secondaryGoal}"` : ''}
${tertiaryGoal ? `- Tertiary Strategic Goal: "${tertiaryGoal}"` : ''}
- Script Outline / Talking Points:
${outline.map((pt, i) => `  ${i + 1}. ${pt}`).join('\n')}

Structure requirements for the script:
1. Hook (First 30 seconds): Start with a high-energy, visual hook. Instantly address the keyword/problem. Do NOT start with "Hey guys, welcome back to my channel". Get straight to the value hook. Customize the hook based on the primary goal (e.g. if Affiliate, highlight product value/problems; if Authority, highlight professional workflow challenges).
2. Intro & Setup: Briefly state what will be covered and establish why the viewer should trust this explanation.
3. Body Segments: Break down each of the talking points from the outline in detail. Write as natural, conversational spoken prose. Include visual/b-roll descriptions in brackets, e.g. [B-Roll: Showing DaVinci node graph]. Customize the content detail to match the strategic goals (e.g. tutorial style if Tutorial; purchase benefits if Affiliate; deep experience analysis if Authority).
4. Outro & Call to Action: Summarize key takeaways, prompt viewers to check out links in the description (like gear, LUT packs, and merch on mycinetoolbox.com), and end with a direct call to subscribe.

Write the full script as engaging, clear, professional cinematography-focused prose. Format the script with clear headings like "## HOOK (0:00 - 0:30)", "## SECTION 1: ...", and include brackets for B-roll cues. Make it read naturally for the speaker.`;

  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ]
  };

  const modelsToTry = [
    MODEL_FLASH_LATEST,
    MODEL_2_5_LITE,
    MODEL_FLASH_LITE_LATEST,
    MODEL_3_5,
    MODEL_2_5,
    MODEL_2_0
  ];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      console.log(`Attempting video script generation using model: ${model}...`);
      const url = `${getBaseUrlForModel(model)}?key=${API_KEY}`;
      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error (${response.status}) on model ${model}: ${errText}`);
      }

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textResponse) {
        throw new Error(`Empty response received from Gemini API using model ${model}.`);
      }

      return textResponse.trim();
    } catch (err: any) {
      console.warn(`Model ${model} failed: ${err.message || err}`);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini models failed to generate the video script.');
}

// ─── Gemini Channel Performance Insights ────────────────────────

export interface AnalyticsInsightsInput {
  totalViews: number;
  totalComments: number;
  totalLikes: number;
  totalShares: number;
  totalWatchTimeMinutes: number;
  avgViewDurationSeconds: number;
  totalSubscribersGained: number;
  days: number;
  topVideos: {
    title: string;
    views: number;
    watchTimeMinutes: number;
    averageViewDurationSeconds: number;
  }[];
}

export interface SuggestedOpportunity {
  title: string;
  keyword: string;
  reasoning: string;
}

export interface ContentPatternDetector {
  winningTopic: string;
  winningFormat: string;
  winningPromise: string;
  winningThumbnailStyle: string;
  winningHook: string;
  recommendationReasoning: string;
}

export interface AnalyticsInsightsOutput {
  performanceSummary: string;
  growthDriverSummary: string;
  retentionWarningSummary: string;
  suggestedOpportunities: SuggestedOpportunity[];
  contentPatternDetector: ContentPatternDetector;
  prioritizedActions: string[];
  confidenceScores: {
    growthDriver: 'HIGH' | 'MEDIUM' | 'LOW';
    retentionWarning: 'HIGH' | 'MEDIUM' | 'LOW';
    patternDetection: 'HIGH' | 'MEDIUM' | 'LOW';
  };
}

export async function generateAnalyticsInsights(
  input: AnalyticsInsightsInput
): Promise<AnalyticsInsightsOutput> {
  if (!API_KEY) {
    throw new Error('VITE_YOUTUBE_API_KEY is not defined in the environment.');
  }

  const prompt = `You are a world-class YouTube Channel Business Strategist and Cinematography Channel Manager. 
Analyze the following channel performance data for the last ${input.days} days and output a strategic action plan.

Channel Stats:
- Total Views: ${input.totalViews}
- Total Subscribers Gained: ${input.totalSubscribersGained}
- Total Watch Time (Minutes): ${input.totalWatchTimeMinutes.toFixed(1)}
- Total Comments: ${input.totalComments}
- Total Likes: ${input.totalLikes}
- Total Shares: ${input.totalShares}
- Channel Avg View Duration: ${Math.floor(input.avgViewDurationSeconds / 60)}m ${input.avgViewDurationSeconds % 60}s

Top Performing Videos:
${input.topVideos.map((v, i) => `
${i + 1}. Title: "${v.title}"
   - Views: ${v.views}
   - Watch Time (Minutes): ${v.watchTimeMinutes.toFixed(1)}
   - Avg View Duration: ${Math.floor(v.averageViewDurationSeconds / 60)}m ${v.averageViewDurationSeconds % 60}s
`).join('\n')}

Instructions:
Evaluate this data and return your suggestions. Provide:
1. performanceSummary: A 2-3 sentence strategic executive summary of channel performance and traction.
2. growthDriverSummary: Analyze which video is driving the most growth (views/subscribers) and explain why this topic is succeeding with the audience.
3. retentionWarningSummary: Call out the video with the lowest view duration relative to others (or compare general retention) and offer 2 practical tips on how to improve script hooks/retention in the next outlines.
4. suggestedOpportunities: Brainstorm a cohesive 4-video campaign cluster (titles, keywords, and reasoning) directly building on the winning pattern, forming a unified topical series rather than separate random uploads.
5. contentPatternDetector: Identify the repeating patterns in your highest-performing video content across these specific parameters:
   - winningTopic: The exact content niche/subject matter (e.g. "DaVinci Resolve / Dehancer Film Emulation")
   - winningFormat: The structural type of the video (e.g. "Practical micro-tutorials")
   - winningPromise: The core value or promise offered to viewers (e.g. "Achieve a cinematic film look with 3 simple nodes")
   - winningThumbnailStyle: The optimal visual elements for clickable thumbnails (e.g. "High contrast software interface mockup + face + bold branding text")
   - winningHook: The high-retention hook phrasing style (e.g. "Stop grading the hard way—here are 3 nodes for an instant film print look")
   - recommendationReasoning: A 1-2 sentence tactical explanation of why the next uploads must adopt this pattern to maintain momentum.
6. prioritizedActions: An array of exactly 3 concise, high-priority actionable recommendations for Aaron based on the findings (e.g., ["Double down on Dehancer Resolve tutorials", "Add a visual hook in the first 5 seconds of lens reviews", "Expand DaVinci Resolve node workflow guides"]).
7. confidenceScores: An object rating your analytical confidence level (must be exactly one of "HIGH", "MEDIUM", "LOW") for each of the following insights, based on data volume (e.g., if views/sample size are low, score confidence is LOW):
   - growthDriver: Confidence in the growth driver signal.
   - retentionWarning: Confidence in the retention warning hook suggestions.
   - patternDetection: Confidence in the content pattern detector recommendations.

You must return your output as a single raw JSON object matching this TypeScript interface exactly:
interface AnalyticsInsightsOutput {
  performanceSummary: string;
  growthDriverSummary: string;
  retentionWarningSummary: string;
  suggestedOpportunities: {
    title: string;
    keyword: string;
    reasoning: string;
  }[];
  contentPatternDetector: {
    winningTopic: string;
    winningFormat: string;
    winningPromise: string;
    winningThumbnailStyle: string;
    winningHook: string;
    recommendationReasoning: string;
  };
  prioritizedActions: string[];
  confidenceScores: {
    growthDriver: 'HIGH' | 'MEDIUM' | 'LOW';
    retentionWarning: 'HIGH' | 'MEDIUM' | 'LOW';
    patternDetection: 'HIGH' | 'MEDIUM' | 'LOW';
  };
}

Do NOT wrap the JSON in markdown code blocks like \`\`\`json. Return ONLY the JSON object.`;

  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ]
  };

  const modelsToTry = [
    MODEL_FLASH_LATEST,
    MODEL_2_5_LITE,
    MODEL_FLASH_LITE_LATEST,
    MODEL_3_5,
    MODEL_2_5,
    MODEL_2_0
  ];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      console.log(`Attempting channel analytics audit using model: ${model}...`);
      const url = `${getBaseUrlForModel(model)}?key=${API_KEY}`;
      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error (${response.status}) on model ${model}: ${errText}`);
      }

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textResponse) {
        throw new Error(`Empty response received from Gemini API using model ${model}.`);
      }

      // Parse JSON safely
      const cleanJson = textResponse
        .replace(/^\s*```json\s*/i, '')
        .replace(/```\s*$/, '')
        .trim();

      const parsed: AnalyticsInsightsOutput = JSON.parse(cleanJson);
      return parsed;
    } catch (err: any) {
      console.warn(`Model ${model} failed to generate analytics insights: ${err.message || err}`);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini models failed to generate channel performance insights.');
}

export const MOCK_ANALYTICS_INSIGHTS: AnalyticsInsightsOutput = {
  performanceSummary: "Your channel has shown substantial growth over the past 30 days, driven by highly engaged editing and post-production communities. Views are up by 12% and subscriber conversions have increased by 21% as your content shifts from simple gear reviews to practical workflows.",
  growthDriverSummary: "The top performing video, 'Cinematic Film Look DaVinci Resolve (Simplified Dehancer Workflow)', represents your strongest audience signal. Viewers are highly responsive to repeatable, step-by-step film emulation techniques in DaVinci Resolve rather than generic gear specs.",
  retentionWarningSummary: "Your older BMPCC cage review and solidpod reviews show lower average view duration (around 18-22% retention). To improve, structure your intros using an immediate value hook (e.g. show the final cinematic graded clip in the first 5 seconds) before discussing cage components.",
  contentPatternDetector: {
    winningTopic: "DaVinci Resolve / Dehancer Film Emulation",
    winningFormat: "Short practical tutorials",
    winningPromise: "Achieve a cinematic film print look with simple 3-node workflows",
    winningThumbnailStyle: "High-contrast software interface panel + finished visual grade + bold typography overlay",
    winningHook: "I stopped grading with complex lut-trees and started using this simple 3-node emulation pipeline.",
    recommendationReasoning: "Adopting this pattern leverages your current evergreen traffic signals, maximizing viewer retention and high-margin affiliate referral conversions."
  },
  suggestedOpportunities: [
    {
      title: "Dehancer DaVinci Resolve: 3 Nodes Film Look Breakdown",
      keyword: "Dehancer DaVinci Resolve",
      reasoning: "A direct micro-tutorial demonstrating how to construct a fast, robust film grade using only 3 nodes. High search intent and perfect match with your top-performing video's audience."
    },
    {
      title: "Dehancer vs FilmConvert: Which Looks More Like Real Film?",
      keyword: "Dehancer vs FilmConvert",
      reasoning: "A side-by-side emulation test comparing print grain, halation, and color curves. Perfect visual hook for filmmakers debating post-production software purchases."
    },
    {
      title: "DaVinci Resolve Film Emulation: My Simple Color Grading Workflow",
      keyword: "DaVinci Resolve Film Emulation",
      reasoning: "An evergreen tutorial outlining your full color pipeline from camera RAW to final export. Excellent for search ranking and establishing workflow authority."
    },
    {
      title: "Blackmagic Pyxis 6K + Dehancer: Cinematic Color Test",
      keyword: "Blackmagic Pyxis 6K",
      reasoning: "Showcases your new camera's footage processed with Dehancer emulation curves. Aligns premium camera gear interest with high-retention software guides."
    }
  ],
  prioritizedActions: [
    "Double down on DaVinci Resolve film emulation and Dehancer tutorial content (your strongest signal).",
    "Restructure video intros to hook viewers in the first 5-10 seconds with visual results rather than generic specs.",
    "Avoid dry gear/cage reviews unless integrated directly with a practical hands-on grading project."
  ],
  confidenceScores: {
    growthDriver: 'HIGH',
    retentionWarning: 'HIGH',
    patternDetection: 'HIGH'
  }
};

