import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signOut, 
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  FacebookAuthProvider
} from 'firebase/auth';
import { 
  BarChart2, 
  TrendingUp, 
  Clock, 
  Users, 
  Sparkles, 
  Loader2, 
  Lock, 
  ArrowLeft, 
  LogOut, 
  X, 
  ExternalLink, 
  PlayCircle, 
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { auth } from './firebase';
import { 
  fetchChannelAnalyticsReport, 
  fetchTopVideosAnalyticsReport, 
  generateMockChannelAnalyticsReport, 
  generateMockTopVideosReport, 
  type ChannelAnalyticsReport, 
  type VideoAnalyticsReport 
} from './youtubeApi';
import { generateAnalyticsInsights, MOCK_ANALYTICS_INSIGHTS, type AnalyticsInsightsOutput } from './geminiApi';
import { 
  fetchFacebookPages, 
  fetchInstagramBusinessAccount, 
  type FacebookPage, 
  type InstagramAccount 
} from './metaApi';

const ALLOWED_EMAIL = 'lynxrec@gmail.com';

export default function AnalyticsPage() {
  const navigate = useNavigate();

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // YouTube OAuth token state
  const [youtubeAccessToken, setYoutubeAccessToken] = useState<string | null>(() => {
    return sessionStorage.getItem('yt_access_token');
  });
  const [isLinkingYouTube, setIsLinkingYouTube] = useState(false);

  // Meta (Facebook & Instagram) OAuth states
  const [facebookAccessToken, setFacebookAccessToken] = useState<string | null>(() => {
    return sessionStorage.getItem('fb_access_token');
  });
  const [facebookPages, setFacebookPages] = useState<FacebookPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(() => {
    return sessionStorage.getItem('fb_selected_page_id');
  });
  const [instagramAccount, setInstagramAccount] = useState<InstagramAccount | null>(() => {
    const id = sessionStorage.getItem('ig_account_id');
    const username = sessionStorage.getItem('ig_username');
    return id && username ? { id, username } : null;
  });
  const [isLinkingFacebook, setIsLinkingFacebook] = useState(false);

  // Analytics settings
  const [dateRangeDays, setDateRangeDays] = useState<number>(30);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');
  
  // Loaded Reports
  const [channelReport, setChannelReport] = useState<ChannelAnalyticsReport | null>(null);
  const [topVideosReport, setTopVideosReport] = useState<VideoAnalyticsReport[]>([]);

  // Gemini Performance Advisor state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [advisorError, setAdvisorError] = useState('');
  const [aiInsights, setAiInsights] = useState<AnalyticsInsightsOutput | null>(null);

  // Custom interactive states for Checklist and Expandable items
  const [checkedActions, setCheckedActions] = useState<Record<number, boolean>>({});
  const [isGrowthDriverExpanded, setIsGrowthDriverExpanded] = useState(false);
  const [isRetentionWarningExpanded, setIsRetentionWarningExpanded] = useState(false);

  const renderConfidenceBadge = (score?: 'HIGH' | 'MEDIUM' | 'LOW') => {
    if (!score) return null;
    let bg = '';
    let text = '';
    let label = '';
    if (score === 'HIGH') {
      bg = 'bg-[#4adada]/10 border-[#4adada]/25';
      text = 'text-[#4adada]';
      label = 'HIGH CONFIDENCE';
    } else if (score === 'MEDIUM') {
      bg = 'bg-[#ffb68b]/10 border-[#ffb68b]/25';
      text = 'text-[#ffb68b]';
      label = 'MEDIUM CONFIDENCE';
    } else {
      bg = 'bg-[#ffb4ab]/10 border-[#ffb4ab]/25';
      text = 'text-[#ffb4ab]';
      label = 'LOW CONFIDENCE - SMALL SAMPLE';
    }
    return (
      <span className={`px-1.5 py-0.5 border text-[7.5px] font-mono font-bold tracking-widest ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  // Chart state
  const [hoveredDataPoint, setHoveredDataPoint] = useState<any | null>(null);

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

  // Fetch / Generate Analytics report
  useEffect(() => {
    if (!user) return;

    const loadAnalytics = async () => {
      setIsLoadingData(true);
      setAnalyticsError('');
      try {
        if (youtubeAccessToken) {
          // Attempt real API fetch
          const report = await fetchChannelAnalyticsReport(youtubeAccessToken, dateRangeDays);
          const topVideos = await fetchTopVideosAnalyticsReport(youtubeAccessToken, dateRangeDays, 5);
          setChannelReport(report);
          setTopVideosReport(topVideos);
        } else {
          // Fall back to offline mock reports
          const mockReport = generateMockChannelAnalyticsReport(dateRangeDays);
          const mockTopVideos = generateMockTopVideosReport();
          setChannelReport(mockReport);
          setTopVideosReport(mockTopVideos);
        }
      } catch (err: any) {
        console.warn('Live API fetch failed, falling back to mock analytics:', err);
        setAnalyticsError('Live YouTube integration not completed or scopes unauthorized. Showing premium simulated metrics.');
        
        // Populate mock reports as fallback
        const mockReport = generateMockChannelAnalyticsReport(dateRangeDays);
        const mockTopVideos = generateMockTopVideosReport();
        setChannelReport(mockReport);
        setTopVideosReport(mockTopVideos);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadAnalytics();
  }, [user, youtubeAccessToken, dateRangeDays]);

  // Hydrate Facebook Pages list if already connected
  useEffect(() => {
    if (facebookAccessToken && user) {
      fetchFacebookPages(facebookAccessToken)
        .then(pages => {
          setFacebookPages(pages);
          const activePageId = sessionStorage.getItem('fb_selected_page_id');
          if (activePageId) {
            const page = pages.find(p => p.id === activePageId);
            if (page) {
              sessionStorage.setItem('fb_selected_page_token', page.access_token);
              fetchInstagramBusinessAccount(page.access_token, page.id)
                .then(igAcc => {
                  if (igAcc) {
                    setInstagramAccount(igAcc);
                    sessionStorage.setItem('ig_account_id', igAcc.id);
                    sessionStorage.setItem('ig_username', igAcc.username);
                  }
                })
                .catch(err => console.warn('Failed to re-sync IG account on mount:', err));
            }
          }
        })
        .catch(err => {
          console.warn('Cached FB access token expired or invalid:', err);
          setFacebookAccessToken(null);
          setFacebookPages([]);
          setSelectedPageId(null);
          setInstagramAccount(null);
          sessionStorage.removeItem('fb_access_token');
          sessionStorage.removeItem('fb_selected_page_id');
          sessionStorage.removeItem('fb_selected_page_token');
          sessionStorage.removeItem('ig_account_id');
          sessionStorage.removeItem('ig_username');
        });
    }
  }, [facebookAccessToken, user]);

  const handleLinkMeta = async () => {
    setIsLinkingFacebook(true);
    setAnalyticsError('');
    const provider = new FacebookAuthProvider();
    provider.addScope('pages_show_list');
    provider.addScope('pages_read_engagement');
    provider.addScope('pages_manage_posts');
    provider.addScope('instagram_basic');
    provider.addScope('instagram_content_publish');

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = FacebookAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
      if (token) {
        setFacebookAccessToken(token);
        sessionStorage.setItem('fb_access_token', token);
        
        const pages = await fetchFacebookPages(token);
        setFacebookPages(pages);
        
        if (pages.length > 0) {
          const firstPage = pages[0];
          setSelectedPageId(firstPage.id);
          sessionStorage.setItem('fb_selected_page_id', firstPage.id);
          sessionStorage.setItem('fb_selected_page_token', firstPage.access_token);
          
          const igAcc = await fetchInstagramBusinessAccount(firstPage.access_token, firstPage.id);
          if (igAcc) {
            setInstagramAccount(igAcc);
            sessionStorage.setItem('ig_account_id', igAcc.id);
            sessionStorage.setItem('ig_username', igAcc.username);
          } else {
            setInstagramAccount(null);
            sessionStorage.removeItem('ig_account_id');
            sessionStorage.removeItem('ig_username');
          }
        }
      } else {
        throw new Error('Failed to retrieve Facebook access token.');
      }
    } catch (err: any) {
      console.error('Meta Link failed:', err);
      setAnalyticsError(err.message || 'Meta account connection failed.');
    } finally {
      setIsLinkingFacebook(false);
    }
  };

  const handlePageChange = async (pageId: string) => {
    setSelectedPageId(pageId);
    sessionStorage.setItem('fb_selected_page_id', pageId);
    
    const page = facebookPages.find(p => p.id === pageId);
    if (page) {
      sessionStorage.setItem('fb_selected_page_token', page.access_token);
      
      try {
        const igAcc = await fetchInstagramBusinessAccount(page.access_token, page.id);
        if (igAcc) {
          setInstagramAccount(igAcc);
          sessionStorage.setItem('ig_account_id', igAcc.id);
          sessionStorage.setItem('ig_username', igAcc.username);
        } else {
          setInstagramAccount(null);
          sessionStorage.removeItem('ig_account_id');
          sessionStorage.removeItem('ig_username');
        }
      } catch (err) {
        console.error('Failed to fetch IG account for page:', err);
        setInstagramAccount(null);
        sessionStorage.removeItem('ig_account_id');
        sessionStorage.removeItem('ig_username');
      }
    }
  };

  // Request OAuth Access Token with Analytics read scopes
  const handleAuthorizeYouTube = async () => {
    setIsLinkingYouTube(true);
    setAnalyticsError('');
    const provider = new GoogleAuthProvider();
    // Scope for read-only YouTube Analytics API
    provider.addScope('https://www.googleapis.com/auth/yt-analytics.readonly');
    // Scope for read-only YouTube Data API (channel subscriber/views statistics)
    provider.addScope('https://www.googleapis.com/auth/youtube.readonly');
    // Scope for write access (for uploader and optimizer)
    provider.addScope('https://www.googleapis.com/auth/youtube.force-ssl');

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      if (token) {
        setYoutubeAccessToken(token);
        sessionStorage.setItem('yt_access_token', token);
      } else {
        throw new Error('Failed to retrieve Google OAuth access token.');
      }
    } catch (err: any) {
      console.error('YouTube Analytics Auth failed:', err);
      setAnalyticsError(err.message || 'Authorization failed. Please try again.');
    } finally {
      setIsLinkingYouTube(false);
    }
  };

  // Run Gemini Performance Advisor
  const handleAnalyzePerformance = async () => {
    if (!channelReport || topVideosReport.length === 0) return;
    setIsAnalyzing(true);
    setAdvisorError('');
    setAiInsights(null);
    setCheckedActions({});
    setIsGrowthDriverExpanded(false);
    setIsRetentionWarningExpanded(false);

    try {
      const response = await generateAnalyticsInsights({
        totalViews: channelReport.totalViews,
        totalComments: channelReport.totalComments,
        totalLikes: channelReport.totalLikes,
        totalShares: channelReport.totalShares,
        totalWatchTimeMinutes: channelReport.totalWatchTimeMinutes,
        avgViewDurationSeconds: channelReport.avgViewDurationSeconds,
        totalSubscribersGained: channelReport.totalSubscribersGained,
        days: dateRangeDays,
        topVideos: topVideosReport.map(v => ({
          title: v.title,
          views: v.views,
          watchTimeMinutes: v.watchTimeMinutes,
          averageViewDurationSeconds: v.averageViewDurationSeconds
        }))
      });

      setAiInsights(response);
    } catch (err: any) {
      console.warn('Advisor failed, using backup strategic insights mockup:', err);
      setAdvisorError('Gemini API quota exceeded or offline. Loaded offline creator strategic audit report.');
      setAiInsights(MOCK_ANALYTICS_INSIGHTS);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Admin login
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
      setChannelReport(null);
      setTopVideosReport([]);
      setAiInsights(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Helper: Format duration seconds → M:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // SVG Chart points mapper
  const renderViewsChart = () => {
    if (!channelReport || channelReport.dailyData.length === 0) return null;
    
    const data = channelReport.dailyData;
    const width = 600;
    const height = 180;
    const padding = 15;
    
    const viewsArray = data.map(d => d.views);
    const maxViews = Math.max(...viewsArray, 100);
    const minViews = Math.min(...viewsArray, 0);
    const range = maxViews - minViews;

    // Calculate coordinate coordinates
    const points = data.map((d, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2);
      const ratio = range > 0 ? (d.views - minViews) / range : 0.5;
      const y = height - padding - ratio * (height - padding * 2);
      return { x, y, ...d };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return (
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4adada" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#4adada" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          {/* Gridlines */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" strokeDasharray="4 4" />
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1" />

          {/* Area under the line */}
          <path d={areaD} fill="url(#chartGrad)" />

          {/* Stroke line */}
          <path d={pathD} fill="none" stroke="#4adada" strokeWidth="1.5" />

          {/* Interactive circles */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={hoveredDataPoint?.day === p.day ? 4 : 2}
              fill={hoveredDataPoint?.day === p.day ? '#ffb68b' : '#4adada'}
              stroke="#0f1415"
              strokeWidth="1"
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={() => setHoveredDataPoint(p)}
              onMouseLeave={() => setHoveredDataPoint(null)}
            />
          ))}
        </svg>

        {/* Dynamic Tooltip */}
        <div className="h-6 mt-1 flex justify-between items-center font-mono text-[9px] text-on-surface-variant/80 border-t border-outline-variant/10 pt-1">
          {hoveredDataPoint ? (
            <>
              <span>Date: <span className="text-[#dee4e3] font-bold">{hoveredDataPoint.day}</span></span>
              <span>Views: <span className="text-[#4adada] font-bold">{hoveredDataPoint.views}</span></span>
              <span>Watch Time: <span className="text-secondary font-bold">{hoveredDataPoint.watchTimeMinutes.toFixed(1)}m</span></span>
              <span>Subs: <span className="text-primary font-bold">+{hoveredDataPoint.subscribersGained}</span></span>
            </>
          ) : (
            <span className="italic text-on-surface-variant/40">Hover over the chart nodes to view daily breakdown metrics...</span>
          )}
        </div>
      </div>
    );
  };

  // Auth Loading
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

  // Admin Login
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

  return (
    <div className="min-h-screen lg:h-screen bg-[#0f1415] text-[#dee4e3] flex flex-col lg:overflow-hidden relative">
      <div className="film-grain"></div>

      {/* Header */}
      <header className="border-b border-outline-variant/20 bg-surface-container px-6 py-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-primary flex items-center gap-1">
              <BarChart2 size={20} />
            </span>
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
              onClick={() => navigate('/admin/campaigns')}
              className="px-3 py-1.5 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              Saved Campaigns
            </button>
            <button
              className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 select-none"
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
        
        {/* LEFT PANEL: Controls & Settings */}
        <aside className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-outline-variant/20 flex flex-col shrink-0 bg-[#0c1011] lg:h-full p-6 space-y-6">
          <div className="space-y-1">
            <span className="font-mono text-[9px] uppercase tracking-wider text-primary">Channel Diagnostics</span>
            <h3 className="font-display text-headline-sm uppercase tracking-wider text-[#dee4e3]">Scope Settings</h3>
          </div>

          {/* Date Selector */}
          <div className="space-y-2">
            <label className="block font-mono text-[10px] uppercase text-on-surface-variant tracking-wider">Date Window</label>
            <select
              value={dateRangeDays}
              onChange={(e) => setDateRangeDays(parseInt(e.target.value, 10))}
              disabled={isLoadingData}
              className="w-full bg-[#090f10] border border-outline/30 text-[10px] font-mono text-[#dee4e3] px-3 py-2.5 focus:outline-none focus:border-primary uppercase rounded-none cursor-pointer tracking-wider"
            >
              <option value={7}>📅 Last 7 Days</option>
              <option value={30}>📅 Last 30 Days</option>
              <option value={90}>📅 Last 90 Days</option>
            </select>
          </div>

          {/* YouTube Connection Card */}
          <div className="bg-[#090f10] p-4 border border-outline-variant/20 space-y-3 font-mono text-[10px]">
            <span className="block text-[9px] uppercase text-on-surface-variant/70 tracking-wider">YouTube Data Connection</span>
            {youtubeAccessToken ? (
              <div className="space-y-2">
                <span className="text-[#4adada] uppercase font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#4adada] rounded-full animate-pulse"></span>
                  CONNECTED (LIVE DATA)
                </span>
                <button 
                  onClick={handleAuthorizeYouTube}
                  disabled={isLinkingYouTube}
                  className="text-on-surface-variant hover:text-primary underline cursor-pointer text-[9px] block uppercase"
                >
                  Refresh Permissions
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-secondary uppercase font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-secondary rounded-full"></span>
                  OFFLINE (SIMULATION MODE)
                </span>
                <p className="font-sans text-[9px] text-[#ffdad6]/70 leading-normal lowercase">
                  authorize analytics scopes to read live views and retention details.
                </p>
                <button
                  onClick={handleAuthorizeYouTube}
                  disabled={isLinkingYouTube}
                  className="w-full py-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-[#003737] uppercase font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-[9px]"
                >
                  {isLinkingYouTube ? (
                    <>
                      <Loader2 className="animate-spin" size={10} /> LINKING...
                    </>
                  ) : (
                    <>
                      <ExternalLink size={10} /> LINK LIVE YOUTUBE
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Meta Connection Card */}
          <div className="bg-[#090f10] p-4 border border-outline-variant/20 space-y-3 font-mono text-[10px]">
            <span className="block text-[9px] uppercase text-on-surface-variant/70 tracking-wider">Meta Page & IG Connection</span>
            {facebookAccessToken ? (
              <div className="space-y-3">
                <span className="text-[#4adada] uppercase font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#4adada] rounded-full animate-pulse"></span>
                  CONNECTED
                </span>
                
                {/* Facebook Page Dropdown */}
                {facebookPages.length > 0 && (
                  <div className="space-y-1">
                    <label className="block text-[8px] uppercase text-on-surface-variant/80 tracking-wider">Facebook Page</label>
                    <select
                      value={selectedPageId || ''}
                      onChange={(e) => handlePageChange(e.target.value)}
                      className="w-full bg-[#0c1011] border border-[#3c4949]/30 text-[9px] text-[#dee4e3] px-2 py-1.5 focus:outline-none focus:border-primary rounded-none cursor-pointer font-mono"
                    >
                      {facebookPages.map(page => (
                        <option key={page.id} value={page.id}>{page.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Connected Instagram Account Status */}
                <div className="space-y-1 bg-[#0c1011] p-2 border border-outline-variant/10 text-[9px]">
                  <span className="block text-[8px] uppercase text-on-surface-variant/60 font-semibold tracking-wider mb-1">Instagram Business</span>
                  {instagramAccount ? (
                    <span className="text-[#dee4e3] block truncate font-bold font-sans">
                      📸 @{instagramAccount.username}
                    </span>
                  ) : (
                    <span className="text-secondary/70 block truncate italic font-semibold">
                      NO CONNECTED BUSINESS IG
                    </span>
                  )}
                </div>

                <button 
                  onClick={handleLinkMeta}
                  disabled={isLinkingFacebook}
                  className="text-on-surface-variant hover:text-primary underline cursor-pointer text-[8.5px] block uppercase"
                >
                  Reconnect Accounts
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-secondary uppercase font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-secondary rounded-full"></span>
                  OFFLINE (DRAFTS ONLY)
                </span>
                <p className="font-sans text-[9px] text-[#ffdad6]/70 leading-normal lowercase">
                  link meta to publish draft reels & posts directly from optimizer cards.
                </p>
                <button
                  onClick={handleLinkMeta}
                  disabled={isLinkingFacebook}
                  className="w-full py-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-[#003737] uppercase font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-[9px]"
                >
                  {isLinkingFacebook ? (
                    <>
                      <Loader2 className="animate-spin" size={10} /> LINKING...
                    </>
                  ) : (
                    <>
                      <ExternalLink size={10} /> LINK META BUSINESS
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Permissions Warning Notice */}
          <div className="bg-[#090f10]/40 p-4 border border-outline-variant/10 text-on-surface-variant font-sans text-[9.5px] leading-relaxed space-y-1">
            <span className="font-mono text-[8.5px] text-primary uppercase font-bold tracking-wider block">Security & privacy</span>
            <p>
              Your token is stored locally in your session cache. Antigravity reads stats to build outline tips, and never stores analytics reports permanently.
            </p>
          </div>
        </aside>

        {/* CENTER PANEL: Metrics Dashboard */}
        <main className="flex-grow lg:h-full overflow-y-auto p-6 space-y-6 bg-[#0f1415] min-w-0">
          
          {isLoadingData ? (
            <div className="h-full border border-outline-variant/20 flex flex-col items-center justify-center text-center p-6 bg-[#090f10]/10 font-mono text-[10px] gap-2">
              <Loader2 className="animate-spin text-primary" size={24} />
              <span className="uppercase tracking-widest text-on-surface-variant">Gathering Channel Report Data...</span>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* API Alert Banners */}
              {analyticsError && (
                <div className="bg-[#93000a]/10 border border-[#93000a]/30 p-3 flex gap-2 text-[#ffdad6] font-mono text-[9px] uppercase tracking-wide">
                  <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                  <span>{analyticsError}</span>
                </div>
              )}

              {/* KPI Cards Grid */}
              {channelReport && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Views */}
                  <div className="bg-surface-container border border-outline-variant/20 p-4 relative font-mono select-none">
                    <div className="flex items-center justify-between text-on-surface-variant text-[9px] uppercase tracking-wider">
                      <span>Total Views</span>
                      <TrendingUp size={12} className="text-secondary" />
                    </div>
                    <span className="font-display text-headline-md text-[#dee4e3] block mt-2">
                      {channelReport.totalViews.toLocaleString()}
                    </span>
                    <span className="text-[7.5px] text-secondary mt-1 block tracking-wider uppercase font-semibold">
                      ▲ +12% VS PREV WINDOW
                    </span>
                  </div>

                  {/* Card 2: Watch Time */}
                  <div className="bg-surface-container border border-outline-variant/20 p-4 relative font-mono select-none">
                    <div className="flex items-center justify-between text-on-surface-variant text-[9px] uppercase tracking-wider">
                      <span>Watch Time</span>
                      <Clock size={12} className="text-primary" />
                    </div>
                    <span className="font-display text-headline-md text-[#dee4e3] block mt-2">
                      {(channelReport.totalWatchTimeMinutes / 60).toFixed(0)} <span className="text-[10px] font-mono text-on-surface-variant">HRS</span>
                    </span>
                    <span className="text-[7.5px] text-primary mt-1 block tracking-wider uppercase font-semibold">
                      ▲ +8% VS PREV WINDOW
                    </span>
                  </div>

                  {/* Card 3: Subscribers */}
                  <div className="bg-surface-container border border-outline-variant/20 p-4 relative font-mono select-none">
                    <div className="flex items-center justify-between text-on-surface-variant text-[9px] uppercase tracking-wider">
                      <span>Subscribers Gained</span>
                      <Users size={12} className="text-primary" />
                    </div>
                    <span className="font-display text-headline-md text-[#dee4e3] block mt-2">
                      +{channelReport.totalSubscribersGained.toLocaleString()}
                    </span>
                    <span className="text-[7.5px] text-primary mt-1 block tracking-wider uppercase font-semibold">
                      ▲ +21% CONVERSION
                    </span>
                  </div>

                  {/* Card 4: Retention */}
                  <div className="bg-surface-container border border-outline-variant/20 p-4 relative font-mono select-none">
                    <div className="flex items-center justify-between text-on-surface-variant text-[9px] uppercase tracking-wider">
                      <span>Avg View Duration</span>
                      <TrendingUp size={12} className="text-secondary" />
                    </div>
                    <span className="font-display text-headline-md text-[#dee4e3] block mt-2">
                      {formatDuration(channelReport.avgViewDurationSeconds)}
                    </span>
                    <span className="text-[7.5px] text-secondary mt-1 block tracking-wider uppercase font-semibold">
                      ▲ 34.6% Avg Retention
                    </span>
                  </div>
                </div>
              )}

              {/* Sparkline Graphic Chart */}
              <div className="border border-outline-variant/20 bg-[#090f10] p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-outline-variant/10 pb-3">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-primary">Views Over Time</span>
                  <span className="font-mono text-[8px] bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-primary">DAILY RESOLUTION</span>
                </div>
                {renderViewsChart()}
              </div>

              {/* Top Performing Videos Table */}
              <div className="space-y-3">
                <div className="border-b border-outline-variant/20 pb-2">
                  <h4 className="font-mono text-[10px] uppercase text-primary tracking-wider">Top Performing Videos in Window</h4>
                </div>
                <div className="overflow-x-auto border border-outline-variant/20 bg-[#090f10]">
                  <table className="w-full text-left font-mono text-[10px]">
                    <thead>
                      <tr className="border-b border-outline-variant/20 bg-surface-container-low text-on-surface-variant uppercase">
                        <th className="p-3 w-1/2">Video Detail</th>
                        <th className="p-3 text-center">Views</th>
                        <th className="p-3 text-center">Watch Time</th>
                        <th className="p-3 text-center">Retention</th>
                        <th className="p-3 text-center">Likes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                      {topVideosReport.map((vid, idx) => {
                        // Estimate retention percentage out of a typical 10-minute (600s) benchmark for visual bars
                        const retentionPct = Math.min(Math.round((vid.averageViewDurationSeconds / 600) * 100), 100);
                        
                        return (
                          <tr key={idx} className="hover:bg-surface-container-lowest/30">
                            {/* Video detail */}
                            <td className="p-3">
                              <div className="flex gap-3 items-center">
                                <img 
                                  src={vid.thumbnail} 
                                  alt="" 
                                  className="w-14 h-8 bg-surface-container-lowest border border-outline-variant/20 object-cover shrink-0 select-none"
                                />
                                <div className="leading-tight overflow-hidden">
                                  <span className="font-bold text-[#dee4e3] block truncate uppercase select-all font-mono" title={vid.title}>
                                    {vid.title}
                                  </span>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="text-[8px] text-on-surface-variant/60 font-mono select-all">
                                      ID: {vid.id}
                                    </span>
                                    {vid.views > 1500 && vid.averageViewDurationSeconds < 175 && (
                                      <span className="text-[8px] bg-[#ffb4ab]/15 border border-[#ffb4ab]/35 text-[#ffb4ab] px-1 py-0.5 font-bold uppercase tracking-wider flex items-center gap-1 font-mono">
                                        ⚠️ Click interest high, weak hold
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            {/* Views */}
                            <td className="p-3 text-center font-bold text-[#dee4e3]">
                              {vid.views.toLocaleString()}
                            </td>
                            {/* Watch time */}
                            <td className="p-3 text-center text-secondary">
                              {(vid.watchTimeMinutes / 60).toFixed(1)} hrs
                            </td>
                            {/* Retention bar */}
                            <td className="p-3">
                              <div className="flex flex-col gap-1 w-24 mx-auto">
                                <div className="flex justify-between w-full text-[8px] font-semibold text-on-surface-variant/80">
                                  <span>{formatDuration(vid.averageViewDurationSeconds)}</span>
                                  <span className={
                                    retentionPct >= 35 
                                      ? 'text-[#4adada]' 
                                      : retentionPct >= 28 
                                        ? 'text-[#ffb68b]' 
                                        : 'text-[#ffb4ab]'
                                  }>{retentionPct}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-[#090f10] border border-outline-variant/10">
                                  <div 
                                    className={`h-full transition-all duration-300 ${
                                      retentionPct >= 35 
                                        ? 'bg-[#4adada]' 
                                        : retentionPct >= 28 
                                          ? 'bg-[#ffb68b]' 
                                          : 'bg-[#ffb4ab]'
                                    }`} 
                                    style={{ width: `${retentionPct}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            {/* Likes */}
                            <td className="p-3 text-center text-[#ffb68b]">
                              {vid.likes.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </main>

        {/* RIGHT PANEL: Gemini Advisor Panel */}
        <aside className="w-full lg:w-96 p-6 bg-[#0c1011] border-t lg:border-t-0 lg:border-r border-outline-variant/20 overflow-y-auto space-y-6 shrink-0 lg:h-full flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-outline-variant/25 pb-2">
              <span className="font-mono text-[9px] uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Sparkles size={12} className="animate-pulse" />
                Gemini Performance Advisor
              </span>
            </div>

            {!aiInsights ? (
              <div className="bg-[#090f10]/30 border border-outline-variant/20 p-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 rounded-none bg-primary/5 border border-primary/20 flex items-center justify-center text-primary">
                  <Sparkles size={20} />
                </div>
                <h4 className="font-mono text-[10px] uppercase text-[#dee4e3] font-bold">Diagnostics Standby</h4>
                <p className="font-sans text-[10px] text-on-surface-variant/80 leading-relaxed max-w-xs">
                  Generate data-driven optimization strategies. Gemini scans your views, watch time, and retention metrics to brainstorm trending opportunities and retention scripts.
                </p>
                {advisorError && (
                  <div className="font-mono text-[9px] text-[#ffdad6] bg-[#93000a]/10 border border-[#93000a]/35 px-3 py-1.5 w-full">
                    {advisorError}
                  </div>
                )}
                <button
                  onClick={handleAnalyzePerformance}
                  disabled={isLoadingData || isAnalyzing || !channelReport}
                  className="px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-[#003737] font-mono text-[9px] uppercase tracking-wider font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5 w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="animate-spin" size={10} /> ANALYZING CHANNEL...
                    </>
                  ) : (
                    <>
                      <Sparkles size={10} /> Analyze Performance
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                
                {/* Prioritized Creator Checklist */}
                {aiInsights.prioritizedActions && aiInsights.prioritizedActions.length > 0 && (
                  <div className="bg-primary/5 border border-primary/30 p-4 space-y-3 font-mono">
                    <div className="flex items-center gap-2 border-b border-primary/20 pb-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping"></span>
                      <span className="text-[9px] uppercase tracking-wider text-primary font-bold">What to Do Next</span>
                    </div>
                    <div className="space-y-2">
                      {aiInsights.prioritizedActions.map((action, i) => (
                        <label 
                          key={i} 
                          className={`flex items-start gap-2.5 cursor-pointer text-[9.5px] leading-relaxed transition-colors ${
                            checkedActions[i] ? 'text-on-surface-variant/40 line-through' : 'text-[#dee4e3] hover:text-primary'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={!!checkedActions[i]}
                            onChange={(e) => setCheckedActions(prev => ({ ...prev, [i]: e.target.checked }))}
                            className="mt-0.5 accent-primary bg-[#090f10] border border-outline/30 focus:ring-0 rounded-none w-3.5 h-3.5 cursor-pointer shrink-0"
                          />
                          <span>{action}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Executive Summary */}
                <div className="space-y-2">
                  <span className="block font-mono text-[8px] uppercase tracking-wider text-primary border-b border-outline-variant/15 pb-1">Performance Summary</span>
                  <p className="font-sans text-[10.5px] text-[#dee4e3] leading-relaxed italic">
                    "{aiInsights.performanceSummary}"
                  </p>
                </div>

                {/* Growth Driver */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-outline-variant/15 pb-1">
                    <span className="block font-mono text-[8px] uppercase tracking-wider text-secondary font-bold font-mono">Growth Drivers & Audience Focus</span>
                    {renderConfidenceBadge(aiInsights.confidenceScores?.growthDriver)}
                  </div>
                  <div className="bg-[#090f10] border border-outline-variant/15 p-3.5 font-mono text-[9px] uppercase leading-relaxed text-on-surface-variant space-y-2">
                    <span className="text-secondary font-bold">Primary Driver:</span>{' '}
                    <span 
                      className="text-[#dee4e3] normal-case font-sans text-[10px] block mt-1 leading-normal"
                      style={isGrowthDriverExpanded ? {} : {
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {aiInsights.growthDriverSummary}
                    </span>
                    <button
                      onClick={() => setIsGrowthDriverExpanded(!isGrowthDriverExpanded)}
                      className="text-primary hover:text-primary/80 transition-colors font-mono text-[8px] uppercase tracking-wider font-semibold cursor-pointer mt-1.5 flex items-center gap-1"
                    >
                      {isGrowthDriverExpanded ? '▲ Collapse Analysis' : '▼ Read Detailed Analysis'}
                    </button>
                  </div>
                </div>

                {/* Retention Alert */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-outline-variant/15 pb-1">
                    <span className="block font-mono text-[8px] uppercase tracking-wider text-[#ffb4ab] font-bold">Retention Warning & Hook Fixes</span>
                    {renderConfidenceBadge(aiInsights.confidenceScores?.retentionWarning)}
                  </div>
                  <div className="bg-[#090f10]/80 border border-[#ffb4ab]/15 p-3.5 font-mono text-[9px] uppercase leading-relaxed text-on-surface-variant space-y-2">
                    <span className="text-[#ffb4ab] font-bold">Observation:</span>{' '}
                    <span 
                      className="text-[#dee4e3] normal-case font-sans text-[10px] block leading-normal"
                      style={isRetentionWarningExpanded ? {} : {
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {aiInsights.retentionWarningSummary}
                    </span>
                    <button
                      onClick={() => setIsRetentionWarningExpanded(!isRetentionWarningExpanded)}
                      className="text-primary hover:text-primary/80 transition-colors font-mono text-[8px] uppercase tracking-wider font-semibold cursor-pointer mt-1.5 flex items-center gap-1"
                    >
                      {isRetentionWarningExpanded ? '▲ Collapse Analysis' : '▼ Read Detailed Analysis'}
                    </button>
                  </div>
                </div>

                {/* Content Pattern Detector */}
                {aiInsights.contentPatternDetector && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-outline-variant/15 pb-1">
                      <span className="block font-mono text-[8px] uppercase tracking-wider text-secondary font-bold">
                        Content Pattern Detector
                      </span>
                      {renderConfidenceBadge(aiInsights.confidenceScores?.patternDetection)}
                    </div>
                    <div className="bg-[#090f10] border border-secondary/20 p-3.5 font-mono text-[9px] uppercase space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-secondary/10 text-secondary text-[6.5px] font-bold px-1.5 py-0.5 border-b border-l border-secondary/25 tracking-widest">
                        PATTERN DETECTED
                      </div>

                      <div className="space-y-1">
                        <span className="text-secondary/60 block text-[7px] tracking-wider font-semibold">Winning Topic</span>
                        <div className="text-[#dee4e3] font-bold normal-case text-[9.5px] leading-tight">
                          {aiInsights.contentPatternDetector.winningTopic}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <div className="space-y-1">
                          <span className="text-secondary/60 block text-[7px] tracking-wider font-semibold">Winning Format</span>
                          <div className="text-[#dee4e3] font-bold normal-case text-[9.5px] leading-tight">
                            {aiInsights.contentPatternDetector.winningFormat}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-secondary/60 block text-[7px] tracking-wider font-semibold">Winning Promise</span>
                          <div className="text-[#dee4e3] font-bold normal-case text-[9.5px] leading-tight">
                            {aiInsights.contentPatternDetector.winningPromise}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-secondary/60 block text-[7px] tracking-wider font-semibold">Winning Hook Style</span>
                        <div className="text-[#dee4e3] font-bold normal-case text-[9.5px] leading-tight italic">
                          "{aiInsights.contentPatternDetector.winningHook}"
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-secondary/60 block text-[7px] tracking-wider font-semibold">Suggested Thumbnail Style</span>
                        <div className="text-[#dee4e3] font-bold normal-case text-[9.5px] leading-tight">
                          {aiInsights.contentPatternDetector.winningThumbnailStyle}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-outline-variant/15 text-on-surface-variant font-sans text-[9.5px] normal-case leading-relaxed">
                        {aiInsights.contentPatternDetector.recommendationReasoning}
                      </div>
                    </div>
                  </div>
                )}

                {/* Suggested Opportunities */}
                <div className="space-y-2.5">
                  <span className="block font-mono text-[8px] uppercase tracking-wider text-primary border-b border-outline-variant/15 pb-1">Suggested Content Opportunities</span>
                  <div className="space-y-2.5">
                    {aiInsights.suggestedOpportunities.map((opp, i) => (
                      <div key={i} className="bg-[#090f10] border border-outline-variant/20 p-3.5 flex flex-col justify-between hover:border-primary/40 transition-colors">
                        <div className="space-y-1">
                          <span className="font-mono text-[8px] text-secondary font-bold block">CONCEPT 0{i + 1}</span>
                          <h5 className="font-mono text-[10px] font-bold text-[#dee4e3] uppercase leading-tight">{opp.title}</h5>
                          <p className="font-sans text-[9px] text-on-surface-variant/80 leading-normal lowercase mt-1">{opp.reasoning}</p>
                        </div>
                        <button
                          onClick={() => navigate('/admin/opportunities', {
                            state: { prefillSearch: opp.keyword }
                          })}
                          className="mt-3 py-1.5 border border-primary/20 hover:bg-primary/5 text-primary font-mono text-[8px] uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer w-full"
                        >
                          Scan Topic Opportunities <ChevronRight size={8} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Re-analyze trigger */}
                <button
                  onClick={handleAnalyzePerformance}
                  disabled={isAnalyzing}
                  className="w-full py-2 bg-[#090f10] hover:bg-[#0c1314] text-on-surface-variant hover:text-[#dee4e3] border border-outline-variant/30 hover:border-primary font-mono text-[9px] uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-1"
                >
                  {isAnalyzing ? <Loader2 className="animate-spin" size={10} /> : 'Re-Run Performance Advisor'}
                </button>

              </div>
            )}
          </div>

          <div className="pt-4 border-t border-outline-variant/10 text-center font-mono text-[8px] text-on-surface-variant/40 select-none">
            Diagnostics Engine v1.2 — My Cine Toolbox
          </div>
        </aside>

      </div>
    </div>
  );
}
