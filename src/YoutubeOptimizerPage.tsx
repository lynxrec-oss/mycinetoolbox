import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  Sparkles, 
  LogOut, 
  Copy, 
  Check, 
  Loader2, 
  Lock, 
  PlusCircle, 
  Video,
  FileText,
  AlertTriangle,
  ArrowLeft,
  Upload,
  X,
  Image
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { fetchLatestVideos, FALLBACK_VIDEOS, updateVideoMetadata, type YouTubeVideo } from './youtubeApi';
import { generateVideoSeo, type VideoSeoOutput } from './geminiApi';
import { publishFacebookPost, publishInstagramPost } from './metaApi';

const ALLOWED_EMAIL = 'lynxrec@gmail.com';
const ASSOCIATE_TAG = import.meta.env.VITE_AMAZON_ASSOCIATE_TAG || 'Khoc-20';


export default function YoutubeOptimizerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Video feed state
  const [channelVideos, setChannelVideos] = useState<YouTubeVideo[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);

  // Input workspace state
  const [keyword, setKeyword] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scriptOutline, setScriptOutline] = useState('');

  // AI results state
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizerError, setOptimizerError] = useState('');
  const [seoResult, setSeoResult] = useState<VideoSeoOutput | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [productAsins, setProductAsins] = useState<Record<string, string>>({});
  const [affiliateProducts, setAffiliateProducts] = useState<any[]>([]);
  const [activeResultTab, setActiveResultTab] = useState<'youtube' | 'article' | 'monetization' | 'social'>('youtube');

  // Auth subscriber
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        if (currentUser.email === ALLOWED_EMAIL) {
          setUser(currentUser);
          setAuthError('');
        } else {
          // Log out unauthorized user immediately
          signOut(auth);
          setUser(null);
          setAuthError('Access Denied: This dashboard is private.');
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch videos once logged in
  useEffect(() => {
    if (user) {
      setIsLoadingVideos(true);
      fetchLatestVideos(20)
        .then((data) => {
          setChannelVideos(data);
          setIsLoadingVideos(false);
        })
        .catch((err) => {
          console.error('Failed to load videos:', err);
          setChannelVideos(FALLBACK_VIDEOS);
          setIsLoadingVideos(false);
        });
    }
  }, [user]);
  // Thumbnail states
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailBase64, setThumbnailBase64] = useState<string | null>(null);
  const [thumbnailMimeType, setThumbnailMimeType] = useState<string | null>(null);
  const [isFetchingLiveThumbnail, setIsFetchingLiveThumbnail] = useState(false);
  const [thumbnailWasAnalyzed, setThumbnailWasAnalyzed] = useState(false);

  // YouTube Write Access & Publishing states
  const [youtubeAccessToken, setYoutubeAccessToken] = useState<string | null>(() => {
    return sessionStorage.getItem('yt_access_token');
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishError, setPublishError] = useState('');

  // Meta publishing states
  const [metaPublishSuccess, setMetaPublishSuccess] = useState(false);
  const [metaPublishSuccessMsg, setMetaPublishSuccessMsg] = useState('');
  const [metaPublishError, setMetaPublishError] = useState('');
  const [isPublishingMeta, setIsPublishingMeta] = useState(false);
  const [confirmingVideoData, setConfirmingVideoData] = useState<{
    videoId: string;
    title: string;
    description: string;
    tags: string[];
  } | null>(null);

  const [sourceCampaignId, setSourceCampaignId] = useState<string>('');

  // Prefill check when landing from Opportunities Engine
  useEffect(() => {
    if (location.state) {
      const state = location.state as { prefillTitle?: string; prefillKeyword?: string; prefillOutline?: string; prefillCampaignId?: string };
      if (state.prefillTitle) setTitle(state.prefillTitle);
      if (state.prefillKeyword) setKeyword(state.prefillKeyword);
      if (state.prefillOutline) setScriptOutline(state.prefillOutline);
      if (state.prefillCampaignId) setSourceCampaignId(state.prefillCampaignId);
      setSelectedVideo(null); // Force "New Video Draft" mode
      
      // Clean up state so refresh doesn't keep resetting it
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Helper: convert File to base64
  const convertFileToBase64 = (file: File): Promise<{ mimeType: string; data: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const mimeType = file.type || 'image/jpeg';
        const data = result.split(',')[1];
        resolve({ mimeType, data });
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Helper: fetch image URL and convert to base64
  const fetchUrlToBase64 = async (url: string): Promise<{ mimeType: string; data: string }> => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch thumbnail image: ${response.statusText}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const result = reader.result as string;
        const mimeType = blob.type || 'image/jpeg';
        const data = result.split(',')[1];
        resolve({ mimeType, data });
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const loadLiveThumbnail = async (url: string) => {
    setIsFetchingLiveThumbnail(true);
    setThumbnailBase64(null);
    setThumbnailMimeType(null);
    try {
      const result = await fetchUrlToBase64(url);
      setThumbnailBase64(result.data);
      setThumbnailMimeType(result.mimeType);
    } catch (err) {
      console.error('Failed to fetch live thumbnail as base64:', err);
    } finally {
      setIsFetchingLiveThumbnail(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setOptimizerError('Please select a valid image file (PNG, JPG, JPEG).');
      return;
    }

    setThumbnailFile(file);
    setOptimizerError('');
    
    const objectUrl = URL.createObjectURL(file);
    setThumbnailPreview(objectUrl);

    try {
      const result = await convertFileToBase64(file);
      setThumbnailBase64(result.data);
      setThumbnailMimeType(result.mimeType);
    } catch (err) {
      console.error('Failed to convert local file to base64:', err);
      setOptimizerError('Failed to read thumbnail image file.');
    }
  };

  const handleClearThumbnail = () => {
    setThumbnailFile(null);
    if (selectedVideo) {
      setThumbnailPreview(selectedVideo.thumbnail);
      loadLiveThumbnail(selectedVideo.thumbnail);
    } else {
      setThumbnailPreview(null);
      setThumbnailBase64(null);
      setThumbnailMimeType(null);
    }
  };

  // Handle selected video details population
  const handleSelectVideo = (video: YouTubeVideo | null) => {
    setSelectedVideo(video);
    setSeoResult(null);
    setProductAsins({});
    setAffiliateProducts([]);
    setOptimizerError('');
    
    // Clear thumbnail states
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setThumbnailBase64(null);
    setThumbnailMimeType(null);
    
    if (video) {
      setTitle(video.title);
      setDescription(video.description || '');
      setKeyword(video.tags && video.tags.length > 0 ? video.tags.join(', ') : '');
      setScriptOutline('');
      setThumbnailPreview(video.thumbnail);
      loadLiveThumbnail(video.thumbnail);
    } else {
      // Clear for new draft
      setTitle('');
      setDescription('');
      setKeyword('');
      setScriptOutline('');
    }
  };

  // Sign in
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setIsLoggingIn(true);
    setAuthError('');
    
    try {
      if (email.trim() !== ALLOWED_EMAIL) {
        throw new Error('Access Denied: This dashboard is private.');
      }
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: any) {
      console.error('Login failed:', err);
      setAuthError(err.message || 'Invalid credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setYoutubeAccessToken(null);
      sessionStorage.removeItem('yt_access_token');
      handleSelectVideo(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Run SEO Optimization
  const handleOptimize = async () => {
    if (!title.trim() || !keyword.trim()) {
      setOptimizerError('Draft Title and Target Keyword are required.');
      return;
    }
    
    setIsOptimizing(true);
    setOptimizerError('');
    setSeoResult(null);
    setProductAsins({});
    setAffiliateProducts([]);
    setThumbnailWasAnalyzed(!!(thumbnailBase64 && thumbnailMimeType));

    try {
      const outlineContent = scriptOutline.trim() 
        ? scriptOutline 
        : selectedVideo 
          ? `Optimizing an existing video. Video ID: ${selectedVideo.id}. Current Title: "${title}". Current Description: "${description}". Current Tags: "${keyword}". Perform a full SEO metadata audit and suggest enhancements.`
          : `Creating a new draft video. Title: "${title}". Target Keyword: "${keyword}". Generate the complete SEO package.`;

      const result = await generateVideoSeo({
        title,
        description,
        keyword,
        scriptOutline: outlineContent,
        thumbnailImage: (thumbnailBase64 && thumbnailMimeType) 
          ? { mimeType: thumbnailMimeType, data: thumbnailBase64 }
          : undefined
      });
      setSeoResult(result);
      setAffiliateProducts(result.affiliateProducts || []);
      setActiveResultTab('youtube');
    } catch (err: any) {
      console.error('Optimization failed:', err);
      setOptimizerError(err.message || 'An error occurred during AI analysis. Please check your credentials or try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Copy to clipboard helper
  const handleCopyText = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  // Authorize write access to YouTube using Google Popup via Firebase
  const handleAuthorizeYouTube = async () => {
    setPublishError('');
    setPublishSuccess(false);
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/youtube.force-ssl');
    // Scope for read-only YouTube Analytics API
    provider.addScope('https://www.googleapis.com/auth/yt-analytics.readonly');
    // Scope for read-only YouTube Data API (channel subscriber/views statistics)
    provider.addScope('https://www.googleapis.com/auth/youtube.readonly');
    
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      if (token) {
        setYoutubeAccessToken(token);
        sessionStorage.setItem('yt_access_token', token);
        setPublishSuccess(true);
        setTimeout(() => setPublishSuccess(false), 5000);
      } else {
        throw new Error('Failed to retrieve Google OAuth access token.');
      }
    } catch (err: any) {
      console.error('YouTube authorization failed:', err);
      if (err.code === 'auth/unauthorized-domain') {
        setPublishError(`Unauthorized Domain: Please add "${window.location.hostname}" to the "Authorized Domains" list in your Firebase Console (Authentication -> Settings).`);
      } else {
        setPublishError(err.message || 'Authorization failed. Please try again.');
      }
    }
  };

  // Publish optimized data to YouTube video
  const handlePublishToYouTube = async () => {
    if (!confirmingVideoData) return;
    if (!youtubeAccessToken) {
      setPublishError('You must authorize YouTube access first.');
      return;
    }

    setIsPublishing(true);
    setPublishError('');
    setPublishSuccess(false);

    try {
      const { videoId, title, description, tags } = confirmingVideoData;
      await updateVideoMetadata(
        videoId,
        title,
        description,
        tags,
        youtubeAccessToken
      );

      // Close modal and set success
      setConfirmingVideoData(null);
      setPublishSuccess(true);

      // Update Firestore campaign status to published if this video is linked to one
      if (sourceCampaignId) {
        try {
          const campaignRef = doc(db, 'campaigns', sourceCampaignId);
          await updateDoc(campaignRef, { status: 'published' });
          console.log(`Campaign ${sourceCampaignId} status updated to published.`);
        } catch (dbErr) {
          console.error('Failed to update source campaign status to published:', dbErr);
        }
      }

      // Refresh the channel video list so it updates live
      fetchLatestVideos(20)
        .then((data) => {
          setChannelVideos(data);
          // Also update the selectedVideo details to match the new live details
          const updated = data.find(v => v.id === videoId);
          if (updated) {
            setSelectedVideo(updated);
          }
        })
        .catch((err) => console.error('Failed to reload video list after update:', err));

      setTimeout(() => setPublishSuccess(false), 6000);
    } catch (err: any) {
      console.error('Failed to publish to YouTube:', err);
      setPublishError(err.message || 'Failed to update video metadata.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Facebook publishing trigger
  const handlePublishToFacebook = async () => {
    const pageToken = sessionStorage.getItem('fb_selected_page_token');
    const pageId = sessionStorage.getItem('fb_selected_page_id');
    if (!pageToken || !pageId) {
      setMetaPublishError('No Facebook Page connected. Please connect your page in Channel Analytics first.');
      setTimeout(() => setMetaPublishError(''), 5000);
      return;
    }

    setIsPublishingMeta(true);
    setMetaPublishError('');
    setMetaPublishSuccess(false);

    try {
      const caption = seoResult.socialDistribution.facebook.caption;
      const cta = seoResult.socialDistribution.facebook.cta;
      const hashtags = seoResult.socialDistribution.facebook.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ');
      
      const fullMessage = `${caption}\n\n${cta}\n\n${hashtags}`;
      const ytLink = selectedVideo ? `https://www.youtube.com/watch?v=${selectedVideo.id}` : '';

      await publishFacebookPost(pageToken, pageId, fullMessage, ytLink || undefined);
      
      setMetaPublishSuccessMsg('Post successfully published to your Facebook Page!');
      setMetaPublishSuccess(true);
      setTimeout(() => setMetaPublishSuccess(false), 5000);
    } catch (err: any) {
      console.error('Facebook publish failed:', err);
      setMetaPublishError(err.message || 'Failed to publish post to Facebook.');
      setTimeout(() => setMetaPublishError(''), 6000);
    } finally {
      setIsPublishingMeta(false);
    }
  };

  // Instagram publishing trigger
  const handlePublishToInstagram = async () => {
    const pageToken = sessionStorage.getItem('fb_selected_page_token');
    const igAccountId = sessionStorage.getItem('ig_account_id');
    if (!pageToken || !igAccountId) {
      setMetaPublishError('No Instagram Business Account connected. Please connect your account in Channel Analytics first.');
      setTimeout(() => setMetaPublishError(''), 5000);
      return;
    }

    setIsPublishingMeta(true);
    setMetaPublishError('');
    setMetaPublishSuccess(false);

    try {
      const hook = seoResult.socialDistribution.instagram.hook;
      const body = seoResult.socialDistribution.instagram.caption;
      const cta = seoResult.socialDistribution.instagram.cta;
      const hashtags = seoResult.socialDistribution.instagram.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ');
      
      const caption = `${hook}\n\n${body}\n\n${cta}\n\n${hashtags}`;
      
      let mediaUrl = '';
      if (thumbnailPreview) {
        mediaUrl = thumbnailPreview;
      }
      
      if (!mediaUrl || mediaUrl.startsWith('blob:')) {
        if (selectedVideo) {
          mediaUrl = `https://img.youtube.com/vi/${selectedVideo.id}/maxresdefault.jpg`;
        } else {
          mediaUrl = '/aaron-avatar.jpg'; // Fallback
        }
      }

      await publishInstagramPost(pageToken, igAccountId, mediaUrl, caption);
      
      setMetaPublishSuccessMsg('Image post successfully published to Instagram!');
      setMetaPublishSuccess(true);
      setTimeout(() => setMetaPublishSuccess(false), 5000);
    } catch (err: any) {
      console.error('Instagram publish failed:', err);
      setMetaPublishError(err.message || 'Failed to publish post to Instagram. Note: Instagram API requires a publicly accessible image URL.');
      setTimeout(() => setMetaPublishError(''), 7000);
    } finally {
      setIsPublishingMeta(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0f1415] text-[#dee4e3] flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary" size={32} />
          <span>Authenticating Admin...</span>
        </div>
      </div>
    );
  }

  // ─── LOGIN PANEL ───────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0f1415] text-[#dee4e3] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface-container border border-outline-variant/30 p-8 shadow-2xl relative">
          
          {/* Back button */}
          <button 
            onClick={() => navigate('/')}
            className="absolute top-4 left-4 font-mono text-[10px] text-on-surface-variant hover:text-primary uppercase flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={10} /> Back to Site
          </button>

          <div className="text-center mt-6 mb-8">
            <div className="w-12 h-12 bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mx-auto mb-4">
              <Lock size={20} />
            </div>
            <h1 className="font-display text-headline-lg uppercase tracking-wider">MY CINE TOOLBOX</h1>
            <p className="font-mono text-label-sm text-primary mt-1">Creator Security Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block font-mono text-[10px] uppercase text-on-surface-variant tracking-wider mb-2">Admin Email</label>
              <input 
                type="email"
                required
                className="w-full bg-[#090f10] border border-outline/30 focus:border-primary px-4 py-3 text-sm font-mono focus:outline-none text-[#dee4e3]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aaron@mycinetoolbox.com"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase text-on-surface-variant tracking-wider mb-2">Password</label>
              <input 
                type="password"
                required
                className="w-full bg-[#090f10] border border-outline/30 focus:border-primary px-4 py-3 text-sm font-mono focus:outline-none text-[#dee4e3]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
              />
            </div>

            {authError && (
              <div className="bg-[#93000a]/20 border border-[#93000a]/50 p-4 flex gap-3 text-sm font-mono text-[#ffdad6]">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoggingIn}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-[#003737] font-mono text-label-md py-3 uppercase tracking-wider font-semibold cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Authenticating...
                </>
              ) : (
                'Access Dashboard'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── DASHBOARD PANEL ──────────────────────────────────────────────
  return (
    <div className="min-h-screen lg:h-screen bg-[#0f1415] text-[#dee4e3] flex flex-col lg:overflow-hidden">
      {/* Header */}
      <header className="border-b border-outline-variant/20 bg-surface-container px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="text-primary flex items-center gap-1">
              <Sparkles size={20} />
            </div>
            <span className="font-display text-headline-md tracking-wider uppercase">MY CINE TOOLBOX <span className="text-primary font-sans font-semibold tracking-normal">Admin</span></span>
          </div>
          
          {/* Sub Navigation Admin Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#090f10]/80 p-0.5 border border-outline-variant/10 font-mono text-[9px] uppercase">
            <button
              className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 select-none"
            >
              YouTube SEO Optimizer
            </button>
            <button
              onClick={() => navigate('/admin/opportunities')}
              className="px-3 py-1.5 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              Content Opportunities
            </button>
            <button
              onClick={() => navigate('/admin/campaigns')}
              className="px-3 py-1.5 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              Saved Campaigns
            </button>
            <button
              onClick={() => navigate('/admin/analytics')}
              className="px-3 py-1.5 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              Channel Analytics
            </button>
            <button
              onClick={() => navigate('/admin/indexing')}
              className="px-3 py-1.5 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              Instant Indexing
            </button>
          </nav>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/')}
            className="font-mono text-[10px] text-on-surface-variant hover:text-primary uppercase flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={12} /> Exit Dashboard
          </button>
          <div className="h-4 w-[1px] bg-outline-variant/30" />
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-on-surface-variant hidden sm:inline">{user.email}</span>
            {youtubeAccessToken ? (
              <span className="border border-primary/30 bg-primary/10 text-primary px-3 py-1.5 font-mono text-[10px] uppercase flex items-center gap-1.5 select-none">
                <Check size={12} /> YouTube Connected
              </span>
            ) : (
              <button 
                onClick={handleAuthorizeYouTube}
                className="border border-[#e07221]/40 hover:border-secondary text-[#ffb68b] hover:bg-[#ffb68b]/5 px-3 py-1.5 font-mono text-[10px] uppercase flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Grant write access to update titles, descriptions, and tags directly on your YouTube channel"
              >
                <Sparkles size={12} /> Link YouTube
              </button>
            )}
            <button 
              onClick={handleSignOut}
              className="border border-outline/30 hover:border-[#93000a] text-on-surface-variant hover:text-[#ffb4ab] px-3 py-1.5 font-mono text-[10px] uppercase flex items-center gap-2 cursor-pointer transition-colors"
            >
              <LogOut size={12} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Side: Video Picker */}
        <aside className="w-full lg:w-80 border-r border-outline-variant/20 bg-surface-container-low flex flex-col shrink-0">
          <div className="p-4 border-b border-outline-variant/20">
            <button
              onClick={() => handleSelectVideo(null)}
              className={`w-full py-3 border uppercase font-mono text-label-sm tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedVideo === null 
                  ? 'border-primary bg-primary/10 text-primary' 
                  : 'border-outline/30 text-on-surface-variant hover:border-primary hover:text-primary'
              }`}
            >
              <PlusCircle size={14} /> Analyze Video Draft
            </button>
          </div>

          <div className="p-3 bg-[#090f10]/30 font-mono text-[9px] uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/20">
            Select Live Upload to Optimize
          </div>

          <div className="flex-grow overflow-y-auto max-h-[300px] lg:max-h-none p-3 space-y-2">
            {isLoadingVideos ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse flex gap-3 p-2 bg-[#090f10]/10 border border-outline-variant/10">
                  <div className="w-16 h-10 bg-outline-variant/20" />
                  <div className="flex-grow space-y-1.5">
                    <div className="h-3 bg-outline-variant/20 w-3/4" />
                    <div className="h-2.5 bg-outline-variant/10 w-1/2" />
                  </div>
                </div>
              ))
            ) : (
              channelVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => handleSelectVideo(video)}
                  className={`flex gap-3 p-2 border cursor-pointer transition-colors ${
                    selectedVideo?.id === video.id
                      ? 'border-primary bg-primary/5'
                      : 'border-outline-variant/20 bg-surface-container/50 hover:border-primary/50'
                  }`}
                >
                  <img 
                    src={video.thumbnail} 
                    alt={video.title} 
                    className="w-16 h-10 object-cover bg-black border border-outline-variant/20 shrink-0" 
                  />
                  <div className="min-w-0 flex-grow">
                    <h4 className="font-mono text-[10px] leading-tight text-on-surface line-clamp-2 uppercase font-medium">{video.title}</h4>
                    <span className="font-mono text-[8px] text-on-surface-variant uppercase mt-1 block">{video.views}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Center Panel: Workspace Form */}
        <main className="flex-grow lg:w-1/2 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center gap-2 font-mono text-[11px] text-primary uppercase tracking-widest">
            <FileText size={14} />
            <span>Workspace: {selectedVideo ? 'Live Upload' : 'New Video Draft'}</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-mono text-[10px] uppercase text-on-surface-variant tracking-wider mb-2">
                Draft / Target Video Title *
              </label>
              <input
                type="text"
                className="w-full bg-[#090f10] border border-outline/30 focus:border-primary px-4 py-3 text-sm font-mono focus:outline-none text-[#dee4e3]"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Dehancer vs Film Convert: Which Actually Looks Like Film?"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase text-on-surface-variant tracking-wider mb-2">
                Target Search Keyword *
              </label>
              <input
                type="text"
                className="w-full bg-[#090f10] border border-outline/30 focus:border-primary px-4 py-3 text-sm font-mono focus:outline-none text-[#dee4e3]"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. film look davinci resolve, dehancer review"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase text-on-surface-variant tracking-wider mb-2">
                Current Video Description
              </label>
              <textarea
                rows={4}
                className="w-full bg-[#090f10] border border-outline/30 focus:border-primary p-4 text-xs font-mono focus:outline-none text-[#dee4e3] resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description draft..."
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase text-on-surface-variant tracking-wider mb-2">
                Video Thumbnail {selectedVideo ? '(Live Feed or Custom Override)' : '(Optional Draft Upload)'}
              </label>
              
              {thumbnailPreview ? (
                <div className="border border-outline-variant/30 bg-[#090f10] p-4 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-full sm:w-40 aspect-video bg-black border border-outline-variant/20 shrink-0 overflow-hidden">
                    <img 
                      src={thumbnailPreview} 
                      alt="Thumbnail preview" 
                      className="w-full h-full object-cover" 
                    />
                    {isFetchingLiveThumbnail && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="animate-spin text-primary" size={16} />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow text-center sm:text-left space-y-2 min-w-0">
                    <div className="font-mono text-[11px] text-[#dee4e3] font-medium truncate">
                      {thumbnailFile 
                        ? `Custom: ${thumbnailFile.name}` 
                        : selectedVideo 
                          ? 'Live Channel Thumbnail' 
                          : 'Uploaded Image'}
                    </div>
                    <div className="font-mono text-[9px] text-on-surface-variant uppercase">
                      {thumbnailFile 
                        ? `${(thumbnailFile.size / 1024).toFixed(0)} KB • ${thumbnailMimeType}` 
                        : 'Pre-loaded from YouTube'}
                    </div>
                    <button
                      type="button"
                      onClick={handleClearThumbnail}
                      className="border border-outline/30 hover:border-[#93000a] text-on-surface-variant hover:text-[#ffb4ab] px-2.5 py-1 font-mono text-[9px] uppercase cursor-pointer transition-colors inline-flex items-center gap-1.5"
                    >
                      <X size={10} /> {thumbnailFile && selectedVideo ? 'Restore Live' : 'Remove Thumbnail'}
                    </button>
                  </div>
                </div>
              ) : (
                <label className="border border-dashed border-outline-variant/30 hover:border-primary/50 bg-[#090f10]/30 hover:bg-[#090f10]/60 p-6 flex flex-col items-center justify-center cursor-pointer transition-all">
                  <Upload className="text-on-surface-variant/50 mb-2" size={20} />
                  <span className="font-mono text-[11px] text-[#dee4e3] uppercase">Upload Thumbnail Draft</span>
                  <span className="font-mono text-[8px] text-on-surface-variant uppercase mt-1">PNG, JPG, JPEG up to 4MB</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange} 
                  />
                </label>
              )}
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase text-on-surface-variant tracking-wider mb-2">
                Script Outline / Transcript / Concepts
              </label>
              <textarea
                rows={10}
                className="w-full bg-[#090f10] border border-outline/30 focus:border-primary p-4 text-xs font-mono focus:outline-none text-[#dee4e3] resize-none"
                value={scriptOutline}
                onChange={(e) => setScriptOutline(e.target.value)}
                placeholder="Paste your video outline, sections, script script or transcribed text here for detailed SEO analysis and chapter building..."
              />
            </div>

            {optimizerError && (
              <div className="bg-[#93000a]/20 border border-[#93000a]/50 p-4 flex gap-3 text-sm font-mono text-[#ffdad6]">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <span>{optimizerError}</span>
              </div>
            )}

            <button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="w-full py-4 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-[#003737] font-mono text-label-md uppercase tracking-wider font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Processing Engine Analysis...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Run Rank Optimization
                </>
              )}
            </button>
          </div>
        </main>

        {/* Right Side: AI Output Results */}
        <section className="w-full lg:w-1/2 border-t lg:border-t-0 lg:border-l border-outline-variant/20 bg-surface-container-lowest overflow-y-auto p-6">
          <div className="flex items-center gap-2 font-mono text-[11px] text-primary uppercase tracking-widest mb-6">
            <Sparkles size={14} />
            <span>AI Rank Recommendations</span>
          </div>

          {!seoResult && !isOptimizing && (
            <div className="h-[400px] border border-dashed border-outline-variant/30 flex flex-col items-center justify-center text-center p-6 bg-surface-container/20">
              <Sparkles className="text-on-surface-variant/40 mb-4" size={36} />
              <h3 className="font-display text-headline-md uppercase text-on-surface-variant mb-2">Engine Standby</h3>
              <p className="font-body text-sm text-on-surface-variant/60 max-w-sm leading-relaxed">
                Provide draft metadata and target search keyword in workspace panel, then trigger rank optimization scan.
              </p>
            </div>
          )}
          {isOptimizing && (
            <div className="h-[400px] border border-dashed border-primary/20 flex flex-col items-center justify-center text-center p-6 bg-primary/[0.02] animate-pulse">
              <Loader2 className="animate-spin text-primary mb-4" size={36} />
              <h3 className="font-display text-headline-md uppercase text-primary mb-2">Analyzing Video Engine...</h3>
              <p className="font-body text-sm text-on-surface-variant/60 max-w-sm leading-relaxed">
                Gemini is parsing metadata, optimizing descriptions, tagging keyword buckets, and generating high-CTR layouts.
              </p>
            </div>
          )}

          {seoResult && !isOptimizing && (
            <div className="space-y-6">
              
              {/* Score Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* SEO Rank Score */}
                <div className="bg-surface-container p-4 border border-outline-variant/30 flex items-center justify-between">
                  <div>
                    <h4 className="font-mono text-[10px] uppercase text-on-surface-variant tracking-wider">SEO Rank Score</h4>
                    <span className="font-display text-headline-lg text-primary block mt-1">{seoResult.score} <span className="text-sm font-mono text-on-surface-variant">/ 100</span></span>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                    <Sparkles size={22} />
                  </div>
                </div>

                {/* Thumbnail Score */}
                {thumbnailWasAnalyzed && seoResult.thumbnailScore !== undefined && seoResult.thumbnailScore !== null ? (
                  <div className="bg-surface-container p-4 border border-outline-variant/30 flex items-center justify-between">
                    <div>
                      <h4 className="font-mono text-[10px] uppercase text-secondary tracking-wider">Thumbnail Score</h4>
                      <span className="font-display text-headline-lg text-secondary block mt-1">{seoResult.thumbnailScore} <span className="text-sm font-mono text-on-surface-variant">/ 100</span></span>
                    </div>
                    <div className="w-12 h-12 bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary">
                      <Image size={22} />
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#090f10]/35 p-4 border border-dashed border-outline-variant/25 flex items-center justify-between">
                    <div>
                      <h4 className="font-mono text-[10px] uppercase text-on-surface-variant/60 tracking-wider">Thumbnail Score</h4>
                      <span className="font-mono text-[9px] text-on-surface-variant/80 mt-2 block font-semibold">PENDING AUDIT</span>
                    </div>
                    <div className="text-on-surface-variant/50 text-[9px] font-sans leading-normal max-w-[170px] text-right">
                      Upload an image in the workspace to analyze.
                    </div>
                  </div>
                )}
              </div>

              {/* Tabs Selection Bar */}
              <div className="flex border-b border-outline-variant/20 font-mono text-[10px] uppercase select-none">
                <button
                  onClick={() => setActiveResultTab('youtube')}
                  className={`px-4 py-2.5 border-b-2 font-semibold transition-colors cursor-pointer ${
                    activeResultTab === 'youtube'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  YouTube SEO
                </button>
                <button
                  onClick={() => setActiveResultTab('article')}
                  className={`px-4 py-2.5 border-b-2 font-semibold transition-colors cursor-pointer ${
                    activeResultTab === 'article'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Companion Article
                </button>
                <button
                  onClick={() => setActiveResultTab('monetization')}
                  className={`px-4 py-2.5 border-b-2 font-semibold transition-colors cursor-pointer ${
                    activeResultTab === 'monetization'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Affiliate & Merch
                </button>
                <button
                  onClick={() => setActiveResultTab('social')}
                  className={`px-4 py-2.5 border-b-2 font-semibold transition-colors cursor-pointer ${
                    activeResultTab === 'social'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Social Promo
                </button>
              </div>

              {/* Tab View: YouTube SEO */}
              {activeResultTab === 'youtube' && (
                <div className="space-y-6">
                  {/* Title Suggestions */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                      <h4 className="font-mono text-[10px] uppercase text-primary tracking-wider">Recommended Titles (CTR Optimized)</h4>
                    </div>
                    <div className="space-y-3">
                      {(seoResult.titles || []).map((titleObj, idx) => (
                        <div 
                          key={idx} 
                          className="group bg-[#090f10] border border-outline-variant/30 hover:border-primary/40 p-4 space-y-3 transition-colors"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-grow space-y-1">
                              <span className="font-mono text-[12px] leading-relaxed select-all text-[#dee4e3] block font-semibold">{titleObj.text}</span>
                              <p className="font-sans text-[10px] text-on-surface-variant/85 italic leading-relaxed">{titleObj.explanation}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 font-mono text-[9px] select-none">
                              <span className={`px-1.5 py-0.5 border ${
                                titleObj.text.length >= 53 && titleObj.text.length <= 70
                                  ? 'bg-primary/10 border-primary/20 text-primary'
                                  : 'bg-warning/10 border-warning/20 text-warning'
                              }`} title="Title length (TubeBuddy recommends 53-70 chars)">
                                {titleObj.text.length} chars
                              </span>
                              <span className="bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5" title="SEO/CTR Score">
                                {titleObj.score}% CTR
                              </span>
                              {titleObj.synergyRating !== undefined && (
                                <span className="bg-secondary/15 border border-secondary/30 text-secondary px-1.5 py-0.5" title="Visual Thumbnail Synergy Score">
                                  Synergy: {titleObj.synergyRating}%
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex justify-end items-center gap-3 pt-2 border-t border-outline-variant/10">
                            {selectedVideo && (
                              <button
                                onClick={() => {
                                  // Compile description using the custom structured template
                                  let cleanDesc = '';

                                  // 1. Hook and body
                                  if (seoResult.descriptionBody) {
                                    cleanDesc += `${seoResult.descriptionBody.trim()}\n\n`;
                                  }

                                  // 2. Timestamps
                                  if (seoResult.chapters) {
                                    cleanDesc += `🎬 VIDEO TIMESTAMPS\n${seoResult.chapters.trim()}\n\n`;
                                  }

                                  // 3. Gear & Tools matched
                                  if (affiliateProducts && affiliateProducts.length > 0) {
                                    cleanDesc += `⚙️ GEAR & CREATOR TOOLS USED\n`;
                                    affiliateProducts.forEach(item => {
                                      const asin = productAsins[item.name];
                                      const searchUrl = asin
                                        ? `https://www.amazon.com/gp/aws/cart/add.html?AssociateTag=${ASSOCIATE_TAG}&ASIN.1=${encodeURIComponent(asin.trim())}&Quantity.1=1`
                                        : `https://www.amazon.com/s?k=${encodeURIComponent(item.searchKeywords)}&tag=${ASSOCIATE_TAG}`;
                                      cleanDesc += `- ${item.name} (${item.category}): ${searchUrl}\n`;
                                    });
                                    cleanDesc += `\n`;
                                  }

                                  // 4. Merch Suggestion
                                  cleanDesc += `👕 OFFICIAL MY CINE TOOLBOX MERCH\n`;
                                  cleanDesc += `- Buy our filmmaking gear & apparel: https://mycinetoolbox.com#shop\n`;
                                  if (seoResult.merchConcepts && seoResult.merchConcepts.length > 0) {
                                    cleanDesc += `- Featured Concept: "${seoResult.merchConcepts[0].title}" — ${seoResult.merchConcepts[0].tagline}\n`;
                                  }
                                  cleanDesc += `\n`;

                                  // Preserve existing custom description notes/credits
                                  if (description && description.trim()) {
                                    const existingClean = description
                                      .split('🎬 VIDEO TIMESTAMPS')[0]
                                      .split('⚙️ GEAR & CREATOR TOOLS USED')[0]
                                      .split('👕 OFFICIAL MY CINE TOOLBOX MERCH')[0]
                                      .split('🔗 MY CINE TOOLBOX COMMUNITY')[0]
                                      .split('⚖️ FTC AFFILIATE DISCLOSURE')[0]
                                      .split('📝 VIDEO NOTES & CREDITS')[0]
                                      .trim();
                                    
                                    if (existingClean && existingClean !== seoResult.descriptionBody.trim()) {
                                      cleanDesc += `📝 VIDEO NOTES & CREDITS\n${existingClean}\n\n`;
                                    }
                                  }

                                  // 5. Social/community links
                                  cleanDesc += `🔗 MY CINE TOOLBOX COMMUNITY\n`;
                                  cleanDesc += `- Subscribe on YouTube: https://youtube.com/@mycinetoolbox1979\n`;
                                  cleanDesc += `- Creator Home Base: https://mycinetoolbox.com\n\n`;

                                  // 6. FTC Disclosure
                                  cleanDesc += `⚖️ FTC AFFILIATE DISCLOSURE\n`;
                                  cleanDesc += `Some of the links above are affiliate links, meaning at no additional cost to you, I will earn a commission if you click through and make a purchase.\n`;

                                  // Merge existing tags with AI-generated tags (case-insensitive deduplication)
                                  const existingTags = selectedVideo.tags || [];
                                  const aiTags = seoResult.tags || [];
                                  const uniqueTagsMap = new Map<string, string>();
                                  
                                  // Add AI tags first to prioritize them
                                  aiTags.forEach(tag => {
                                    const clean = tag.trim();
                                    if (clean && !uniqueTagsMap.has(clean.toLowerCase())) {
                                      uniqueTagsMap.set(clean.toLowerCase(), clean);
                                    }
                                  });
                                  
                                  // Append existing tags
                                  existingTags.forEach(tag => {
                                    const clean = tag.trim();
                                    if (clean && !uniqueTagsMap.has(clean.toLowerCase())) {
                                      uniqueTagsMap.set(clean.toLowerCase(), clean);
                                    }
                                  });
                                  
                                  const mergedTags = Array.from(uniqueTagsMap.values());
                                  
                                  // Respect YouTube's 500-character tag limit (aggregate tags cannot exceed 500 chars)
                                  let totalLength = 0;
                                  const finalTags: string[] = [];
                                  for (const tag of mergedTags) {
                                    const tagLength = tag.length + (finalTags.length > 0 ? 1 : 0);
                                    if (totalLength + tagLength <= 500) {
                                      finalTags.push(tag);
                                      totalLength += tagLength;
                                    } else {
                                      break;
                                    }
                                  }

                                  setConfirmingVideoData({
                                    videoId: selectedVideo.id,
                                    title: titleObj.text,
                                    description: cleanDesc,
                                    tags: finalTags
                                  });
                                }}
                                className="border border-[#e07221]/30 hover:border-secondary text-on-surface-variant hover:text-secondary px-2.5 py-1 font-mono text-[9px] uppercase cursor-pointer transition-colors inline-flex items-center gap-1"
                                title="Push this title, optimized description, and SEO tags directly to the live YouTube video"
                              >
                                <Upload size={10} /> Apply SEO
                              </button>
                            )}
                            <button
                              onClick={() => handleCopyText(titleObj.text, `title-${idx}`)}
                              className="text-on-surface-variant hover:text-primary cursor-pointer p-0.5"
                            >
                              {copiedField === `title-${idx}` ? <Check size={12} className="text-primary" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Description Snippet Hook */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                      <h4 className="font-mono text-[10px] uppercase text-primary tracking-wider">Optimized Description Hook (First 3 Lines)</h4>
                      <button
                        onClick={() => handleCopyText(seoResult.descriptionHook, 'hook')}
                        className="text-on-surface-variant hover:text-primary flex items-center gap-1.5 font-mono text-[9px] uppercase cursor-pointer"
                      >
                        {copiedField === 'hook' ? <Check size={10} className="text-primary" /> : <Copy size={10} />} Copy Hook
                      </button>
                    </div>
                    <div className="bg-[#090f10] border border-outline-variant/30 p-3 font-mono text-[11px] leading-relaxed select-all">
                      {seoResult.descriptionHook}
                    </div>
                  </div>

                  {/* Description Body */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                      <h4 className="font-mono text-[10px] uppercase text-primary tracking-wider">Optimized Description Body (300-400 words)</h4>
                      <button
                        onClick={() => handleCopyText(seoResult.descriptionBody, 'body')}
                        className="text-on-surface-variant hover:text-primary flex items-center gap-1.5 font-mono text-[9px] uppercase cursor-pointer"
                      >
                        {copiedField === 'body' ? <Check size={10} className="text-primary" /> : <Copy size={10} />} Copy Body
                      </button>
                    </div>
                    <div className="bg-[#090f10] border border-outline-variant/30 p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap select-all max-h-48 overflow-y-auto">
                      {seoResult.descriptionBody}
                    </div>
                    
                    {/* Woven Keywords Info */}
                    {seoResult.tagsUsedInDescription && seoResult.tagsUsedInDescription.length > 0 && (
                      <div className="text-[10px] text-on-surface-variant/70 font-mono mt-1">
                        <span className="text-primary font-semibold">Woven SEO Keywords ({seoResult.tagsUsedInDescription.length}):</span>{" "}
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {seoResult.tagsUsedInDescription.map((tag, idx) => (
                            <span key={idx} className="bg-primary/5 text-primary/80 border border-primary/20 px-1.5 py-0.5 text-[9px]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chapters */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                      <h4 className="font-mono text-[10px] uppercase text-primary tracking-wider">Timestamped Chapters</h4>
                      <button
                        onClick={() => handleCopyText(seoResult.chapters, 'chapters')}
                        className="text-on-surface-variant hover:text-primary flex items-center gap-1.5 font-mono text-[9px] uppercase cursor-pointer"
                      >
                        {copiedField === 'chapters' ? <Check size={10} className="text-primary" /> : <Copy size={10} />} Copy
                      </button>
                    </div>
                    <div className="bg-[#090f10] border border-outline-variant/30 p-3 font-mono text-[10px] leading-relaxed whitespace-pre-wrap select-all max-h-48 overflow-y-auto">
                      {seoResult.chapters}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-3">
                    {(() => {
                      const combinedTagsCharCount = (seoResult.tags || []).join(',').length;
                      const isPerfectTagLength = combinedTagsCharCount >= 440 && combinedTagsCharCount <= 500;
                      return (
                        <>
                          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                            <h4 className="font-mono text-[10px] uppercase text-primary tracking-wider flex items-center gap-2">
                              SEO Tags 
                              <span className={`px-1.5 py-0.5 text-[9px] border font-sans ${
                                isPerfectTagLength 
                                  ? 'text-primary border-primary/20 bg-primary/5' 
                                  : combinedTagsCharCount > 500 
                                    ? 'text-error border-error/20 bg-error/5' 
                                    : 'text-warning border-warning/20 bg-warning/5'
                              }`}>
                                {combinedTagsCharCount} / 500 chars {isPerfectTagLength && '✓ TubeBuddy Compliant'}
                              </span>
                            </h4>
                            <button
                              onClick={() => handleCopyText((seoResult.tags || []).join(', '), 'tags')}
                              className="text-on-surface-variant hover:text-primary flex items-center gap-1.5 font-mono text-[9px] uppercase cursor-pointer"
                            >
                              {copiedField === 'tags' ? <Check size={10} className="text-primary" /> : <Copy size={10} />} Copy All
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(seoResult.tags || []).map((tag, idx) => (
                              <span 
                                key={idx} 
                                className="bg-[#090f10] border border-[#3c4949]/30 text-on-surface text-[10px] px-2.5 py-1 font-mono uppercase"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Audience Retention Advisory */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                      <h4 className="font-mono text-[10px] uppercase text-primary tracking-wider">Audience Retention Advisory</h4>
                    </div>
                    <div className="bg-surface-container border border-outline-variant/30 p-4 font-body text-xs text-on-surface-variant space-y-2 leading-relaxed whitespace-pre-wrap">
                      {seoResult.retentionAdvisory}
                    </div>
                  </div>

                  {/* Thumbnail Design Audit */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                      <h4 className="font-mono text-[10px] uppercase text-secondary tracking-wider">Thumbnail Design Audit</h4>
                    </div>
                    {thumbnailWasAnalyzed && seoResult.thumbnailFeedback ? (
                      <div className="bg-surface-container border border-outline-variant/30 p-4 font-body text-xs text-on-surface-variant space-y-2 leading-relaxed whitespace-pre-wrap">
                        {seoResult.thumbnailFeedback}
                      </div>
                    ) : (
                      <div className="bg-[#090f10]/30 border border-dashed border-outline-variant/20 p-4 font-mono text-[10px] text-on-surface-variant leading-relaxed">
                        ⚠️ NO THUMBNAIL ANALYZED — Upload a draft image (PNG/JPG) in the workspace panel to run a visual design audit. This check evaluates contrast, mobile readability, and keyword-to-thumbnail synergy.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab View: Companion Article */}
              {activeResultTab === 'article' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                    <h4 className="font-mono text-[10px] uppercase text-primary tracking-wider">Companion Blog Article</h4>
                    <button
                      onClick={() => handleCopyText(seoResult.companionArticle, 'companionArticle')}
                      className="text-on-surface-variant hover:text-primary flex items-center gap-1.5 font-mono text-[9px] uppercase cursor-pointer"
                    >
                      {copiedField === 'companionArticle' ? <Check size={10} className="text-primary" /> : <Copy size={10} />} Copy Markdown
                    </button>
                  </div>
                  <div className="bg-[#090f10] border border-outline-variant/30 p-4 font-mono text-[11px] leading-relaxed whitespace-pre-wrap select-all max-h-[500px] overflow-y-auto">
                    {seoResult.companionArticle}
                  </div>
                </div>
              )}

              {/* Tab View: Affiliate & Merch */}
              {activeResultTab === 'monetization' && (
                <div className="space-y-6">
                  {/* Affiliate Matches */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                      <h4 className="font-mono text-[10px] uppercase text-primary tracking-wider">Matched Equipment & Gear</h4>
                    </div>
                    <div className="overflow-x-auto border border-outline-variant/20 bg-[#090f10]">
                      <table className="w-full text-left font-mono text-[10px]">
                        <thead>
                          <tr className="border-b border-outline-variant/20 bg-surface-container-low text-on-surface-variant uppercase">
                            <th className="p-3 w-1/5">Product Name</th>
                            <th className="p-3 w-1/8">Category</th>
                            <th className="p-3">Video Relevance &amp; Keywords</th>
                            <th className="p-3 w-1/5">ASIN (90-Day Cookie Boost)</th>
                            <th className="p-3 w-1/8">Amazon Link</th>
                            <th className="p-3 w-[40px] text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                          {affiliateProducts && affiliateProducts.length > 0 ? (
                            affiliateProducts.map((prod, idx) => {
                              const asin = productAsins[prod.name] || '';
                              const amazonUrl = asin
                                ? `https://www.amazon.com/gp/aws/cart/add.html?AssociateTag=${ASSOCIATE_TAG}&ASIN.1=${encodeURIComponent(asin.trim())}&Quantity.1=1`
                                : `https://www.amazon.com/s?k=${encodeURIComponent(prod.searchKeywords || prod.name)}&tag=${ASSOCIATE_TAG}`;
                              return (
                                <tr key={idx} className="hover:bg-surface-container-lowest/30">
                                  {/* Product Name Input */}
                                  <td className="p-3">
                                    <input
                                      type="text"
                                      value={prod.name}
                                      onChange={(e) => {
                                        const updated = [...affiliateProducts];
                                        const oldName = prod.name;
                                        updated[idx] = { ...prod, name: e.target.value };
                                        setAffiliateProducts(updated);
                                        if (productAsins[oldName]) {
                                          setProductAsins(prev => {
                                            const copy = { ...prev };
                                            copy[e.target.value] = copy[oldName];
                                            delete copy[oldName];
                                            return copy;
                                          });
                                        }
                                      }}
                                      className="bg-[#090f10] border border-outline/30 focus:border-primary px-2 py-1 text-[9px] font-mono text-[#dee4e3] focus:outline-none rounded-none w-full"
                                    />
                                  </td>
                                  {/* Category Input */}
                                  <td className="p-3">
                                    <input
                                      type="text"
                                      value={prod.category}
                                      onChange={(e) => {
                                        const updated = [...affiliateProducts];
                                        updated[idx] = { ...prod, category: e.target.value };
                                        setAffiliateProducts(updated);
                                      }}
                                      className="bg-[#090f10] border border-outline/30 focus:border-primary px-2 py-1 text-[9px] font-mono text-[#dee4e3] focus:outline-none rounded-none w-full"
                                    />
                                  </td>
                                  {/* Relevance & Search Keywords Input */}
                                  <td className="p-3 flex flex-col gap-1.5">
                                    <input
                                      type="text"
                                      placeholder="Search keywords..."
                                      value={prod.searchKeywords || ''}
                                      onChange={(e) => {
                                        const updated = [...affiliateProducts];
                                        updated[idx] = { ...prod, searchKeywords: e.target.value };
                                        setAffiliateProducts(updated);
                                      }}
                                      className="bg-[#090f10] border border-outline/30 focus:border-primary px-2 py-1 text-[9px] font-mono text-[#dee4e3] focus:outline-none rounded-none w-full"
                                      title="Keywords appended to Amazon search link query"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Explain relevance..."
                                      value={prod.explanation}
                                      onChange={(e) => {
                                        const updated = [...affiliateProducts];
                                        updated[idx] = { ...prod, explanation: e.target.value };
                                        setAffiliateProducts(updated);
                                      }}
                                      className="bg-[#090f10]/70 border border-outline/20 focus:border-primary px-2 py-1 text-[8px] font-sans text-on-surface-variant/80 focus:outline-none rounded-none w-full italic"
                                    />
                                  </td>
                                  {/* ASIN Input */}
                                  <td className="p-3">
                                    <input
                                      type="text"
                                      placeholder="PASTE ASIN (e.g. B0C5S5K8XT)"
                                      value={asin}
                                      onChange={(e) => setProductAsins(prev => ({ ...prev, [prod.name]: e.target.value.toUpperCase().trim() }))}
                                      className="w-full bg-[#090f10] border border-outline/30 focus:border-primary px-2 py-1 text-[9px] font-mono text-[#dee4e3] focus:outline-none rounded-none uppercase"
                                    />
                                  </td>
                                  {/* Link Actions */}
                                  <td className="p-3">
                                    <a 
                                      href={amazonUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className={`hover:underline flex flex-col gap-0.5 justify-center ${asin ? 'text-[#ffb68b]' : 'text-primary'}`}
                                    >
                                      <span className="flex items-center gap-1">
                                        {asin ? 'Add to Cart ↗' : 'Search Amazon ↗'}
                                      </span>
                                      {asin && (
                                        <span className="text-[7px] text-[#ffb68b] font-mono tracking-tighter uppercase font-semibold">
                                          ⚡ 90-Day Cookie Boosted
                                        </span>
                                      )}
                                    </a>
                                  </td>
                                  {/* Delete Button */}
                                  <td className="p-3 text-center">
                                    <button
                                      onClick={() => {
                                        setAffiliateProducts(prev => prev.filter((_, i) => i !== idx));
                                        setProductAsins(prev => {
                                          const copy = { ...prev };
                                          delete copy[prod.name];
                                          return copy;
                                        });
                                      }}
                                      className="text-on-surface-variant hover:text-error p-1 cursor-pointer transition-colors"
                                      title="Delete Item"
                                    >
                                      <X size={12} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={6} className="p-3 text-center text-on-surface-variant">No gear products identified in script/outline.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Add Custom Gear Button */}
                    <button
                      onClick={() => setAffiliateProducts(prev => [
                        ...prev,
                        { name: `New Gear Item ${prev.length + 1}`, category: 'Gear', explanation: 'Custom recommended tool', searchKeywords: '' }
                      ])}
                      className="w-full py-2 bg-[#090f10] hover:bg-[#0c1314] text-primary border border-dashed border-outline-variant/30 hover:border-primary font-mono text-[9px] uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer mt-2"
                    >
                      <PlusCircle size={10} className="text-primary" /> Add Custom Gear Item
                    </button>
                  </div>

                  {/* FTC Disclosure Snippet */}
                  <div className="space-y-2 bg-[#090f10] border border-outline-variant/30 p-4">
                    <div className="flex items-center justify-between border-b border-outline-variant/10 pb-2 mb-2">
                      <span className="font-mono text-[9px] uppercase text-on-surface-variant">FTC Affiliate Disclosure</span>
                      <button
                        onClick={() => handleCopyText("⚖️ FTC AFFILIATE DISCLOSURE\nSome of the links above are affiliate links, meaning at no additional cost to you, I will earn a commission if you click through and make a purchase.", 'ftc')}
                        className="text-on-surface-variant hover:text-primary flex items-center gap-1 font-mono text-[8px] uppercase cursor-pointer"
                      >
                        {copiedField === 'ftc' ? <Check size={8} className="text-primary" /> : <Copy size={8} />} Copy
                      </button>
                    </div>
                    <p className="font-sans text-[10px] text-on-surface-variant/90 leading-relaxed italic">
                      "Some of the links above are affiliate links, meaning at no additional cost to you, I will earn a commission if you click through and make a purchase."
                    </p>
                  </div>

                  {/* Merch Concepts */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                      <h4 className="font-mono text-[10px] uppercase text-primary tracking-wider">Official Merch Apparel Concepts</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {seoResult.merchConcepts && seoResult.merchConcepts.length > 0 ? (
                        seoResult.merchConcepts.map((merch, idx) => (
                          <div key={idx} className="bg-[#090f10] border border-outline-variant/30 p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[11px] font-semibold text-primary uppercase">{merch.title}</span>
                              <span className="bg-primary/5 text-primary border border-primary/20 px-1.5 py-0.5 text-[8px] font-mono">APPAREL CONCEPT</span>
                            </div>
                            <p className="font-mono text-[9px] text-[#dee4e3] uppercase tracking-wide italic">"{merch.tagline}"</p>
                            <div className="font-sans text-[10px] text-on-surface-variant/85 leading-relaxed pt-1.5 border-t border-outline-variant/10">
                              <span className="text-secondary font-mono text-[9px] block uppercase mb-1">Print Design Idea:</span>
                              {merch.designIdea}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-center py-4 text-on-surface-variant font-mono text-[10px]">No merch concepts generated.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab View: Social Promo */}
              {activeResultTab === 'social' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                    <h4 className="font-mono text-[10px] uppercase text-primary tracking-wider">Social Distribution Captions (Draft Mode)</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    {/* Instagram */}
                    <div className="bg-[#090f10] border border-outline-variant/30 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-outline-variant/10 pb-1.5">
                        <span className="font-mono text-[10px] font-semibold text-secondary uppercase flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-secondary rounded-full"></span>
                          Instagram / Reels Draft
                        </span>
                        <button
                          onClick={() => {
                            const compiled = `${seoResult.socialDistribution.instagram.hook}\n\n${seoResult.socialDistribution.instagram.caption}\n\n${seoResult.socialDistribution.instagram.cta}\n\n${seoResult.socialDistribution.instagram.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}`;
                            handleCopyText(compiled, 'ig-compiled');
                          }}
                          className="text-on-surface-variant hover:text-primary flex items-center gap-1 font-mono text-[9px] uppercase cursor-pointer"
                        >
                          {copiedField === 'ig-compiled' ? <Check size={10} className="text-primary" /> : <Copy size={10} />} Copy Compiled Reel Caption
                        </button>
                      </div>
                      
                      <div className="space-y-2 font-mono text-[9px] text-on-surface-variant uppercase">
                        <div>
                          <span className="text-secondary/70 block text-[8px] tracking-wider mb-1">1. Attention Hook</span>
                          <div className="bg-[#0c1011] p-2 border border-outline-variant/10 font-sans text-[10.5px] text-[#dee4e3] normal-case leading-relaxed select-all">
                            {seoResult.socialDistribution.instagram.hook}
                          </div>
                        </div>

                        <div>
                          <span className="text-secondary/70 block text-[8px] tracking-wider mb-1">2. Caption Body</span>
                          <div className="bg-[#0c1011] p-2 border border-outline-variant/10 font-sans text-[10.5px] text-[#dee4e3] normal-case leading-relaxed select-all max-h-24 overflow-y-auto whitespace-pre-wrap">
                            {seoResult.socialDistribution.instagram.caption}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-secondary/70 block text-[8px] tracking-wider mb-1">3. Call-To-Action</span>
                            <div className="bg-[#0c1011] p-2 border border-outline-variant/10 font-sans text-[10.5px] text-[#dee4e3] normal-case leading-relaxed select-all">
                              {seoResult.socialDistribution.instagram.cta}
                            </div>
                          </div>
                          <div>
                            <span className="text-secondary/70 block text-[8px] tracking-wider mb-1">4. Target Hashtags</span>
                            <div className="bg-[#0c1011] p-2 border border-outline-variant/10 font-sans text-[10.5px] text-[#dee4e3] normal-case leading-relaxed select-all truncate">
                              {seoResult.socialDistribution.instagram.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}
                            </div>
                          </div>
                        </div>

                        <div>
                          <span className="text-primary block text-[8px] tracking-wider mb-1">🎬 Reel Thumbnail & Crop Guide</span>
                          <div className="bg-[#0f1415] p-2.5 border border-primary/20 font-sans text-[10px] text-primary normal-case leading-relaxed italic">
                            {seoResult.socialDistribution.instagram.thumbnailCropSuggestion}
                          </div>
                        </div>

                        {/* Direct Publish Instagram Button */}
                        {sessionStorage.getItem('fb_access_token') && sessionStorage.getItem('ig_account_id') ? (
                          <button
                            onClick={handlePublishToInstagram}
                            disabled={isPublishingMeta}
                            className="w-full mt-3 py-2.5 bg-primary hover:bg-primary/95 disabled:bg-primary/50 text-[#003737] font-mono text-[9px] uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {isPublishingMeta ? (
                              <>
                                <Loader2 className="animate-spin" size={10} /> Publishing Reel...
                              </>
                            ) : (
                              <>
                                <Upload size={10} /> Publish Reel to Instagram
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="text-[8px] text-on-surface-variant/40 italic text-center pt-2 border-t border-outline-variant/10 tracking-wide uppercase font-mono">
                            Link Meta and Instagram in Channel Analytics to publish directly
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Facebook */}
                    <div className="bg-[#090f10] border border-outline-variant/30 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-outline-variant/10 pb-1.5">
                        <span className="font-mono text-[10px] font-semibold text-secondary uppercase flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-secondary rounded-full"></span>
                          Facebook Page Post
                        </span>
                        <button
                          onClick={() => {
                            const compiled = `${seoResult.socialDistribution.facebook.caption}\n\n🎬 Watch Video: ${seoResult.socialDistribution.facebook.youtubeLinkPlaceholder}\n📝 Read Article: ${seoResult.socialDistribution.facebook.articleLinkPlaceholder}\n\n${seoResult.socialDistribution.facebook.cta}\n\n${seoResult.socialDistribution.facebook.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}`;
                            handleCopyText(compiled, 'fb-compiled');
                          }}
                          className="text-on-surface-variant hover:text-primary flex items-center gap-1 font-mono text-[9px] uppercase cursor-pointer"
                        >
                          {copiedField === 'fb-compiled' ? <Check size={10} className="text-primary" /> : <Copy size={10} />} Copy Compiled Page Post
                        </button>
                      </div>

                      <div className="space-y-2 font-mono text-[9px] text-on-surface-variant uppercase">
                        <div>
                          <span className="text-secondary/70 block text-[8px] tracking-wider mb-1">1. Conversational Post Copy</span>
                          <div className="bg-[#0c1011] p-2 border border-outline-variant/10 font-sans text-[10.5px] text-[#dee4e3] normal-case leading-relaxed select-all max-h-24 overflow-y-auto whitespace-pre-wrap">
                            {seoResult.socialDistribution.facebook.caption}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-secondary/70 block text-[8px] tracking-wider mb-1">2. YouTube Link Placeholder</span>
                            <div className="bg-[#0c1011] p-2 border border-outline-variant/10 font-sans text-[10px] text-[#4adada] normal-case leading-relaxed select-all truncate">
                              {seoResult.socialDistribution.facebook.youtubeLinkPlaceholder}
                            </div>
                          </div>
                          <div>
                            <span className="text-secondary/70 block text-[8px] tracking-wider mb-1">3. Article Link Placeholder</span>
                            <div className="bg-[#0c1011] p-2 border border-outline-variant/10 font-sans text-[10px] text-[#4adada] normal-case leading-relaxed select-all truncate">
                              {seoResult.socialDistribution.facebook.articleLinkPlaceholder}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-secondary/70 block text-[8px] tracking-wider mb-1">4. Post Call-To-Action</span>
                            <div className="bg-[#0c1011] p-2 border border-outline-variant/10 font-sans text-[10.5px] text-[#dee4e3] normal-case leading-relaxed select-all">
                              {seoResult.socialDistribution.facebook.cta}
                            </div>
                          </div>
                          <div>
                            <span className="text-secondary/70 block text-[8px] tracking-wider mb-1">5. Page Hashtags</span>
                            <div className="bg-[#0c1011] p-2 border border-outline-variant/10 font-sans text-[10.5px] text-[#dee4e3] normal-case leading-relaxed select-all truncate">
                              {seoResult.socialDistribution.facebook.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}
                            </div>
                          </div>
                        </div>

                        {/* Direct Publish Facebook Button */}
                        {sessionStorage.getItem('fb_access_token') && sessionStorage.getItem('fb_selected_page_id') ? (
                          <button
                            onClick={handlePublishToFacebook}
                            disabled={isPublishingMeta}
                            className="w-full mt-3 py-2.5 bg-primary hover:bg-primary/95 disabled:bg-primary/50 text-[#003737] font-mono text-[9px] uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {isPublishingMeta ? (
                              <>
                                <Loader2 className="animate-spin" size={10} /> Publishing Post...
                              </>
                            ) : (
                              <>
                                <Upload size={10} /> Publish Post to Facebook Page
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="text-[8px] text-on-surface-variant/40 italic text-center pt-2 border-t border-outline-variant/10 tracking-wide uppercase font-mono">
                            Link Meta and Facebook in Channel Analytics to publish directly
                          </div>
                        )}
                      </div>
                    </div>

                    {/* TikTok */}
                    <div className="bg-[#090f10] border border-outline-variant/30 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-outline-variant/10 pb-1.5">
                        <span className="font-mono text-[10px] font-semibold text-secondary uppercase flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-secondary rounded-full"></span>
                          TikTok / Vertical Video Draft
                        </span>
                        <button
                          onClick={() => {
                            const compiled = `${seoResult.socialDistribution.tiktok.hook}\n\n${seoResult.socialDistribution.tiktok.caption}\n\n${seoResult.socialDistribution.tiktok.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}`;
                            handleCopyText(compiled, 'tt-compiled');
                          }}
                          className="text-on-surface-variant hover:text-primary flex items-center gap-1 font-mono text-[9px] uppercase cursor-pointer"
                        >
                          {copiedField === 'tt-compiled' ? <Check size={10} className="text-primary" /> : <Copy size={10} />} Copy Compiled Caption
                        </button>
                      </div>

                      <div className="space-y-2 font-mono text-[9px] text-on-surface-variant uppercase">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-secondary/70 block text-[8px] tracking-wider mb-1">1. TikTok Hook Style</span>
                            <div className="bg-[#0c1011] p-2 border border-outline-variant/10 font-sans text-[10.5px] text-[#dee4e3] normal-case leading-relaxed select-all">
                              {seoResult.socialDistribution.tiktok.hook}
                            </div>
                          </div>
                          <div>
                            <span className="text-secondary/70 block text-[8px] tracking-wider mb-1">2. Audio / Sound Mood</span>
                            <div className="bg-[#0c1011] p-2 border border-outline-variant/10 font-sans text-[10.5px] text-[#4adada] normal-case leading-relaxed select-all italic">
                              {seoResult.socialDistribution.tiktok.soundRecommendation}
                            </div>
                          </div>
                        </div>

                        <div>
                          <span className="text-secondary/70 block text-[8px] tracking-wider mb-1">3. Short Caption (Max 100 Chars)</span>
                          <div className="bg-[#0c1011] p-2 border border-outline-variant/10 font-sans text-[10.5px] text-[#dee4e3] normal-case leading-relaxed select-all">
                            {seoResult.socialDistribution.tiktok.caption}
                          </div>
                        </div>

                        <div>
                          <span className="text-secondary/70 block text-[8px] tracking-wider mb-1">4. Trending Hashtags</span>
                          <div className="bg-[#0c1011] p-2 border border-outline-variant/10 font-sans text-[10.5px] text-[#dee4e3] normal-case leading-relaxed select-all truncate">
                            {seoResult.socialDistribution.tiktok.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reddit */}
                    <div className="bg-[#090f10] border border-outline-variant/30 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-outline-variant/10 pb-1.5">
                        <span className="font-mono text-[10px] font-semibold text-secondary uppercase flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-secondary rounded-full"></span>
                          Reddit Subreddit Thread Draft
                        </span>
                        <button
                          onClick={() => {
                            const compiled = `TITLE: ${seoResult.socialDistribution.reddit.title}\n\n${seoResult.socialDistribution.reddit.postBody}\n\n💡 RECOMMENDED SUBREDDITS: ${seoResult.socialDistribution.reddit.targetSubreddits.join(', ')}\n\n💬 FIRST COMMENT CTA:\n${seoResult.socialDistribution.reddit.ctaComment}`;
                            handleCopyText(compiled, 'reddit-compiled');
                          }}
                          className="text-on-surface-variant hover:text-primary flex items-center gap-1 font-mono text-[9px] uppercase cursor-pointer"
                        >
                          {copiedField === 'reddit-compiled' ? <Check size={10} className="text-primary" /> : <Copy size={10} />} Copy All Reddit Drafts
                        </button>
                      </div>

                      <div className="space-y-2 font-mono text-[9px] text-on-surface-variant uppercase">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-secondary/70 block text-[8px] tracking-wider">1. Recommended Target Subreddits</span>
                            <span className="text-[8px] text-on-surface-variant/40 italic">Post manually to these</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {seoResult.socialDistribution.reddit.targetSubreddits.map((sub, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleCopyText(sub, `sub-${idx}`)}
                                className="bg-[#0c1011] hover:bg-[#121819] text-primary border border-outline-variant/20 px-2 py-0.5 text-[9px] font-mono lowercase flex items-center gap-1 cursor-pointer transition-all"
                              >
                                {copiedField === `sub-${idx}` ? <Check size={8} /> : null} {sub}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-secondary/70 block text-[8px] tracking-wider">2. Conversational Reddit Thread Title</span>
                            <button
                              onClick={() => handleCopyText(seoResult.socialDistribution.reddit.title, 'reddit-title')}
                              className="text-primary hover:text-primary-light flex items-center gap-1 font-mono text-[8px] uppercase cursor-pointer"
                            >
                              {copiedField === 'reddit-title' ? 'Copied!' : 'Copy Title'}
                            </button>
                          </div>
                          <div className="bg-[#0c1011] p-2 border border-outline-variant/10 font-sans text-[10.5px] text-[#dee4e3] normal-case leading-relaxed select-all font-semibold">
                            {seoResult.socialDistribution.reddit.title}
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-secondary/70 block text-[8px] tracking-wider">3. Value-First Thread Post Body (Self-Promotion Friendly)</span>
                            <button
                              onClick={() => handleCopyText(seoResult.socialDistribution.reddit.postBody, 'reddit-body')}
                              className="text-primary hover:text-primary-light flex items-center gap-1 font-mono text-[8px] uppercase cursor-pointer"
                            >
                              {copiedField === 'reddit-body' ? 'Copied!' : 'Copy Body'}
                            </button>
                          </div>
                          <div className="bg-[#0c1011] p-2 border border-outline-variant/10 font-sans text-[10.5px] text-[#dee4e3] normal-case leading-relaxed select-all max-h-40 overflow-y-auto whitespace-pre-wrap">
                            {seoResult.socialDistribution.reddit.postBody}
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-primary block text-[8px] tracking-wider">4. Friendly Follow-Up Comment (Drops YouTube Link)</span>
                            <button
                              onClick={() => handleCopyText(seoResult.socialDistribution.reddit.ctaComment, 'reddit-cta')}
                              className="text-primary hover:text-primary-light flex items-center gap-1 font-mono text-[8px] uppercase cursor-pointer"
                            >
                              {copiedField === 'reddit-cta' ? 'Copied!' : 'Copy Comment'}
                            </button>
                          </div>
                          <div className="bg-[#0f1415] p-2 border border-primary/20 font-sans text-[10px] text-primary normal-case leading-relaxed italic select-all">
                            {seoResult.socialDistribution.reddit.ctaComment}
                          </div>
                        </div>

                        <div className="bg-surface-container border border-outline-variant/30 p-2.5 mt-2 text-[8.5px] text-on-surface-variant/80 normal-case font-sans leading-relaxed">
                          <strong className="text-secondary uppercase font-mono block text-[8.5px] mb-1">💡 Reddit Self-Promotion Strategy Guideline:</strong>
                          Reddit moderators are very strict. Instead of spamming links, post this generated text body as a text thread first. Once users comment or show interest, reply to them naturally and copy/paste your video link comment to direct them to the visuals. This builds karma and high retention traffic.
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}
        </section>

      </div>

      {/* Toast Notifications */}
      {(publishSuccess || publishError || metaPublishSuccess || metaPublishError) && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm space-y-2 font-mono text-[11px]">
          {publishSuccess && (
            <div className="bg-[#4adada]/20 border border-[#4adada]/50 p-4 flex gap-3 text-sm text-[#4adada] shadow-2xl backdrop-blur-md">
              <Check size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold uppercase tracking-wider">Video Updated!</p>
                <p className="text-[10px] text-on-surface-variant mt-1 uppercase">Changes have been published live to YouTube.</p>
              </div>
            </div>
          )}
          {publishError && (
            <div className="bg-[#93000a]/20 border border-[#93000a]/50 p-4 flex gap-3 text-sm text-[#ffdad6] shadow-2xl backdrop-blur-md">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold uppercase tracking-wider">Update Failed</p>
                <p className="text-[10px] text-[#ffdad6]/80 mt-1 uppercase">{publishError}</p>
              </div>
            </div>
          )}
          {metaPublishSuccess && (
            <div className="bg-[#4adada]/20 border border-[#4adada]/50 p-4 flex gap-3 text-sm text-[#4adada] shadow-2xl backdrop-blur-md">
              <Check size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold uppercase tracking-wider">Meta Publish Success!</p>
                <p className="text-[10px] text-on-surface-variant mt-1 uppercase">{metaPublishSuccessMsg}</p>
              </div>
            </div>
          )}
          {metaPublishError && (
            <div className="bg-[#93000a]/20 border border-[#93000a]/50 p-4 flex gap-3 text-sm text-[#ffdad6] shadow-2xl backdrop-blur-md">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold uppercase tracking-wider">Meta Post Failed</p>
                <p className="text-[10px] text-[#ffdad6]/80 mt-1 uppercase">{metaPublishError}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal Overlay */}
      {confirmingVideoData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1b2121] border border-[#3c4949] w-full max-w-2xl p-8 relative flex flex-col max-h-[90vh]">
            <button
              onClick={() => setConfirmingVideoData(null)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary cursor-pointer font-mono text-[10px] uppercase flex items-center gap-1"
            >
              <X size={12} /> Close
            </button>

            <div className="flex items-center gap-2 text-secondary font-mono text-[11px] uppercase tracking-widest mb-6">
              <Upload size={14} />
              <span>Confirm YouTube Live Update</span>
            </div>

            {publishError && (
              <div className="bg-[#93000a]/20 border border-[#93000a]/50 p-4 mb-6 flex gap-3 text-xs font-mono text-[#ffdad6] items-start">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold uppercase tracking-wider">Publishing Failed</p>
                  <p className="mt-1">{publishError}</p>
                </div>
              </div>
            )}

            <div className="space-y-6 overflow-y-auto pr-2 flex-grow mb-6">
              {/* Target Video Details */}
              <div className="bg-[#090f10] p-4 border border-outline-variant/30 font-mono text-[10px] space-y-1">
                <div className="text-on-surface-variant uppercase">Target Video ID:</div>
                <div className="text-[#dee4e3] font-medium select-all">{confirmingVideoData.videoId}</div>
                {selectedVideo && (
                  <>
                    <div className="text-on-surface-variant uppercase mt-2">Current Title:</div>
                    <div className="text-primary truncate">{selectedVideo.title}</div>
                  </>
                )}
              </div>

              {/* Title Section */}
              <div className="space-y-2">
                <label className="block font-mono text-[10px] uppercase text-on-surface-variant tracking-wider">
                  New Title
                </label>
                <div className="bg-[#090f10] border border-outline-variant/30 p-3 text-xs font-mono text-primary font-medium select-all">
                  {confirmingVideoData.title}
                </div>
                <div className="font-mono text-[9px] text-on-surface-variant uppercase">
                  {confirmingVideoData.title.length} / 100 characters ({confirmingVideoData.title.length <= 100 ? 'Valid' : 'Warning: Too Long'})
                </div>
              </div>

              {/* Description Section */}
              <div className="space-y-2">
                <label className="block font-mono text-[10px] uppercase text-on-surface-variant tracking-wider">
                  New Description (Prepend Preview)
                </label>
                <div className="bg-[#090f10] border border-outline-variant/30 p-3 text-xs font-mono text-on-surface whitespace-pre-wrap select-all max-h-40 overflow-y-auto">
                  {confirmingVideoData.description}
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-2">
                <label className="block font-mono text-[10px] uppercase text-on-surface-variant tracking-wider">
                  Tags ({confirmingVideoData.tags.length})
                </label>
                <div className="bg-[#090f10] border border-outline-variant/30 p-3 text-xs font-mono text-on-surface select-all">
                  {confirmingVideoData.tags.join(', ')}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-outline-variant/20">
              <button
                onClick={() => setConfirmingVideoData(null)}
                className="flex-grow sm:flex-grow-0 border border-outline/30 hover:border-primary text-on-surface-variant hover:text-primary px-6 py-3 font-mono text-[11px] uppercase tracking-wider cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePublishToYouTube}
                disabled={isPublishing}
                className="flex-grow bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-[#003737] font-mono text-[11px] py-3 uppercase tracking-wider font-semibold cursor-pointer transition-colors flex items-center justify-center gap-2"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="animate-spin" size={14} /> Publishing live...
                  </>
                ) : (
                  <>
                    <Upload size={14} /> Confirm & Publish Live
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
