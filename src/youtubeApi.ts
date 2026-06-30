// YouTube Data API v3 integration
// Channel: @mycinetoolbox1979

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  views: string;
  duration: string;
  publishedAt: string;
  description: string;
  tags?: string[];
}

// ─── Format helpers ─────────────────────────────────────────────

function formatViews(count: string): string {
  const n = parseInt(count, 10);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K views`;
  return `${n} views`;
}

function formatDuration(iso: string): string {
  // ISO 8601 duration: PT4M13S → 4:13
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const h = parseInt(match[1] || '0', 10);
  const m = parseInt(match[2] || '0', 10);
  const s = parseInt(match[3] || '0', 10);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatPublished(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

// ─── Step 1: Get the uploads playlist ID for the channel ────────

async function getUploadsPlaylistId(): Promise<string> {
  const res = await fetch(
    `${BASE_URL}/channels?part=contentDetails&forHandle=mycinetoolbox1979&key=${API_KEY}`
  );
  if (!res.ok) throw new Error(`Channel lookup failed: ${res.status}`);
  const data = await res.json();
  const uploadsId = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsId) throw new Error('Could not find uploads playlist');
  return uploadsId;
}

// ─── Step 2: Get video IDs from the uploads playlist ────────────

async function getLatestVideoIds(playlistId: string, maxResults = 8): Promise<string[]> {
  const res = await fetch(
    `${BASE_URL}/playlistItems?part=contentDetails&playlistId=${playlistId}&maxResults=${maxResults}&key=${API_KEY}`
  );
  if (!res.ok) throw new Error(`Playlist fetch failed: ${res.status}`);
  const data = await res.json();
  return (data.items ?? []).map((item: any) => item.contentDetails.videoId as string);
}

// ─── Step 3: Get full video details (stats + duration) ──────────

async function getVideoDetails(videoIds: string[]): Promise<YouTubeVideo[]> {
  const ids = videoIds.join(',');
  const res = await fetch(
    `${BASE_URL}/videos?part=snippet,statistics,contentDetails&id=${ids}&key=${API_KEY}`
  );
  if (!res.ok) throw new Error(`Video details fetch failed: ${res.status}`);
  const data = await res.json();

  return (data.items ?? []).map((item: any): YouTubeVideo => ({
    id: item.id,
    title: item.snippet.title,
    thumbnail:
      item.snippet.thumbnails?.maxres?.url ||
      item.snippet.thumbnails?.high?.url ||
      item.snippet.thumbnails?.medium?.url ||
      `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`,
    views: formatViews(item.statistics?.viewCount ?? '0'),
    duration: formatDuration(item.contentDetails?.duration ?? ''),
    publishedAt: formatPublished(item.snippet.publishedAt),
    description: item.snippet.description ?? '',
    tags: item.snippet.tags ?? [],
  }));
}

// ─── Main export: fetch latest videos ───────────────────────────

export async function fetchLatestVideos(maxResults = 8): Promise<YouTubeVideo[]> {
  if (!API_KEY) throw new Error('VITE_YOUTUBE_API_KEY is not set in .env');
  const playlistId = await getUploadsPlaylistId();
  const videoIds = await getLatestVideoIds(playlistId, maxResults);
  return getVideoDetails(videoIds);
}

export async function updateVideoMetadata(
  videoId: string,
  newTitle: string,
  newDescription: string,
  newTags: string[],
  accessToken: string
): Promise<any> {
  if (!API_KEY) throw new Error('VITE_YOUTUBE_API_KEY is not set in .env');

  // 1. Fetch current video details using OAuth token to preserve other snippet metadata (and support private/unlisted videos)
  const getRes = await fetch(`${BASE_URL}/videos?part=snippet&id=${videoId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    }
  });

  if (!getRes.ok) {
    let getErr = '';
    try {
      getErr = await getRes.text();
    } catch (_) {
      getErr = `HTTP error ${getRes.status}`;
    }
    throw new Error(`Failed to fetch current video details: ${getErr}`);
  }
  
  const data = await getRes.json();
  const videoItem = data.items?.[0];
  if (!videoItem) {
    throw new Error('Video not found on YouTube. Make sure your account owns this video and it is not deleted.');
  }

  const snippet = videoItem.snippet;

  // 2. Merge the optimized metadata details
  snippet.title = newTitle;
  snippet.description = newDescription;
  snippet.tags = newTags;

  // 3. PUT the updated snippet back using OAuth authorization
  const putRes = await fetch(`${BASE_URL}/videos?part=snippet`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: videoId,
      snippet: snippet,
    }),
  });

  if (!putRes.ok) {
    let errText = '';
    try {
      const errData = await putRes.json();
      errText = errData.error?.message;
    } catch (_) {
      try {
        errText = await putRes.text();
      } catch (_) {
        errText = `HTTP error ${putRes.status}`;
      }
    }
    throw new Error(errText || `Failed to update video metadata (${putRes.status})`);
  }

  return await putRes.json();
}

export async function uploadVideoWithProgress(
  file: File,
  metadata: {
    title: string;
    description: string;
    tags: string[];
    privacyStatus: 'private' | 'unlisted' | 'public';
    categoryId?: string;
  },
  accessToken: string,
  onProgress: (progress: number) => void
): Promise<string> {
  const { title, description, tags, privacyStatus, categoryId = '22' } = metadata;

  // 1. Initialize resumable session
  const initRes = await fetch(
    `https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Length': file.size.toString(),
        'X-Upload-Content-Type': file.type || 'video/mp4',
      },
      body: JSON.stringify({
        snippet: {
          title,
          description,
          tags,
          categoryId
        },
        status: {
          privacyStatus
        }
      })
    }
  );

  if (!initRes.ok) {
    const errText = await initRes.text();
    throw new Error(`Failed to initialize video upload session: ${errText}`);
  }

  const uploadUrl = initRes.headers.get('Location');
  if (!uploadUrl) {
    throw new Error('Upload session initialized but Location header was not provided.');
  }

  // 2. Upload the file in chunks
  const fileSize = file.size;
  // Chunk size must be a multiple of 256 KB. Let's use 1 MB (1,048,576 bytes)
  const CHUNK_SIZE = 1024 * 1024; 
  let start = 0;

  while (start < fileSize) {
    const end = Math.min(start + CHUNK_SIZE, fileSize);
    const chunk = file.slice(start, end);
    const chunkLength = end - start;

    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Length': chunkLength.toString(),
        'Content-Range': `bytes ${start}-${end - 1}/${fileSize}`,
      },
      body: chunk
    });

    if (putRes.status === 308) {
      // Resume upload session, move to next chunk
      start = end;
      onProgress(Math.min((start / fileSize) * 100, 99));
    } else if (putRes.ok || putRes.status === 200 || putRes.status === 201) {
      // Upload complete!
      const data = await putRes.json();
      const videoId = data.id;
      if (!videoId) {
        throw new Error('Video uploaded successfully but video ID was not returned.');
      }
      onProgress(100);
      return videoId;
    } else {
      const errText = await putRes.text();
      throw new Error(`Upload failed at byte ${start}: ${errText}`);
    }
  }

  throw new Error('Upload loop exited without receiving success response.');
}

export async function uploadCustomThumbnail(
  videoId: string,
  thumbnailFile: File | Blob,
  accessToken: string
): Promise<any> {
  const res = await fetch(
    `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': thumbnailFile.type || 'image/jpeg',
      },
      body: thumbnailFile
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to upload thumbnail: ${errText}`);
  }

  return await res.json();
}

// ─── Fallback data shown if the API fails ───────────────────────
// These are replaced automatically once the API loads.

export const FALLBACK_VIDEOS: YouTubeVideo[] = [
  {
    id: 'X89S0ECDUwg',
    title: 'Blackmagic Pyxis 6K — First Look',
    thumbnail: 'https://img.youtube.com/vi/X89S0ECDUwg/hqdefault.jpg',
    views: '—',
    duration: '',
    publishedAt: '',
    description: '',
  },
  {
    id: 'KXsOoeyBQsM',
    title: 'Dehancer vs FilmConvert',
    thumbnail: 'https://img.youtube.com/vi/KXsOoeyBQsM/hqdefault.jpg',
    views: '—',
    duration: '',
    publishedAt: '',
    description: '',
  },
  {
    id: 'e4cBhDcwldI',
    title: 'BMPCC 4K Field Test',
    thumbnail: 'https://img.youtube.com/vi/e4cBhDcwldI/hqdefault.jpg',
    views: '—',
    duration: '',
    publishedAt: '',
    description: '',
  },
  {
    id: 'jfWoHdjvfEI',
    title: 'NiSi Athena 14mm T2.4 Review',
    thumbnail: 'https://img.youtube.com/vi/jfWoHdjvfEI/hqdefault.jpg',
    views: '—',
    duration: '',
    publishedAt: '',
    description: '',
  },
  {
    id: '6yEoR5cDjzw',
    title: 'SolidPod SSD Storage Review',
    thumbnail: 'https://img.youtube.com/vi/6yEoR5cDjzw/hqdefault.jpg',
    views: '—',
    duration: '',
    publishedAt: '',
    description: '',
  },
  {
    id: 'QoB6G5fc37E',
    title: 'SmallRig BMPCC 4K Cage Build',
    thumbnail: 'https://img.youtube.com/vi/QoB6G5fc37E/hqdefault.jpg',
    views: '—',
    duration: '',
    publishedAt: '',
    description: '',
  },
];

// ─── YouTube Analytics API Types & Queries ──────────────────────

export interface DailyAnalyticsRow {
  day: string;
  views: number;
  comments: number;
  likes: number;
  shares: number;
  watchTimeMinutes: number;
  subscribersGained: number;
  averageViewDurationSeconds: number;
}

export interface ChannelAnalyticsReport {
  totalViews: number;
  totalComments: number;
  totalLikes: number;
  totalShares: number;
  totalWatchTimeMinutes: number;
  avgViewDurationSeconds: number;
  totalSubscribersGained: number;
  dailyData: DailyAnalyticsRow[];
  isMock?: boolean;
}

export interface VideoAnalyticsReport {
  id: string;
  title: string;
  thumbnail: string;
  views: number;
  likes: number;
  watchTimeMinutes: number;
  averageViewDurationSeconds: number;
}

// Format date helpers
function getPastDateString(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

// Fetch general channel reports day-by-day
export async function fetchChannelAnalyticsReport(
  accessToken: string,
  days = 30
): Promise<ChannelAnalyticsReport> {
  const startDate = getPastDateString(days);
  const endDate = getPastDateString(1); // Stop at yesterday for complete data

  const url = `https://youtubeanalytics.googleapis.com/v2/reports` +
    `?ids=channel==MINE` +
    `&startDate=${startDate}` +
    `&endDate=${endDate}` +
    `&metrics=views,comments,likes,shares,estimatedMinutesWatched,averageViewDuration,subscribersGained` +
    `&dimensions=day` +
    `&sort=day`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`YouTube Analytics API report failed: ${res.status} - ${errorBody}`);
  }

  const data = await res.json();
  const rows = data.rows || [];
  
  // Find column indexes
  const cols = (data.columnHeaders || []).map((h: any) => h.name);
  const idxDay = cols.indexOf('day');
  const idxViews = cols.indexOf('views');
  const idxComments = cols.indexOf('comments');
  const idxLikes = cols.indexOf('likes');
  const idxShares = cols.indexOf('shares');
  const idxMinutes = cols.indexOf('estimatedMinutesWatched');
  const idxDuration = cols.indexOf('averageViewDuration');
  const idxSubscribers = cols.indexOf('subscribersGained');

  let totalViews = 0;
  let totalComments = 0;
  let totalLikes = 0;
  let totalShares = 0;
  let totalWatchTimeMinutes = 0;
  let totalSubscribersGained = 0;
  let totalDurationWeight = 0;

  const dailyData: DailyAnalyticsRow[] = rows.map((row: any[]): DailyAnalyticsRow => {
    const day = row[idxDay] || '';
    const views = parseInt(row[idxViews] || '0', 10);
    const comments = parseInt(row[idxComments] || '0', 10);
    const likes = parseInt(row[idxLikes] || '0', 10);
    const shares = parseInt(row[idxShares] || '0', 10);
    const watchTimeMinutes = parseFloat(row[idxMinutes] || '0');
    const averageViewDurationSeconds = parseInt(row[idxDuration] || '0', 10);
    const subscribersGained = parseInt(row[idxSubscribers] || '0', 10);

    totalViews += views;
    totalComments += comments;
    totalLikes += likes;
    totalShares += shares;
    totalWatchTimeMinutes += watchTimeMinutes;
    totalSubscribersGained += subscribersGained;
    totalDurationWeight += averageViewDurationSeconds * views;

    return {
      day,
      views,
      comments,
      likes,
      shares,
      watchTimeMinutes,
      subscribersGained,
      averageViewDurationSeconds
    };
  });

  const avgViewDurationSeconds = totalViews > 0 
    ? Math.round(totalDurationWeight / totalViews) 
    : 0;

  return {
    totalViews,
    totalComments,
    totalLikes,
    totalShares,
    totalWatchTimeMinutes,
    avgViewDurationSeconds,
    totalSubscribersGained,
    dailyData
  };
}

// Fetch top videos report by views and merge titles & thumbnails
export async function fetchTopVideosAnalyticsReport(
  accessToken: string,
  days = 30,
  maxResults = 5
): Promise<VideoAnalyticsReport[]> {
  const startDate = getPastDateString(days);
  const endDate = getPastDateString(1);

  const url = `https://youtubeanalytics.googleapis.com/v2/reports` +
    `?ids=channel==MINE` +
    `&startDate=${startDate}` +
    `&endDate=${endDate}` +
    `&metrics=views,likes,estimatedMinutesWatched,averageViewDuration` +
    `&dimensions=video` +
    `&sort=-views` +
    `&maxResults=${maxResults}`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`YouTube Analytics API top videos report failed: ${res.status} - ${errorBody}`);
  }

  const data = await res.json();
  const rows = data.rows || [];
  
  if (rows.length === 0) return [];

  // Find column indexes
  const cols = (data.columnHeaders || []).map((h: any) => h.name);
  const idxVideo = cols.indexOf('video');
  const idxViews = cols.indexOf('views');
  const idxLikes = cols.indexOf('likes');
  const idxMinutes = cols.indexOf('estimatedMinutesWatched');
  const idxDuration = cols.indexOf('averageViewDuration');

  const videoIds: string[] = [];
  const videoStatsMap = new Map<string, { views: number; likes: number; watchTimeMinutes: number; averageViewDurationSeconds: number }>();

  rows.forEach((row: any[]) => {
    const videoId = row[idxVideo];
    if (videoId) {
      videoIds.push(videoId);
      videoStatsMap.set(videoId, {
        views: parseInt(row[idxViews] || '0', 10),
        likes: parseInt(row[idxLikes] || '0', 10),
        watchTimeMinutes: parseFloat(row[idxMinutes] || '0'),
        averageViewDurationSeconds: parseInt(row[idxDuration] || '0', 10)
      });
    }
  });

  // Query YouTube Data API for titles and thumbnails for these videos
  try {
    const videoDetails = await getVideoDetails(videoIds);
    return videoDetails.map((v): VideoAnalyticsReport => {
      const stats = videoStatsMap.get(v.id) || { views: 0, likes: 0, watchTimeMinutes: 0, averageViewDurationSeconds: 0 };
      return {
        id: v.id,
        title: v.title,
        thumbnail: v.thumbnail,
        views: stats.views,
        likes: stats.likes,
        watchTimeMinutes: stats.watchTimeMinutes,
        averageViewDurationSeconds: stats.averageViewDurationSeconds
      };
    });
  } catch (err) {
    console.warn('Failed to resolve top video details, using IDs only:', err);
    return videoIds.map((id): VideoAnalyticsReport => {
      const stats = videoStatsMap.get(id) || { views: 0, likes: 0, watchTimeMinutes: 0, averageViewDurationSeconds: 0 };
      return {
        id,
        title: `Video ID: ${id}`,
        thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        views: stats.views,
        likes: stats.likes,
        watchTimeMinutes: stats.watchTimeMinutes,
        averageViewDurationSeconds: stats.averageViewDurationSeconds
      };
    });
  }
}

// ─── Offline Fallback Mock Analytics Generator ─────────────────

export function generateMockChannelAnalyticsReport(days = 30): ChannelAnalyticsReport {
  const dailyData: DailyAnalyticsRow[] = [];
  
  // Seed values
  let totalViews = 0;
  let totalComments = 0;
  let totalLikes = 0;
  let totalShares = 0;
  let totalWatchTimeMinutes = 0;
  let totalSubscribersGained = 0;
  let totalDurationWeight = 0;

  for (let i = days; i >= 1; i--) {
    const dayStr = getPastDateString(i);
    // Add sinusoidal wave to views with a rising trend
    const baseViews = 200 + Math.sin(i * 0.5) * 80 + (days - i) * 3;
    const views = Math.max(20, Math.round(baseViews + Math.random() * 50));
    
    const comments = Math.round(views * 0.01 + Math.random() * 2);
    const likes = Math.round(views * 0.05 + Math.random() * 6);
    const shares = Math.round(views * 0.005 + Math.random() * 2);
    const watchTimeMinutes = views * 3.4 + (Math.random() * 10 - 5);
    const averageViewDurationSeconds = 180 + Math.round(Math.sin(i * 0.15) * 30 + Math.random() * 15);
    const subscribersGained = Math.max(0, Math.round(views * 0.015 - Math.random() * 1.5));

    totalViews += views;
    totalComments += comments;
    totalLikes += likes;
    totalShares += shares;
    totalWatchTimeMinutes += watchTimeMinutes;
    totalSubscribersGained += subscribersGained;
    totalDurationWeight += averageViewDurationSeconds * views;

    dailyData.push({
      day: dayStr,
      views,
      comments,
      likes,
      shares,
      watchTimeMinutes,
      subscribersGained,
      averageViewDurationSeconds
    });
  }

  const avgViewDurationSeconds = totalViews > 0 
    ? Math.round(totalDurationWeight / totalViews) 
    : 0;

  return {
    totalViews,
    totalComments,
    totalLikes,
    totalShares,
    totalWatchTimeMinutes,
    avgViewDurationSeconds,
    totalSubscribersGained,
    dailyData,
    isMock: true
  };
}

export function generateMockTopVideosReport(): VideoAnalyticsReport[] {
  return [
    {
      id: 'jfWoHdjvfEI',
      title: 'NiSi Athena Lenses: The Secret to Cinematic Dreamy Bokeh',
      thumbnail: 'https://img.youtube.com/vi/jfWoHdjvfEI/hqdefault.jpg',
      views: 5420,
      likes: 248,
      watchTimeMinutes: 18970,
      averageViewDurationSeconds: 210
    },
    {
      id: 'X89S0ECDUwg',
      title: 'Blackmagic Pyxis 6K: Cinema Camera Rigging Setup',
      thumbnail: 'https://img.youtube.com/vi/X89S0ECDUwg/hqdefault.jpg',
      views: 3240,
      likes: 184,
      watchTimeMinutes: 12312,
      averageViewDurationSeconds: 228
    },
    {
      id: 'KXsOoeyBQsM',
      title: 'Dehancer Film Emulation vs FilmConvert Shootout',
      thumbnail: 'https://img.youtube.com/vi/KXsOoeyBQsM/hqdefault.jpg',
      views: 2890,
      likes: 142,
      watchTimeMinutes: 9248,
      averageViewDurationSeconds: 192
    },
    {
      id: 'e4cBhDcwldI',
      title: 'Detroit Cinematography: Low Light Lens Film Shooting',
      thumbnail: 'https://img.youtube.com/vi/e4cBhDcwldI/hqdefault.jpg',
      views: 1840,
      likes: 95,
      watchTimeMinutes: 5152,
      averageViewDurationSeconds: 168
    },
    {
      id: '6yEoR5cDjzw',
      title: '3 Nodes Color Grading Tutorial in DaVinci Resolve',
      thumbnail: 'https://img.youtube.com/vi/6yEoR5cDjzw/hqdefault.jpg',
      views: 890,
      likes: 64,
      watchTimeMinutes: 2937,
      averageViewDurationSeconds: 198
    }
  ];
}

