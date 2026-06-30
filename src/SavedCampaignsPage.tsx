import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signOut, 
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { 
  Sparkles, 
  LogOut, 
  Copy, 
  Check, 
  Loader2, 
  Lock, 
  PlusCircle, 
  FileText, 
  AlertTriangle, 
  ArrowLeft, 
  X,
  TrendingUp,
  Compass,
  Gauge,
  Lightbulb,
  Award,
  Layers,
  Search,
  Trash2,
  Edit2,
  Save,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Video,
  Upload
} from 'lucide-react';
import { auth, db } from './firebase';
import { generateVideoScript } from './geminiApi';
import { uploadVideoWithProgress, uploadCustomThumbnail } from './youtubeApi';

const ALLOWED_EMAIL = 'lynxrec@gmail.com';
const ASSOCIATE_TAG = import.meta.env.VITE_AMAZON_ASSOCIATE_TAG || 'Khoc-20';


interface SavedCampaign {
  id: string;
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
  script: string;
  status: 'planning' | 'production' | 'published';
  createdAt: any;
  creatorId: string;
  userId?: string;
  primaryGoal?: string;
  secondaryGoal?: string;
  tertiaryGoal?: string;
}

export default function SavedCampaignsPage() {
  const navigate = useNavigate();
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // CRM State
  const [campaigns, setCampaigns] = useState<SavedCampaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'planning' | 'production' | 'published'>('all');
  
  // Inline Script Editor State
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [editedScript, setEditedScript] = useState('');
  const [isSavingScript, setIsSavingScript] = useState(false);

  // Script Generator State
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [scriptError, setScriptError] = useState('');

  // Delete Campaign Confirmation State
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);
  
  // Toast notifications
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // YouTube Uploader State
  const [youtubeAccessToken, setYoutubeAccessToken] = useState<string | null>(() => {
    return sessionStorage.getItem('yt_access_token');
  });
  const [isUploadDrawerOpen, setIsUploadDrawerOpen] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [privacyStatus, setPrivacyStatus] = useState<'private' | 'unlisted' | 'public'>('private');
  const [categoryId, setCategoryId] = useState<string>('22');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading_video' | 'uploading_thumbnail' | 'success' | 'error'>('idle');
  const [uploadedVideoId, setUploadedVideoId] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [isLinkingYouTube, setIsLinkingYouTube] = useState(false);

  // Gear ASIN states
  const [parsedGearItems, setParsedGearItems] = useState<string[]>([]);
  const [gearAsins, setGearAsins] = useState<Record<string, string>>({});

  // Auth subscriber
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        if (currentUser.email === ALLOWED_EMAIL) {
          setUser(currentUser);
          setAuthError('');
        } else {
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

  // Fetch campaigns in real-time
  useEffect(() => {
    if (!user) return;
    setLoadingCampaigns(true);

    const q = query(
      collection(db, 'campaigns'), 
      where('creatorId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: SavedCampaign[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        docs.push({
          id: doc.id,
          ...data
        } as SavedCampaign);
      });

      // Sort by createdAt locally to avoid Firestore index errors
      docs.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA; // Descending order (newest first)
      });

      setCampaigns(docs);
      setLoadingCampaigns(false);

      // Set default selected campaign if none is selected
      if (docs.length > 0 && !selectedCampaignId) {
        setSelectedCampaignId(docs[0].id);
      }
    }, (err) => {
      console.error('Error fetching campaigns:', err);
      showToast('Failed to load campaigns queue.', 'error');
      setLoadingCampaigns(false);
    });

    return () => unsubscribe();
  }, [user, selectedCampaignId]);

  // Sync script editor when selected campaign changes
  const activeCampaign = campaigns.find(c => c.id === selectedCampaignId) || null;
  useEffect(() => {
    if (activeCampaign) {
      setEditedScript(activeCampaign.script || '');
      setIsEditingScript(false);
      setScriptError('');

      // Parse gear items from affiliatePotential
      if (activeCampaign.affiliatePotential) {
        const gearItems = activeCampaign.affiliatePotential
          .split(/,|\band\b|\bor\b|;/i)
          .map(item => item.replace(/[\.\*\"\']/g, '').trim())
          .filter(item => item.length > 2 && !/^(potential|gear|links|none|na|n\/a|affiliate)$/i.test(item));
        setParsedGearItems(gearItems);
      } else {
        setParsedGearItems([]);
      }
      setGearAsins({});
    } else {
      setParsedGearItems([]);
      setGearAsins({});
    }
  }, [selectedCampaignId, activeCampaign]);

  // Helper to show toasts
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Copy to clipboard helper
  const handleCopyText = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Handle administrator login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error('Login error:', err);
      setAuthError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setCampaigns([]);
      setSelectedCampaignId(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Update Campaign Status
  const handleStatusChange = async (campaignId: string, newStatus: 'planning' | 'production' | 'published') => {
    try {
      const campaignRef = doc(db, 'campaigns', campaignId);
      await updateDoc(campaignRef, { status: newStatus });
      showToast(`Campaign status updated to ${newStatus}.`);
    } catch (err: any) {
      console.error('Failed to update campaign status:', err);
      showToast('Failed to update status.', 'error');
    }
  };

  // Update Campaign Goal
  const handleGoalChange = async (campaignId: string, goalType: 'primary' | 'secondary' | 'tertiary', newGoal: string) => {
    try {
      const campaignRef = doc(db, 'campaigns', campaignId);
      const updateData: any = {};
      if (goalType === 'primary') updateData.primaryGoal = newGoal;
      if (goalType === 'secondary') updateData.secondaryGoal = newGoal;
      if (goalType === 'tertiary') updateData.tertiaryGoal = newGoal;
      
      await updateDoc(campaignRef, updateData);
      showToast(`Campaign ${goalType} goal updated.`);
    } catch (err: any) {
      console.error('Failed to update campaign goal:', err);
      showToast('Failed to update campaign goal.', 'error');
    }
  };

  // Save Script edits
  const handleSaveScript = async () => {
    if (!activeCampaign) return;
    setIsSavingScript(true);
    try {
      const campaignRef = doc(db, 'campaigns', activeCampaign.id);
      await updateDoc(campaignRef, { script: editedScript });
      setIsEditingScript(false);
      showToast('Video script updated successfully.');
    } catch (err: any) {
      console.error('Failed to save script changes:', err);
      showToast('Failed to save script changes.', 'error');
    } finally {
      setIsSavingScript(false);
    }
  };

  // Generate Script on-demand
  const handleGenerateScript = async () => {
    if (!activeCampaign) return;
    setIsGeneratingScript(true);
    setScriptError('');
    try {
      const result = await generateVideoScript(
        activeCampaign.title,
        activeCampaign.keyword,
        activeCampaign.outline,
        activeCampaign.intent,
        activeCampaign.videoType,
        activeCampaign.primaryGoal || 'Authority Building',
        activeCampaign.secondaryGoal || 'Affiliate Revenue',
        activeCampaign.tertiaryGoal || 'Search Traffic'
      );
      
      const campaignRef = doc(db, 'campaigns', activeCampaign.id);
      await updateDoc(campaignRef, { script: result });
      setEditedScript(result);
      showToast('AI Script generated and saved to planner!');
    } catch (err: any) {
      console.error('Failed to generate script:', err);
      setScriptError(err.message || 'Failed to generate script. Please try again.');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Delete Campaign
  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      const campaignRef = doc(db, 'campaigns', campaignId);
      await deleteDoc(campaignRef);
      setCampaignToDelete(null);
      if (selectedCampaignId === campaignId) {
        setSelectedCampaignId(null);
      }
      showToast('Campaign deleted from database.');
    } catch (err: any) {
      console.error('Failed to delete campaign:', err);
      showToast('Failed to delete campaign.', 'error');
    }
  };

  // Redirect to YouTube Optimizer with prefilled fields
  const handleSendToOptimizer = () => {
    if (!activeCampaign) return;
    
    const formattedOutline = `🎬 TALKING POINTS / SCRIPT OUTLINE:\n` + 
      activeCampaign.outline.map(pt => `- ${pt}`).join('\n') + 
      `\n\n🎯 TARGET SEARCH INTENT:\n${activeCampaign.intent}\n\n💡 THUMBNAIL VISUAL CONCEPT:\n${activeCampaign.thumbnailConcept}`;

    navigate('/admin/youtube-seo', {
      state: {
        prefillTitle: activeCampaign.title,
        prefillKeyword: activeCampaign.keyword,
        prefillOutline: formattedOutline,
        prefillCampaignId: activeCampaign.id
      }
    });
  };

  // Authorize YouTube channel via OAuth popup
  const handleAuthorizeYouTube = async () => {
    setIsLinkingYouTube(true);
    setUploadError('');
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
        showToast('YouTube channel connected successfully!');
      } else {
        throw new Error('Failed to retrieve Google OAuth access token.');
      }
    } catch (err: any) {
      console.error('YouTube authorization failed:', err);
      if (err.code === 'auth/unauthorized-domain') {
        setUploadError(`Unauthorized Domain: Please add "${window.location.hostname}" to authorized domains in Firebase Authentication.`);
      } else {
        setUploadError(err.message || 'Authorization failed. Please try again.');
      }
    } finally {
      setIsLinkingYouTube(false);
    }
  };

  // Perform full upload sequence
  const handleUploadVideo = async () => {
    if (!activeCampaign || !videoFile) return;
    if (!youtubeAccessToken) {
      setUploadError('You must link your YouTube account first.');
      return;
    }

    setUploadStatus('uploading_video');
    setUploadProgress(0);
    setUploadError('');
    setUploadedVideoId('');

    // Pre-assemble gear search links from parsedGearItems and gearAsins
    let gearSection = '';
    if (parsedGearItems.length > 0) {
      gearSection = `⚙️ GEAR & CREATOR TOOLS USED\n`;
      parsedGearItems.forEach(item => {
        const asin = gearAsins[item];
        const searchUrl = asin
          ? `https://www.amazon.com/gp/aws/cart/add.html?AssociateTag=${ASSOCIATE_TAG}&ASIN.1=${encodeURIComponent(asin.trim())}&Quantity.1=1`
          : `https://www.amazon.com/s?k=${encodeURIComponent(item)}&tag=${ASSOCIATE_TAG}`;
        gearSection += `- ${item}: ${searchUrl}\n`;
      });
      gearSection += `\n`;
    }

    // Pre-assemble description template
    const descriptionText = `${activeCampaign.intent}\n\n` +
      `🎬 TALKING POINTS / SCRIPT OUTLINE:\n` +
      activeCampaign.outline.map(pt => `- ${pt}`).join('\n') +
      `\n\n${gearSection}` +
      `💡 THUMBNAIL VISUAL CONCEPT:\n${activeCampaign.thumbnailConcept}\n\n` +
      `👕 OFFICIAL MY CINE TOOLBOX MERCH:\n` +
      `- "3 Nodes. That's It." Cine T-Shirt\n\n` +
      `⚖️ FTC AFFILIATE DISCLOSURE:\n` +
      `Some of the links above are affiliate links, which means I may earn a small commission at no extra cost to you if you purchase through them.`;

    try {
      // Step 1: Upload video file
      const videoId = await uploadVideoWithProgress(
        videoFile,
        {
          title: activeCampaign.title,
          description: descriptionText,
          tags: [activeCampaign.keyword, ...activeCampaign.keyword.split(' '), 'filmmaking', 'cinematography', 'my cine toolbox'].slice(0, 15),
          privacyStatus,
          categoryId
        },
        youtubeAccessToken,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      setUploadedVideoId(videoId);

      // Step 2: Upload thumbnail if selected
      if (thumbnailFile) {
        setUploadStatus('uploading_thumbnail');
        try {
          await uploadCustomThumbnail(videoId, thumbnailFile, youtubeAccessToken);
        } catch (thumbErr: any) {
          console.warn('Thumbnail upload failed, continuing anyway:', thumbErr);
        }
      }

      // Step 3: Update Firestore status to 'published'
      const campaignRef = doc(db, 'campaigns', activeCampaign.id);
      await updateDoc(campaignRef, { status: 'published' });

      setUploadStatus('success');
      showToast('Video successfully deployed to YouTube!');
    } catch (err: any) {
      console.error('YouTube upload sequence failed:', err);
      setUploadStatus('error');
      setUploadError(err.message || 'An error occurred during video upload. Please check network connection and try again.');
    }
  };

  // Filter & Search logic
  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = 
      c.title.toLowerCase().includes(searchText.toLowerCase()) || 
      c.keyword.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Auth loading state
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

  // LOGIN PANEL
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0f1415] text-[#dee4e3] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface-container border border-outline-variant/30 p-8 shadow-2xl relative">
          
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

  // MAIN DASHBOARD PANEL
  return (
    <div className="min-h-screen lg:h-screen bg-[#0f1415] text-[#dee4e3] flex flex-col lg:overflow-hidden relative">
      <div className="film-grain"></div>

      {/* Header */}
      <header className="border-b border-outline-variant/20 bg-surface-container px-6 py-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="text-primary flex items-center gap-1">
              <Sparkles size={20} />
            </div>
            <span className="font-display text-headline-md tracking-wider uppercase">
              MY CINE TOOLBOX <span className="text-primary font-sans font-semibold tracking-normal">Admin</span>
            </span>
          </div>
          
          {/* Sub Navigation Admin Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#090f10]/80 p-0.5 border border-outline-variant/10 font-mono text-[9px] uppercase">
            <button
              onClick={() => navigate('/admin/youtube-seo')}
              className="px-3 py-1.5 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
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
              className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 select-none"
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
            <button
              onClick={handleSignOut}
              className="p-1.5 border border-outline-variant/30 hover:border-error hover:text-error transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={12} />
            </button>
          </div>
        </div>
      </header>

      {/* Main CRM Grid Layout */}
      <div className="flex-grow flex flex-col lg:flex-row lg:overflow-hidden min-h-0">
        
        {/* LEFT PANEL: Campaigns Queue */}
        <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-outline-variant/20 flex flex-col shrink-0 bg-[#0c1011] lg:h-full min-h-0">
          {/* List Controls */}
          <div className="p-4 border-b border-outline-variant/15 space-y-3 shrink-0">
            <div className="relative flex items-center">
              <Search className="absolute left-3 text-on-surface-variant/40" size={12} />
              <input
                type="text"
                placeholder="SEARCH CAMPAIGNS..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full bg-[#090f10] border border-outline/30 focus:border-primary text-[10px] font-mono text-[#dee4e3] pl-8 pr-3 py-2 uppercase tracking-wide focus:outline-none"
              />
              {searchText && (
                <button 
                  onClick={() => setSearchText('')} 
                  className="absolute right-3 text-on-surface-variant hover:text-primary"
                >
                  <X size={10} />
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="grid grid-cols-4 border border-outline-variant/15 p-0.5 bg-[#090f10]/40 font-mono text-[8px] uppercase tracking-tighter">
              <button
                onClick={() => setStatusFilter('all')}
                className={`py-1.5 text-center transition-colors cursor-pointer ${
                  statusFilter === 'all' ? 'bg-primary/10 text-primary border border-primary/25 font-bold' : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                ALL
              </button>
              <button
                onClick={() => setStatusFilter('planning')}
                className={`py-1.5 text-center transition-colors cursor-pointer ${
                  statusFilter === 'planning' ? 'bg-[#4adada]/15 text-[#4adada] border border-[#4adada]/25 font-bold' : 'text-on-surface-variant hover:text-[#4adada]'
                }`}
              >
                PLANNING
              </button>
              <button
                onClick={() => setStatusFilter('production')}
                className={`py-1.5 text-center transition-colors cursor-pointer ${
                  statusFilter === 'production' ? 'bg-[#ffb68b]/15 text-[#ffb68b] border border-[#ffb68b]/25 font-bold' : 'text-on-surface-variant hover:text-[#ffb68b]'
                }`}
              >
                PROD
              </button>
              <button
                onClick={() => setStatusFilter('published')}
                className={`py-1.5 text-center transition-colors cursor-pointer ${
                  statusFilter === 'published' ? 'bg-on-surface-variant/15 text-[#dee4e3] border border-outline-variant/25 font-bold' : 'text-on-surface-variant hover:text-[#dee4e3]'
                }`}
              >
                DONE
              </button>
            </div>
          </div>

          {/* List Area */}
          <div className="flex-grow overflow-y-auto p-4 space-y-3">
            {loadingCampaigns ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-on-surface-variant/60 font-mono text-[10px] gap-2">
                <Loader2 className="animate-spin text-primary" size={16} />
                <span>Loading Campaigns...</span>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant/40 font-mono text-[10px] uppercase border border-dashed border-outline-variant/20 p-4">
                No Campaigns Found
              </div>
            ) : (
              filteredCampaigns.map((camp) => (
                <div
                  key={camp.id}
                  onClick={() => setSelectedCampaignId(camp.id)}
                  className={`border group relative p-4 flex flex-col justify-between hover-glow cursor-pointer transition-all ${
                    selectedCampaignId === camp.id 
                      ? 'border-primary bg-surface-container shadow-[0_0_15px_rgba(0,184,184,0.1)]' 
                      : 'border-outline-variant/30 bg-[#090f10]/35'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[8px] font-mono uppercase tracking-widest shrink-0">
                      <span className={`px-1.5 py-0.5 border ${
                        camp.status === 'planning' 
                          ? 'bg-[#4adada]/10 border-[#4adada]/20 text-[#4adada]' 
                          : camp.status === 'production' 
                            ? 'bg-[#ffb68b]/10 border-[#ffb68b]/20 text-[#ffb68b]' 
                            : 'bg-outline-variant/10 border-outline-variant/20 text-[#dee4e3]'
                      }`}>
                        {camp.status === 'planning' ? 'Planning' : camp.status === 'production' ? 'In Production' : 'Published'}
                      </span>
                      
                      <span className={`px-1.5 py-0.5 border ${
                        camp.competitionLevel === 'Low'
                          ? 'bg-[#4adada]/10 border-[#4adada]/20 text-[#4adada]'
                          : camp.competitionLevel === 'Medium'
                            ? 'bg-[#ffb68b]/10 border-[#ffb68b]/20 text-[#ffb68b]'
                            : 'bg-[#ffb4ab]/10 border-[#ffb4ab]/20 text-[#ffb4ab]'
                      }`}>
                        Comp: {camp.competitionLevel}
                      </span>
                    </div>

                    <h4 className="font-mono text-[11px] font-bold text-[#dee4e3] uppercase tracking-wide line-clamp-2 leading-relaxed">
                      {camp.title}
                    </h4>
                    
                    <p className="font-sans text-[9px] text-on-surface-variant/80 line-clamp-2 leading-normal italic">
                      "{camp.aiReasoning}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-outline-variant/10 shrink-0">
                    <span className="font-mono text-[8px] text-on-surface-variant/60 uppercase">
                      Keyword: <span className="text-[#dee4e3] font-semibold">"{camp.keyword}"</span>
                    </span>

                    {/* Inline Delete Confirmation or Button */}
                    <div className="flex items-center gap-1">
                      {campaignToDelete === camp.id ? (
                        <div className="flex items-center gap-1 font-mono text-[7px]" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => handleDeleteCampaign(camp.id)}
                            className="bg-[#93000a] text-[#ffdad6] px-1.5 py-0.5 uppercase font-bold hover:bg-[#93000a]/80"
                          >
                            YES
                          </button>
                          <button 
                            onClick={() => setCampaignToDelete(null)}
                            className="bg-surface-container-highest text-[#dee4e3] px-1.5 py-0.5 uppercase hover:bg-surface-container-highest/80"
                          >
                            NO
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCampaignToDelete(camp.id);
                          }}
                          className="text-on-surface-variant hover:text-[#ffb4ab] p-1 transition-colors"
                          title="Delete Campaign"
                        >
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* CENTER PANEL: Campaign Details & Script Workspace */}
        <main className="flex-grow lg:h-full overflow-y-auto p-6 space-y-6 bg-[#0f1415] min-w-0">
          {!activeCampaign ? (
            <div className="h-full border border-dashed border-outline-variant/30 flex flex-col items-center justify-center text-center p-6 bg-[#090f10]/10">
              <Compass className="text-on-surface-variant/30 mb-4 animate-pulse" size={48} />
              <h3 className="font-display text-headline-lg uppercase text-on-surface-variant mb-2">No Campaign Selected</h3>
              <p className="font-body text-sm text-on-surface-variant/60 max-w-xs leading-relaxed">
                Choose a saved planner item from the queue list on the left, or create a brand new intelligence analysis to save.
              </p>
              <button
                onClick={() => navigate('/admin/opportunities')}
                className="mt-6 px-4 py-2 bg-primary hover:bg-primary-container text-[#003737] font-mono text-[10px] uppercase tracking-wider font-semibold transition-colors flex items-center gap-1.5"
              >
                <PlusCircle size={12} /> Scan Opportunities
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Detail Header block */}
              <div className="border border-outline-variant/20 bg-[#090f10] p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-outline-variant/10 pb-4">
                  <div className="space-y-1">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-primary">Target Keyword Campaign</span>
                    <h2 className="font-mono text-base font-bold text-[#dee4e3] uppercase tracking-wide leading-tight">
                      {activeCampaign.title}
                    </h2>
                  </div>
                  
                  {/* Status Dropdown */}
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="font-mono text-[9px] uppercase text-on-surface-variant tracking-wider">Status:</span>
                    <select
                      value={activeCampaign.status}
                      onChange={(e) => handleStatusChange(activeCampaign.id, e.target.value as any)}
                      className="bg-[#0c1011] border border-outline/30 text-[9px] font-mono text-[#dee4e3] px-3 py-1.5 focus:outline-none focus:border-primary uppercase rounded-none cursor-pointer tracking-wider"
                    >
                      <option value="planning">📁 PLANNING</option>
                      <option value="production">🎬 IN PRODUCTION</option>
                      <option value="published">✅ PUBLISHED</option>
                    </select>
                  </div>
                </div>

                {/* Sub Metadata Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-[9px] uppercase text-on-surface-variant">
                  <div>
                    <span className="block text-[8px] text-on-surface-variant/50">Primary Keyword</span>
                    <span className="text-[#dee4e3] font-semibold select-all">"{activeCampaign.keyword}"</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-on-surface-variant/50">Video Format</span>
                    <span className="text-[#dee4e3] font-semibold">{activeCampaign.videoType}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-on-surface-variant/50">Trend Pattern</span>
                    <span className="text-secondary font-semibold">{activeCampaign.trendDirection}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-on-surface-variant/50">Competition</span>
                    <span className="text-[#ffb4ab] font-semibold">{activeCampaign.competitionLevel}</span>
                  </div>
                </div>

                <div className="h-[1px] bg-outline-variant/15 my-3" />

                {/* Content Goals Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-[9px] uppercase text-on-surface-variant">
                  <div className="space-y-1">
                    <span className="block text-[8px] text-primary font-bold tracking-wider">🎯 Primary Goal</span>
                    <select
                      value={activeCampaign.primaryGoal || 'Authority Building'}
                      onChange={(e) => handleGoalChange(activeCampaign.id, 'primary', e.target.value)}
                      className="w-full bg-[#0c1011] border border-secondary/35 text-[9px] font-mono text-[#dee4e3] px-2 py-1 focus:outline-none focus:border-secondary uppercase rounded-none cursor-pointer tracking-wider"
                    >
                      <option value="Authority Building">Authority Building</option>
                      <option value="Affiliate Revenue">Affiliate Revenue</option>
                      <option value="Search Traffic">Search Traffic</option>
                      <option value="Product Review">Product Review</option>
                      <option value="Tutorial Value">Tutorial Value</option>
                      <option value="Social Clip Potential">Social Clip Potential</option>
                      <option value="Website SEO Asset">Website SEO Asset</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="block text-[8px] text-primary font-bold tracking-wider">🎯 Secondary Goal</span>
                    <select
                      value={activeCampaign.secondaryGoal || 'Affiliate Revenue'}
                      onChange={(e) => handleGoalChange(activeCampaign.id, 'secondary', e.target.value)}
                      className="w-full bg-[#0c1011] border border-primary/35 text-[9px] font-mono text-[#dee4e3] px-2 py-1 focus:outline-none focus:border-primary uppercase rounded-none cursor-pointer tracking-wider"
                    >
                      <option value="Authority Building">Authority Building</option>
                      <option value="Affiliate Revenue">Affiliate Revenue</option>
                      <option value="Search Traffic">Search Traffic</option>
                      <option value="Product Review">Product Review</option>
                      <option value="Tutorial Value">Tutorial Value</option>
                      <option value="Social Clip Potential">Social Clip Potential</option>
                      <option value="Website SEO Asset">Website SEO Asset</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="block text-[8px] text-primary font-bold tracking-wider">🎯 Third Goal</span>
                    <select
                      value={activeCampaign.tertiaryGoal || 'Search Traffic'}
                      onChange={(e) => handleGoalChange(activeCampaign.id, 'tertiary', e.target.value)}
                      className="w-full bg-[#0c1011] border border-outline/35 text-[9px] font-mono text-[#dee4e3] px-2 py-1 focus:outline-none focus:border-primary uppercase rounded-none cursor-pointer tracking-wider"
                    >
                      <option value="Authority Building">Authority Building</option>
                      <option value="Affiliate Revenue">Affiliate Revenue</option>
                      <option value="Search Traffic">Search Traffic</option>
                      <option value="Product Review">Product Review</option>
                      <option value="Tutorial Value">Tutorial Value</option>
                      <option value="Social Clip Potential">Social Clip Potential</option>
                      <option value="Website SEO Asset">Website SEO Asset</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Viewer Intent */}
              <div className="space-y-2">
                <span className="block font-mono text-[9px] uppercase tracking-wider text-primary border-b border-outline-variant/25 pb-1">Viewer Search Intent</span>
                <div className="bg-[#090f10] border border-outline-variant/20 p-4 font-sans text-xs text-[#dee4e3] leading-relaxed italic">
                  "{activeCampaign.intent}"
                </div>
              </div>

              {/* High-Retention Hook Strategy */}
              {activeCampaign.hooks && (
                <div className="space-y-2.5 bg-[#14120c] border border-[#ffb68b]/30 p-4 relative">
                  <div className="flex justify-between items-center border-b border-[#ffb68b]/20 pb-1.5">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#ffb68b] flex items-center gap-1">
                      ⚡ High-Retention Hook Blueprint
                    </span>
                    <span className="bg-[#ffb68b]/10 text-[#ffb68b] border border-[#ffb68b]/20 px-1 py-0.5 text-[7px] font-mono uppercase">
                      First 30s Retention
                    </span>
                  </div>

                  <div className="space-y-3 font-mono text-[9px] text-on-surface-variant uppercase">
                    {/* Curiosity Hook */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[#ffb68b]/80 block text-[8px] tracking-wider font-semibold">1. Curiosity Hook</span>
                        <button
                          onClick={() => handleCopyText(activeCampaign.hooks.curiosity, 'hook-curiosity')}
                          className="text-primary hover:text-primary-light flex items-center gap-1 font-mono text-[8px] cursor-pointer"
                        >
                          {copiedField === 'hook-curiosity' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <div className="bg-[#090f10] p-2 border border-outline-variant/15 font-sans text-[10.5px] text-[#dee4e3] normal-case leading-relaxed select-all">
                        {activeCampaign.hooks.curiosity}
                      </div>
                    </div>

                    {/* Pain-Point Hook */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[#ffb68b]/80 block text-[8px] tracking-wider font-semibold">2. Pain-Point Hook</span>
                        <button
                          onClick={() => handleCopyText(activeCampaign.hooks.painPoint, 'hook-painpoint')}
                          className="text-primary hover:text-primary-light flex items-center gap-1 font-mono text-[8px] cursor-pointer"
                        >
                          {copiedField === 'hook-painpoint' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <div className="bg-[#090f10] p-2 border border-outline-variant/15 font-sans text-[10.5px] text-[#dee4e3] normal-case leading-relaxed select-all">
                        {activeCampaign.hooks.painPoint}
                      </div>
                    </div>

                    {/* Visual-Action Hook */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[#ffb68b]/80 block text-[8px] tracking-wider font-semibold">3. Visual-Action Hook</span>
                        <button
                          onClick={() => handleCopyText(activeCampaign.hooks.visualAction, 'hook-visual')}
                          className="text-primary hover:text-primary-light flex items-center gap-1 font-mono text-[8px] cursor-pointer"
                        >
                          {copiedField === 'hook-visual' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <div className="bg-[#090f10] p-2 border border-outline-variant/15 font-sans text-[10.5px] text-[#dee4e3] normal-case leading-relaxed select-all italic text-secondary">
                        {activeCampaign.hooks.visualAction}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Talking Points Outline */}
              <div className="space-y-2">
                <span className="block font-mono text-[9px] uppercase tracking-wider text-primary border-b border-outline-variant/25 pb-1">Outline talking points</span>
                <div className="bg-[#090f10] border border-outline-variant/20 p-4 font-mono text-[10px] space-y-2 leading-relaxed">
                  {activeCampaign.outline.map((pt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-secondary select-none font-bold">0{idx + 1}.</span>
                      <span className="text-[#dee4e3] select-all">{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Script Writer Workspace */}
              <div className="space-y-2.5">
                <div className="block font-mono text-[9px] uppercase tracking-wider text-primary border-b border-outline-variant/25 pb-1 flex items-center justify-between">
                  <span>AI Video Script Workspace</span>
                  
                  <div className="flex items-center gap-3">
                    {activeCampaign.script && !isEditingScript && (
                      <button
                        onClick={() => {
                          setIsEditingScript(true);
                          setEditedScript(activeCampaign.script);
                        }}
                        className="text-on-surface-variant hover:text-primary flex items-center gap-1 font-mono text-[8px] uppercase cursor-pointer"
                      >
                        <Edit2 size={8} /> Edit Script
                      </button>
                    )}

                    {activeCampaign.script && (
                      <button
                        onClick={() => handleCopyText(isEditingScript ? editedScript : activeCampaign.script, 'video-script')}
                        className="text-on-surface-variant hover:text-primary flex items-center gap-1 font-mono text-[8px] uppercase cursor-pointer"
                      >
                        {copiedField === 'video-script' ? <Check size={8} className="text-primary" /> : <Copy size={8} />} Copy Script
                      </button>
                    )}
                  </div>
                </div>

                {isGeneratingScript ? (
                  <div className="bg-[#090f10]/40 border border-outline-variant/20 p-12 flex flex-col items-center justify-center text-center space-y-4">
                    <Loader2 className="animate-spin text-primary" size={24} />
                    <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
                      Compiling Talking Points &amp; Structuring Script...
                    </p>
                  </div>
                ) : isEditingScript ? (
                  <div className="space-y-3">
                    <textarea
                      value={editedScript}
                      onChange={(e) => setEditedScript(e.target.value)}
                      className="w-full h-80 bg-[#090f10] border border-outline/30 focus:border-primary p-4 font-mono text-[10px] text-[#dee4e3] leading-relaxed focus:outline-none resize-y"
                      placeholder="Write or edit script details here..."
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setIsEditingScript(false)}
                        disabled={isSavingScript}
                        className="px-3 py-1.5 border border-outline/30 hover:border-error text-on-surface-variant hover:text-[#ffb4ab] font-mono text-[9px] uppercase tracking-wider font-semibold cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveScript}
                        disabled={isSavingScript}
                        className="px-4 py-1.5 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-[#003737] font-mono text-[9px] uppercase tracking-wider font-bold cursor-pointer transition-colors flex items-center gap-1"
                      >
                        {isSavingScript ? (
                          <>
                            <Loader2 className="animate-spin" size={10} /> Saving...
                          </>
                        ) : (
                          <>
                            <Save size={10} /> Save Script
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : activeCampaign.script ? (
                  <div className="bg-[#090f10] border border-outline-variant/20 p-4 font-mono text-[10px] whitespace-pre-wrap select-all max-h-80 overflow-y-auto leading-relaxed text-[#dee4e3]">
                    {activeCampaign.script}
                  </div>
                ) : (
                  <div className="bg-[#090f10]/30 border border-outline-variant/20 p-6 flex flex-col items-center justify-center text-center space-y-3">
                    <p className="font-sans text-[10px] text-on-surface-variant/80 max-w-sm leading-normal">
                      Build out this campaign's blueprint into a ready-to-shoot video script. The AI writes a hook, setups, transitions, spoken details for outline items, call to actions, and b-roll camera cues.
                    </p>
                    {scriptError && (
                      <div className="font-mono text-[9px] text-[#ffdad6] bg-[#93000a]/10 border border-[#93000a]/35 px-3 py-1.5 w-full max-w-sm">
                        {scriptError}
                      </div>
                    )}
                    <button
                      onClick={handleGenerateScript}
                      className="px-4 py-2 bg-secondary hover:bg-secondary/90 text-[#003737] font-mono text-[9px] uppercase tracking-wider font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles size={10} /> Generate Video Script
                    </button>
                  </div>
                )}
              </div>

              {/* Thumbnail Concept */}
              <div className="space-y-2">
                <span className="block font-mono text-[9px] uppercase tracking-wider text-primary border-b border-outline-variant/25 pb-1">Visual Thumbnail Strategy</span>
                <div className="bg-[#090f10] border border-outline-variant/20 p-4 font-sans text-xs text-[#dee4e3] leading-relaxed">
                  {activeCampaign.thumbnailConcept}
                </div>
              </div>

              {/* Monetization Potential details */}
              <div className="space-y-2">
                <span className="block font-mono text-[9px] uppercase tracking-wider text-primary border-b border-outline-variant/25 pb-1">Monetization & Channel Synergy</span>
                <div className="bg-[#090f10] border border-outline-variant/20 p-4 font-mono text-[9px] space-y-3 uppercase leading-relaxed text-on-surface-variant">
                  <div>
                    <span className="text-secondary font-bold">Affiliates:</span>{" "}
                    <span className="text-on-surface normal-case font-sans text-[10px]">{activeCampaign.affiliatePotential}</span>
                  </div>
                  <div>
                    <span className="text-secondary font-bold">Merch Apparel:</span>{" "}
                    <span className="text-on-surface normal-case font-sans text-[10px]">{activeCampaign.merchPotential}</span>
                  </div>
                  <div>
                    <span className="text-[#ffb68b] font-bold">Blog Article Angle:</span>{" "}
                    <span className="text-on-surface normal-case font-sans text-[10px]">{activeCampaign.companionArticlePotential}</span>
                  </div>
                  <div>
                    <span className="text-[#ffb68b] font-bold">Short-Form Clip:</span>{" "}
                    <span className="text-on-surface normal-case font-sans text-[10px]">{activeCampaign.socialClipPotential}</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </main>

        {/* RIGHT PANEL: Scorecard & Transition Actions */}
        <aside className="w-full lg:w-96 p-6 bg-[#0c1011] border-t lg:border-t-0 border-outline-variant/20 overflow-y-auto space-y-6 shrink-0 lg:h-full">
          {!activeCampaign ? (
            <div className="h-[400px] border border-dashed border-outline-variant/30 flex flex-col items-center justify-center text-center p-6 bg-[#090f10]/10">
              <Gauge className="text-on-surface-variant/30 mb-4" size={36} />
              <h3 className="font-display text-headline-md uppercase text-on-surface-variant mb-2">Metrics Standby</h3>
              <p className="font-body text-xs text-on-surface-variant/60 max-w-xs leading-relaxed">
                Select a saved concept in the queue to show its dynamic opportunity scorecard and transition options.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Overall Score Dial */}
              <div className="bg-surface-container p-6 border border-outline-variant/30 flex items-center justify-between">
                <div>
                  <h4 className="font-mono text-[10px] uppercase text-on-surface-variant tracking-wider">Overall Opportunity Score</h4>
                  <span className="font-display text-headline-xl text-primary block mt-2">
                    {activeCampaign.scores?.overallScore || 0} 
                    <span className="text-sm font-mono text-on-surface-variant"> / 100</span>
                  </span>
                </div>
                <div className="w-16 h-16 rounded-none border-2 border-primary/20 flex flex-col items-center justify-center bg-primary/5 select-none shrink-0">
                  <span className="font-mono text-[10px] text-primary uppercase tracking-widest font-semibold">GRADE</span>
                  <span className="font-display text-headline-md text-primary mt-0.5">
                    {(activeCampaign.scores?.overallScore || 0) >= 90 ? 'S' : (activeCampaign.scores?.overallScore || 0) >= 80 ? 'A' : (activeCampaign.scores?.overallScore || 0) >= 70 ? 'B' : 'C'}
                  </span>
                </div>
              </div>

              {/* Scoring breakdown bars */}
              <div className="space-y-3.5 bg-[#090f10] border border-outline-variant/20 p-5 font-mono text-[9px] uppercase">
                <span className="text-primary font-bold tracking-wider block border-b border-outline-variant/10 pb-2 mb-3">Metrics Breakdown</span>
                
                {/* Trend Score */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Trend strength</span>
                    <span className="font-bold text-[#dee4e3]">{activeCampaign.scores?.trendScore || 0}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container border border-outline-variant/10">
                    <div className="h-full bg-secondary" style={{ width: `${activeCampaign.scores?.trendScore || 0}%` }}></div>
                  </div>
                </div>

                {/* Search Intent */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Search intent match</span>
                    <span className="font-bold text-[#dee4e3]">{activeCampaign.scores?.searchIntentScore || 0}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container border border-outline-variant/10">
                    <div className="h-full bg-secondary" style={{ width: `${activeCampaign.scores?.searchIntentScore || 0}%` }}></div>
                  </div>
                </div>

                {/* Competition Gap */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Competition opportunity gap</span>
                    <span className="font-bold text-[#dee4e3]">{activeCampaign.scores?.competitionGapScore || 0}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container border border-outline-variant/10">
                    <div className="h-full bg-primary" style={{ width: `${activeCampaign.scores?.competitionGapScore || 0}%` }}></div>
                  </div>
                </div>

                {/* Channel Fit */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Channel Profile relevance</span>
                    <span className="font-bold text-[#dee4e3]">{activeCampaign.scores?.channelFitScore || 0}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container border border-outline-variant/10">
                    <div className="h-full bg-primary" style={{ width: `${activeCampaign.scores?.channelFitScore || 0}%` }}></div>
                  </div>
                </div>

                {/* Affiliate Potential */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Affiliate matching revenue</span>
                    <span className="font-bold text-[#dee4e3]">{activeCampaign.scores?.affiliatePotentialScore || 0}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container border border-outline-variant/10">
                    <div className="h-full bg-primary" style={{ width: `${activeCampaign.scores?.affiliatePotentialScore || 0}%` }}></div>
                  </div>
                </div>

                {/* Merch Potential */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Merch integration matching</span>
                    <span className="font-bold text-[#dee4e3]">{activeCampaign.scores?.merchPotentialScore || 0}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container border border-outline-variant/10">
                    <div className="h-full bg-[#ffb68b]" style={{ width: `${activeCampaign.scores?.merchPotentialScore || 0}%` }}></div>
                  </div>
                </div>

                {/* Production Difficulty */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Production feasibility (100 = easiest)</span>
                    <span className="font-bold text-[#dee4e3]">{activeCampaign.scores?.productionDifficultyScore || 0}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container border border-outline-variant/10">
                    <div className="h-full bg-[#ffb68b]" style={{ width: `${activeCampaign.scores?.productionDifficultyScore || 0}%` }}></div>
                  </div>
                </div>
              </div>

              {/* AI reasoning card */}
              <div className="space-y-2">
                <span className="block font-mono text-[9px] uppercase tracking-wider text-primary">Strategic Reasoning</span>
                <div className="bg-[#090f10] border border-outline-variant/20 p-4 font-sans text-[11px] text-[#dee4e3] leading-relaxed">
                  {activeCampaign.aiReasoning}
                </div>
              </div>

              {/* TRANSITION & UPLOADER BUTTONS */}
              <div className="pt-4 border-t border-outline-variant/10 space-y-4">
                <div className="space-y-2">
                  <p className="font-sans text-[10px] text-on-surface-variant/80 leading-normal">
                    Ready to deploy? Upload the final video file and custom thumbnail directly to your YouTube channel with your pre-populated SEO blueprint.
                  </p>
                  <button
                    onClick={() => setIsUploadDrawerOpen(true)}
                    className="w-full py-4 bg-secondary hover:bg-secondary/90 text-[#321200] font-mono text-label-md uppercase tracking-wider font-bold cursor-pointer transition-colors flex items-center justify-center gap-2"
                  >
                    <Video size={16} /> Upload directly to YouTube
                  </button>
                </div>

                <div className="h-[1px] bg-outline-variant/20" />

                <div className="space-y-2">
                  <p className="font-sans text-[10px] text-on-surface-variant/80 leading-normal">
                    Or transition the metadata blueprint and outlines to the SEO Optimizer workspace if already uploaded.
                  </p>
                  <button
                    onClick={handleSendToOptimizer}
                    className="w-full py-4 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary font-mono text-label-md uppercase tracking-wider font-bold cursor-pointer transition-colors flex items-center justify-center gap-2"
                  >
                    <Layers size={16} /> Send to YouTube Optimizer
                  </button>
                </div>
              </div>

            </div>
          )}
        </aside>

      </div>

      {/* Persistent Toast Notifications */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 font-mono text-xs border uppercase tracking-wider flex items-center gap-3 animate-fade-in ${
          toastType === 'success' 
            ? 'bg-[#003737]/90 border-[#4adada]/50 text-[#4adada]' 
            : 'bg-[#93000a]/90 border-[#ffb4ab]/50 text-[#ffb4ab]'
        }`}>
          {toastType === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Upload directly to YouTube Drawer Overlay */}
      {isUploadDrawerOpen && activeCampaign && (
        <div className="fixed inset-0 z-50 overflow-hidden font-body flex">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => {
            if (uploadStatus !== 'uploading_video' && uploadStatus !== 'uploading_thumbnail') {
              setIsUploadDrawerOpen(false);
              setVideoFile(null);
              setThumbnailFile(null);
              setUploadStatus('idle');
              setUploadError('');
              setUploadProgress(0);
            }
          }} />
          
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-surface-container border-l border-outline-variant/50 flex flex-col p-6 shadow-2xl relative h-full text-on-surface">
              
              {/* Header */}
              <div className="flex justify-between items-center mb-6 shrink-0 border-b border-outline-variant/20 pb-4">
                <div className="space-y-1">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-secondary">YouTube Deployment</span>
                  <h3 className="font-display text-headline-md uppercase tracking-wider text-[#dee4e3]">Deploy Video Live</h3>
                </div>
                <button 
                  onClick={() => {
                    if (uploadStatus !== 'uploading_video' && uploadStatus !== 'uploading_thumbnail') {
                      setIsUploadDrawerOpen(false);
                      setVideoFile(null);
                      setThumbnailFile(null);
                      setUploadStatus('idle');
                      setUploadError('');
                      setUploadProgress(0);
                    }
                  }} 
                  disabled={uploadStatus === 'uploading_video' || uploadStatus === 'uploading_thumbnail'}
                  className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer p-1.5 border border-outline-variant/35 disabled:opacity-30"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="flex-grow overflow-y-auto space-y-5 pr-1 font-mono text-[10px]">
                
                {/* Linked Status */}
                <div className="bg-[#090f10] p-4 border border-outline-variant/20 space-y-3">
                  <span className="block text-[9px] uppercase text-on-surface-variant/70 tracking-wider">Channel Authorization</span>
                  {youtubeAccessToken ? (
                    <div className="flex items-center justify-between">
                      <span className="text-[#4adada] uppercase font-bold flex items-center gap-1.5">
                        <CheckCircle2 size={12} /> Connected to YouTube
                      </span>
                      <button 
                        onClick={handleAuthorizeYouTube}
                        className="text-on-surface-variant hover:text-primary underline cursor-pointer"
                      >
                        Re-Link Account
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-sans text-[9px] text-[#ffdad6]/80 leading-normal">
                        Authorize write permissions to upload video files and set thumbnails directly to your channel.
                      </p>
                      <button
                        onClick={handleAuthorizeYouTube}
                        disabled={isLinkingYouTube}
                        className="w-full py-2.5 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-[#003737] uppercase font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isLinkingYouTube ? (
                          <>
                            <Loader2 className="animate-spin" size={12} /> Connecting...
                          </>
                        ) : (
                          <>
                            <ExternalLink size={12} /> Link YouTube Channel
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {uploadStatus === 'success' ? (
                  <div className="bg-[#003737]/15 border border-[#4adada]/30 p-6 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-none bg-[#4adada]/10 border border-[#4adada]/30 flex items-center justify-center text-[#4adada]">
                      <CheckCircle2 size={24} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-display text-headline-md uppercase text-[#4adada]">Upload Successful!</h4>
                      <p className="font-sans text-[10px] text-on-surface-variant/80">
                        The video file, description metadata, and thumbnail were deployed to your channel.
                      </p>
                    </div>
                    {uploadedVideoId && (
                      <a
                        href={`https://studio.youtube.com/video/${uploadedVideoId}/edit`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 border border-[#4adada]/40 text-[#4adada] hover:bg-[#4adada]/10 uppercase transition-all flex items-center gap-1.5"
                      >
                        Open in YouTube Studio <ExternalLink size={10} />
                      </a>
                    )}
                    <button
                      onClick={() => {
                        setIsUploadDrawerOpen(false);
                        setVideoFile(null);
                        setThumbnailFile(null);
                        setUploadStatus('idle');
                        setUploadError('');
                        setUploadProgress(0);
                      }}
                      className="px-4 py-2 bg-[#090f10] border border-outline-variant/30 hover:border-primary text-on-surface hover:text-primary uppercase"
                    >
                      Close Panel
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Metadata Preview Card */}
                    <div className="bg-[#090f10]/40 p-4 border border-outline-variant/15 space-y-3">
                      <span className="block text-[9px] uppercase text-primary tracking-wider">SEO Blueprint Summary</span>
                      <div>
                        <span className="block text-[8px] text-on-surface-variant/60">DEPLOYMENT TITLE</span>
                        <span className="text-[#dee4e3] uppercase leading-tight font-semibold line-clamp-1 select-all font-mono">
                          {activeCampaign.title}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-on-surface-variant/60">PRIMARY TARGET KEYWORD</span>
                        <span className="text-primary font-bold">
                          "{activeCampaign.keyword}"
                        </span>
                      </div>
                    </div>

                    {/* Gear ASIN Booster */}
                    <div className="bg-[#090f10]/40 p-4 border border-outline-variant/15 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="block text-[9px] uppercase text-[#ffb68b] tracking-wider font-bold">90-Day Cookie Booster (ASINs)</span>
                        <button
                          type="button"
                          onClick={() => setParsedGearItems(prev => [...prev, `New Gear ${prev.length + 1}`])}
                          className="px-2 py-0.5 border border-dashed border-[#ffb68b]/30 hover:border-[#ffb68b] text-[#ffb68b] font-mono text-[8px] uppercase tracking-wide cursor-pointer transition-colors"
                        >
                          + Add Gear
                        </button>
                      </div>
                      <p className="font-sans text-[8px] text-on-surface-variant/70 leading-normal">
                        Edit item names, paste the Amazon ASIN code (e.g. B0C5S5K8XT) to upgrade to a 90-day Add-to-Cart link, or delete items.
                      </p>
                      
                      {parsedGearItems.length === 0 ? (
                        <div className="text-center py-3 text-on-surface-variant/40 font-mono text-[8px] border border-dashed border-outline-variant/10">
                          NO GEAR ITEMS ADDED
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                          {parsedGearItems.map((item, idx) => (
                            <div key={idx} className="space-y-1.5 border-b border-outline-variant/10 pb-2 last:border-b-0">
                              <div className="flex items-center justify-between gap-2">
                                <input
                                  type="text"
                                  placeholder="Gear Name"
                                  value={item}
                                  onChange={(e) => {
                                    const updated = [...parsedGearItems];
                                    const oldName = item;
                                    updated[idx] = e.target.value;
                                    setParsedGearItems(updated);
                                    if (gearAsins[oldName]) {
                                      setGearAsins(prev => {
                                        const copy = { ...prev };
                                        copy[e.target.value] = copy[oldName];
                                        delete copy[oldName];
                                        return copy;
                                      });
                                    }
                                  }}
                                  className="bg-[#090f10] border border-outline/30 focus:border-primary px-2 py-1 text-[9px] font-mono text-[#dee4e3] focus:outline-none w-[85%] rounded-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setParsedGearItems(prev => prev.filter((_, i) => i !== idx));
                                    setGearAsins(prev => {
                                      const copy = { ...prev };
                                      delete copy[item];
                                      return copy;
                                    });
                                  }}
                                  className="text-on-surface-variant hover:text-error p-1 cursor-pointer transition-colors"
                                  title="Delete Item"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[8px] text-on-surface-variant/60 uppercase">ASIN Code:</span>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    placeholder="ASIN CODE"
                                    value={gearAsins[item] || ''}
                                    onChange={(e) => setGearAsins(prev => ({ ...prev, [item]: e.target.value.toUpperCase().trim() }))}
                                    className="bg-[#090f10] border border-outline/30 focus:border-primary px-2 py-1 text-[9px] font-mono text-[#dee4e3] focus:outline-none w-32 uppercase rounded-none"
                                  />
                                  {gearAsins[item] && (
                                    <span className="text-secondary" title="90-Day Cart Link Active">⚡</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>


                    {/* Form Controls */}
                    <div className="space-y-4">
                      
                      {/* Video File Dropzone */}
                      <div className="space-y-2">
                        <label className="block text-[9px] uppercase text-on-surface-variant tracking-wider">Video File (MP4/MOV)</label>
                        {videoFile ? (
                          <div className="border border-[#4adada]/30 bg-[#4adada]/5 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 overflow-hidden mr-2">
                              <FileText size={16} className="text-[#4adada] shrink-0" />
                              <div className="overflow-hidden leading-tight">
                                <span className="block text-on-surface uppercase truncate font-semibold text-[9px] font-mono">
                                  {videoFile.name}
                                </span>
                                <span className="block text-on-surface-variant/60 text-[8px] font-mono">
                                  {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                                </span>
                              </div>
                            </div>
                            {uploadStatus === 'idle' && (
                              <button 
                                onClick={() => setVideoFile(null)}
                                className="text-on-surface-variant hover:text-error p-1"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="border border-dashed border-outline-variant/40 bg-[#090f10] p-6 text-center hover:border-primary/50 transition-colors relative cursor-pointer">
                            <input
                              type="file"
                              accept="video/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setVideoFile(e.target.files[0]);
                                }
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <div className="flex flex-col items-center gap-2 text-on-surface-variant/70">
                              <Video size={20} />
                              <span className="uppercase text-[9px]">Select Video File</span>
                              <span className="text-[7px] text-on-surface-variant/40">MP4 or MOV Format</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Thumbnail Image Dropzone */}
                      <div className="space-y-2">
                        <label className="block text-[9px] uppercase text-on-surface-variant tracking-wider">Custom Thumbnail (JPG/PNG)</label>
                        {thumbnailFile ? (
                          <div className="border border-[#ffb68b]/30 bg-[#ffb68b]/5 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 overflow-hidden mr-2">
                              <PlusCircle size={16} className="text-[#ffb68b] shrink-0" />
                              <div className="overflow-hidden leading-tight">
                                <span className="block text-on-surface uppercase truncate font-semibold text-[9px] font-mono">
                                  {thumbnailFile.name}
                                </span>
                                <span className="block text-on-surface-variant/60 text-[8px] font-mono">
                                  {(thumbnailFile.size / 1024).toFixed(0)} KB
                                </span>
                              </div>
                            </div>
                            {uploadStatus === 'idle' && (
                              <button 
                                onClick={() => setThumbnailFile(null)}
                                className="text-on-surface-variant hover:text-error p-1"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="border border-dashed border-outline-variant/40 bg-[#090f10] p-6 text-center hover:border-secondary/50 transition-colors relative cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setThumbnailFile(e.target.files[0]);
                                }
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <div className="flex flex-col items-center gap-2 text-on-surface-variant/70">
                              <PlusCircle size={20} />
                              <span className="uppercase text-[9px]">Select Thumbnail Image</span>
                              <span className="text-[7px] text-on-surface-variant/40">JPG or PNG (Max 2MB)</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Settings Row */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[9px] uppercase text-on-surface-variant tracking-wider">Privacy State</label>
                          <select
                            value={privacyStatus}
                            onChange={(e) => setPrivacyStatus(e.target.value as any)}
                            disabled={uploadStatus !== 'idle'}
                            className="w-full bg-[#090f10] border border-outline/30 text-[9px] font-mono text-[#dee4e3] px-3 py-2 focus:outline-none focus:border-primary uppercase rounded-none cursor-pointer tracking-wider"
                          >
                            <option value="private">🔒 Private (Safe)</option>
                            <option value="unlisted">🔗 Unlisted</option>
                            <option value="public">🌐 Public</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[9px] uppercase text-on-surface-variant tracking-wider">Video Category</label>
                          <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            disabled={uploadStatus !== 'idle'}
                            className="w-full bg-[#090f10] border border-outline/30 text-[9px] font-mono text-[#dee4e3] px-3 py-2 focus:outline-none focus:border-primary uppercase rounded-none cursor-pointer tracking-wider"
                          >
                            <option value="22">People &amp; Blogs</option>
                            <option value="1">Film &amp; Animation</option>
                            <option value="27">Education</option>
                            <option value="26">Howto &amp; Style</option>
                          </select>
                        </div>
                      </div>

                    </div>

                    {/* Progress Bar & Status logs */}
                    {(uploadStatus === 'uploading_video' || uploadStatus === 'uploading_thumbnail') && (
                      <div className="space-y-2.5 bg-[#090f10] border border-outline-variant/15 p-4 shrink-0">
                        <div className="flex justify-between items-center text-[9px] uppercase">
                          <span className="text-primary font-bold flex items-center gap-1.5">
                            <Loader2 className="animate-spin text-primary" size={10} />
                            {uploadStatus === 'uploading_video' ? 'Uploading Video File...' : 'Uploading Custom Thumbnail...'}
                          </span>
                          <span className="font-bold text-[#dee4e3]">
                            {uploadStatus === 'uploading_video' ? `${uploadProgress.toFixed(0)}%` : 'SETTING...'}
                          </span>
                        </div>
                        <div className="h-1.5 bg-surface-container border border-outline-variant/10">
                          <div 
                            className="h-full bg-primary transition-all duration-300" 
                            style={{ width: `${uploadStatus === 'uploading_video' ? uploadProgress : 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Error Box */}
                    {uploadError && (
                      <div className="bg-[#93000a]/10 border border-[#93000a]/35 p-4 flex gap-2 text-[#ffdad6]">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        <span className="font-sans leading-relaxed text-[9px] uppercase">{uploadError}</span>
                      </div>
                    )}

                    {/* Deploy Actions */}
                    <div className="pt-4 border-t border-outline-variant/10 shrink-0">
                      <button
                        onClick={handleUploadVideo}
                        disabled={!videoFile || !youtubeAccessToken || uploadStatus === 'uploading_video' || uploadStatus === 'uploading_thumbnail'}
                        className="w-full py-4 bg-secondary hover:bg-secondary/90 disabled:bg-secondary/30 text-[#321200] disabled:text-[#321200]/40 font-mono text-label-md uppercase tracking-wider font-bold cursor-pointer transition-colors flex items-center justify-center gap-2"
                      >
                        {uploadStatus === 'uploading_video' || uploadStatus === 'uploading_thumbnail' ? (
                          <>
                            <Loader2 className="animate-spin" size={14} /> Deploying Live...
                          </>
                        ) : (
                          <>
                            <Upload size={14} /> Confirm &amp; Upload Video
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}

              </div>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
