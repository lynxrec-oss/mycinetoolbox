import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signOut, 
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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
  Search
} from 'lucide-react';
import { auth, db } from './firebase';
import { generateContentOpportunities, generateVideoScript, type OpportunityIdea, type OpportunityOutput } from './geminiApi';

const ALLOWED_EMAIL = 'lynxrec@gmail.com';

const PRESET_TOPICS = [
  { id: 'resolve', name: 'DaVinci Resolve', description: 'Color grading workflows, node structures, and tools.' },
  { id: 'dehancer', name: 'Dehancer Emulation', description: 'Film emulation plugins, grain settings, and film profile comparisons.' },
  { id: 'pyxis', name: 'Blackmagic Pyxis 6K', description: 'Real-world tests, rig builds, and color science breakdowns.' },
  { id: 'lenses', name: 'NiSi Athena Lenses', description: 'Cine lens tests, visual style reviews, and anamorphic vs spherical.' },
  { id: 'color-grading', name: 'Color Grading Tutorials', description: 'How to build commercial film looks and match footage.' },
  { id: 'detroit', name: 'Detroit Filmmaking', description: 'Local community stories, commercial projects, and gear setups.' },
  { id: 'gear', name: 'Filmmaking Gear Reviews', description: 'Monitors, external SSDs, lighting, and workspace gear.' },
  { id: 'merch', name: 'Merch Apparel Concepts', description: 'T-shirts and hoodies inspired by the colorist lifestyle.' }
];

const REDDIT_THREADS: Record<string, { title: string; description: string; score: number }[]> = {
  'r/davinciresolve': [
    { title: "CST shifting skin tones to magenta?", description: "Why does my color space transform (CST) shift skin tones to magenta when moving from Log to Rec709?", score: 42 },
    { title: "Matching Pyxis 6K with Sony A7SIII in Resolve?", description: "What is the quickest way to match Pyxis 6K film profiles with Sony footage in a multi-cam project?", score: 28 },
    { title: "Clean node tree structure for commercial projects?", description: "Does anyone have a clean, reproducible node graph layout for commercial grading work?", score: 65 },
    { title: "Resolve 19 HDR palettes vs primary wheels?", description: "Do you prefer using HDR color zones or the standard primary wheels for contrast adjustment?", score: 19 }
  ],
  'r/colorists': [
    { title: "Dehancer grain vs Resolve native tools?", description: "Does Dehancer grain emulation look more organic than DaVinci Resolve's native film grain plug-in?", score: 88 },
    { title: "Budget clean monitor output solutions?", description: "What are the best practices for setting up a calibrated monitor output without spending thousands?", score: 34 },
    { title: "Kodak 2383 look: how to avoid crushed blacks?", description: "The 2383 LUT crushes shadows extremely hard. How do you recover detail in the lower node levels?", score: 71 },
    { title: "Matching NiSi Athena primes with anamorphics?", description: "Has anyone successfully graded NiSi Athena lenses to match anamorphic lenses in a single scene?", score: 12 }
  ],
  'r/videography': [
    { title: "Blackmagic Pyxis 6K battery rig setups?", description: "What battery mounts and rig setups are you using to keep the Pyxis 6K compact but long-running?", score: 55 },
    { title: "NiSi Athena lenses vs DZO Vespid primes?", description: "Which of these budget cine sets has better flare control and chromatic aberration control?", score: 47 },
    { title: "Handling audio sync for multi-cam interviews?", description: "What is your go-to process for syncing camera scratch tracks with dedicated audio recorders?", score: 22 },
    { title: "Detroit filmmaking: permits & safety?", description: "Filming local commercial content in Detroit—do you bother with city permits for b-roll?", score: 31 }
  ],
  'r/filmmakers': [
    { title: "Cinematic lighting on a micro-budget?", description: "How do you achieve a high-end commercial look when you only have a single COB light and some foam boards?", score: 112 },
    { title: "Go-to LUTs for rapid client previews?", description: "What are your favorite film emulation LUTs to throw on footage for quick client approvals?", score: 40 },
    { title: "Do clients care about camera brands or grades?", description: "In your experience, do clients ask what camera was used, or do they only care about the final grade?", score: 95 },
    { title: "Detroit filmmakers community meetups?", description: "Are there any active filmmaker meetups or local vlogs/groups in the Detroit area?", score: 14 }
  ]
};

export default function OpportunityEnginePage() {
  const navigate = useNavigate();
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Opportunity generator state
  const [selectedTopicId, setSelectedTopicId] = useState<string>('resolve');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [report, setReport] = useState<OpportunityOutput | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<OpportunityIdea | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Script generation states
  const [script, setScript] = useState<string>('');
  const [isGeneratingScript, setIsGeneratingScript] = useState<boolean>(false);
  const [scriptError, setScriptError] = useState<string>('');

  // Firestore saving states
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activeRedditSub, setActiveRedditSub] = useState<string>('r/davinciresolve');

  // Clear script when selected idea changes
  useEffect(() => {
    setScript('');
    setScriptError('');
    setSaveSuccess(false);
    setSaveError('');
  }, [selectedIdea]);

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
      setReport(null);
      setSelectedIdea(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Trigger Content Opportunities Scan
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    setReport(null);
    setSelectedIdea(null);

    const activePreset = PRESET_TOPICS.find(t => t.id === selectedTopicId);
    const topicText = activePreset ? activePreset.name : 'Custom Topic';
    const notesText = customTopic.trim();

    try {
      const result = await generateContentOpportunities(topicText, notesText);
      setReport(result);
      if (result.opportunities && result.opportunities.length > 0) {
        setSelectedIdea(result.opportunities[0]);
      }
    } catch (err: any) {
      console.error('Failed to generate opportunities:', err);
      setError(err.message || 'An error occurred during opportunity intelligence analysis. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy to clipboard helper
  const handleCopyText = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Redirect to YouTube Optimizer with prefilled fields
  const handleBuildCampaign = (idea: OpportunityIdea) => {
    const formattedOutline = `🎬 TALKING POINTS / SCRIPT OUTLINE:\n` + 
      idea.outline.map(pt => `- ${pt}`).join('\n') + 
      `\n\n🎯 TARGET SEARCH INTENT:\n${idea.intent}\n\n💡 THUMBNAIL VISUAL CONCEPT:\n${idea.thumbnailConcept}`;

    navigate('/admin/youtube-seo', {
      state: {
        prefillTitle: idea.title,
        prefillKeyword: idea.keyword,
        prefillOutline: formattedOutline
      }
    });
  };

  // Generate video script handler
  const handleGenerateScript = async () => {
    if (!selectedIdea) return;
    setIsGeneratingScript(true);
    setScriptError('');
    setScript('');
    try {
      const result = await generateVideoScript(
        selectedIdea.title,
        selectedIdea.keyword,
        selectedIdea.outline,
        selectedIdea.intent,
        selectedIdea.videoType
      );
      setScript(result);
    } catch (err: any) {
      console.error('Failed to generate script:', err);
      setScriptError(err.message || 'Failed to generate script. Please try again.');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Save opportunity campaign to Firestore
  const handleSaveCampaign = async (idea: OpportunityIdea) => {
    if (!user) return;
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      await addDoc(collection(db, 'campaigns'), {
        title: idea.title,
        keyword: idea.keyword,
        intent: idea.intent,
        trendDirection: idea.trendDirection,
        competitionLevel: idea.competitionLevel,
        thumbnailConcept: idea.thumbnailConcept,
        outline: idea.outline,
        videoType: idea.videoType,
        affiliatePotential: idea.affiliatePotential,
        merchPotential: idea.merchPotential,
        companionArticlePotential: idea.companionArticlePotential,
        socialClipPotential: idea.socialClipPotential,
        hooks: idea.hooks || null,
        scores: idea.scores,
        aiReasoning: idea.aiReasoning,
        script: script || '', // Include generated script if available
        status: 'planning',
        createdAt: serverTimestamp(),
        creatorId: user.uid,
        userId: user.uid
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Failed to save campaign:', err);
      setSaveError(err.message || 'Failed to save campaign to planner database.');
    } finally {
      setIsSaving(false);
    }
  };

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
              onClick={() => navigate('/admin/youtube-seo')}
              className="px-3 py-1.5 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              YouTube SEO Optimizer
            </button>
            <button
              className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 select-none"
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
        
        {/* Left Side: Topic Sources */}
        <aside className="w-full lg:w-80 border-r border-outline-variant/20 bg-surface-container-low flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-outline-variant/20 font-mono text-[10px] uppercase tracking-wider text-primary flex items-center gap-2">
            <Compass size={14} />
            Topic intelligence sources
          </div>
          
          <div className="p-4 space-y-4">
            {/* Category selection */}
            <div className="space-y-2">
              <label className="block font-mono text-[9px] uppercase tracking-wider text-on-surface-variant">Select Niche Focus</label>
              <div className="space-y-1.5">
                {PRESET_TOPICS.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => {
                      setSelectedTopicId(topic.id);
                      setCustomTopic('');
                    }}
                    className={`w-full text-left p-3 border font-mono transition-all cursor-pointer ${
                      selectedTopicId === topic.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-outline-variant/10 bg-[#090f10]/30 text-on-surface hover:border-outline-variant/40'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase">{topic.name}</div>
                    <div className="text-[8px] text-on-surface-variant mt-1 leading-normal italic font-sans">{topic.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom search query addition */}
            <div className="pt-2">
              <label className="block font-mono text-[9px] uppercase tracking-wider text-on-surface-variant mb-2">Custom Opportunity Keywords (Optional)</label>
              <textarea
                rows={3}
                className="w-full bg-[#090f10] border border-outline/30 focus:border-primary p-3 text-xs font-mono focus:outline-none text-[#dee4e3] resize-none"
                value={customTopic}
                onChange={(e) => {
                  setCustomTopic(e.target.value);
                  setSelectedTopicId('custom');
                }}
                placeholder="e.g. skin tones grading, BMCC 6K L-mount, Detroit commercial shoot..."
              />
            </div>

            {error && (
              <div className="bg-[#93000a]/20 border border-[#93000a]/50 p-4 flex gap-3 text-xs font-mono text-[#ffdad6]">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3.5 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-[#003737] font-mono text-label-sm uppercase tracking-wider font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin text-[#003737]" size={14} /> Scanning Trends...
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Scan Topic Opportunities
                </>
              )}
            </button>

            {/* Reddit Community Pulse */}
            <div className="pt-6 mt-6 border-t border-outline-variant/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-wider text-primary">Reddit Community Pulse</span>
                <span className="bg-primary/10 text-primary border border-primary/20 px-1 py-0.5 text-[7.5px] font-mono uppercase">Inspiration Feed</span>
              </div>
              
              {/* Subreddit selector pills */}
              <div className="flex flex-wrap gap-1 bg-[#090f10] p-1 border border-outline-variant/15">
                {Object.keys(REDDIT_THREADS).map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setActiveRedditSub(sub)}
                    className={`px-2 py-1 font-mono text-[8px] cursor-pointer transition-all ${
                      activeRedditSub === sub
                        ? 'bg-primary text-[#003737] font-semibold'
                        : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    {sub.replace('r/', '')}
                  </button>
                ))}
              </div>

              {/* Thread list */}
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {REDDIT_THREADS[activeRedditSub]?.map((thread, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCustomTopic(thread.title);
                      setSelectedTopicId('custom');
                    }}
                    className="w-full text-left p-2.5 border border-outline-variant/10 bg-[#090f10]/20 hover:border-primary/30 transition-all font-mono text-[9px] group space-y-1 block cursor-pointer"
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-secondary group-hover:text-primary font-bold line-clamp-1 lowercase font-mono">
                        {activeRedditSub}/{thread.title}
                      </span>
                      <span className="text-[7.5px] text-on-surface-variant/50 shrink-0">▲ {thread.score}</span>
                    </div>
                    <p className="font-sans text-[8.5px] text-on-surface-variant normal-case leading-relaxed line-clamp-2">
                      {thread.description}
                    </p>
                    <div className="text-[7.5px] text-primary/70 group-hover:text-primary pt-1 flex items-center gap-1 font-mono uppercase tracking-wider">
                      <span>⚡ Prefill scan topic</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Center Panel: Idea Generator list */}
        <main className="flex-grow lg:w-1/2 border-r border-outline-variant/20 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center gap-2 font-mono text-[11px] text-primary uppercase tracking-widest">
            <Lightbulb size={14} />
            <span>Opportunity Recommendations</span>
          </div>

          {!report && !isGenerating && (
            <div className="h-[400px] border border-dashed border-outline-variant/30 flex flex-col items-center justify-center text-center p-6 bg-surface-container/20">
              <Compass className="text-on-surface-variant/40 mb-4" size={36} />
              <h3 className="font-display text-headline-md uppercase text-on-surface-variant mb-2">Opportunities Engine Standby</h3>
              <p className="font-body text-sm text-on-surface-variant/60 max-w-sm leading-relaxed">
                Choose a niche category or input custom trend phrases in the left sidebar, then run the opportunities scan.
              </p>
            </div>
          )}

          {isGenerating && (
            <div className="h-[400px] border border-dashed border-primary/20 flex flex-col items-center justify-center text-center p-6 bg-primary/[0.02] animate-pulse">
              <Loader2 className="animate-spin text-primary mb-4" size={36} />
              <h3 className="font-display text-headline-md uppercase text-primary mb-2">Analyzing Opportunity Grid...</h3>
              <p className="font-body text-sm text-on-surface-variant/60 max-w-sm leading-relaxed font-mono text-[11px]">
                Google Trends, Search Volumes, competitor gaps, and My Cine Toolbox catalog weights are being parsed by Gemini...
              </p>
            </div>
          )}

          {report && !isGenerating && (
            <div className="space-y-4">
              <div className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider pb-2 border-b border-outline-variant/25">
                Target Niche: <span className="text-[#dee4e3] font-semibold">{report.niche || 'Cinematography & Color Emulation'}</span> ({report.opportunities.length} concepts found)
              </div>

              <div className="space-y-4">
                {report.opportunities.map((idea, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedIdea(idea)}
                    className={`p-4 border transition-colors cursor-pointer relative flex flex-col justify-between ${
                      selectedIdea?.title === idea.title
                        ? 'border-primary bg-primary/[0.02]'
                        : 'border-outline-variant/20 bg-surface-container/30 hover:border-primary/40'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-4">
                        <span className="font-mono text-[9px] text-secondary uppercase tracking-widest">{idea.videoType}</span>
                        <div className="flex items-center gap-1.5 font-mono text-[8px] uppercase">
                          <span className={`px-1.5 py-0.5 border ${
                            idea.trendDirection === 'Rising'
                              ? 'bg-[#4adada]/10 border-[#4adada]/20 text-[#4adada]'
                              : idea.trendDirection === 'Seasonal'
                                ? 'bg-secondary/10 border-secondary/20 text-secondary'
                                : 'bg-on-surface-variant/10 border-outline-variant/20 text-on-surface-variant'
                          }`}>
                            Trend: {idea.trendDirection}
                          </span>
                          <span className={`px-1.5 py-0.5 border ${
                            idea.competitionLevel === 'Low'
                              ? 'bg-[#4adada]/10 border-[#4adada]/20 text-[#4adada]'
                              : idea.competitionLevel === 'Medium'
                                ? 'bg-warning/10 border-warning/20 text-warning'
                                : 'bg-error/10 border-error/20 text-error'
                          }`}>
                            Comp: {idea.competitionLevel}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-mono text-[12px] font-bold text-[#dee4e3] uppercase tracking-wide line-clamp-2 leading-relaxed">
                        {idea.title}
                      </h4>
                      <p className="font-sans text-[10px] text-on-surface-variant/80 line-clamp-2 leading-relaxed">
                        {idea.aiReasoning}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-outline-variant/10">
                      <div className="flex items-center gap-1.5 font-mono text-[9px]">
                        <span className="text-on-surface-variant uppercase">Keyword:</span>
                        <span className="text-primary font-semibold select-all">"{idea.keyword}"</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBuildCampaign(idea);
                          }}
                          className="px-2.5 py-1.5 bg-[#4adada] hover:bg-[#4adada]/90 text-[#003737] font-mono text-[8px] uppercase tracking-wide font-semibold cursor-pointer transition-colors inline-flex items-center gap-1"
                        >
                          <Layers size={10} /> Build Campaign
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Right Side: Detailed Opportunity Scorecard */}
        <section className="w-full lg:w-1/2 overflow-y-auto p-6 bg-surface-container-lowest">
          <div className="flex items-center gap-2 font-mono text-[11px] text-primary uppercase tracking-widest mb-6">
            <Award size={14} />
            <span>Opportunity scorecard</span>
          </div>

          {!selectedIdea && (
            <div className="h-[400px] border border-dashed border-outline-variant/30 flex flex-col items-center justify-center text-center p-6 bg-[#090f10]/10">
              <Gauge className="text-on-surface-variant/30 mb-4" size={36} />
              <h3 className="font-display text-headline-md uppercase text-on-surface-variant mb-2">Metrics Standby</h3>
              <p className="font-body text-sm text-on-surface-variant/60 max-w-xs leading-relaxed">
                Select a recommended concept in the center grid to display its opportunity scorecard breakdown.
              </p>
            </div>
          )}

          {selectedIdea && (
            <div className="space-y-6">
              
              {/* Overall Score Dial */}
              <div className="bg-surface-container p-6 border border-outline-variant/30 flex items-center justify-between">
                <div>
                  <h4 className="font-mono text-[10px] uppercase text-on-surface-variant tracking-wider">Overall Opportunity Score</h4>
                  <span className="font-display text-headline-xl text-primary block mt-2">
                    {selectedIdea.scores.overallScore} 
                    <span className="text-sm font-mono text-on-surface-variant"> / 100</span>
                  </span>
                </div>
                <div className="w-16 h-16 rounded-none border-2 border-primary/20 flex flex-col items-center justify-center bg-primary/5 select-none shrink-0">
                  <span className="font-mono text-[10px] text-primary uppercase tracking-widest font-semibold">GRADE</span>
                  <span className="font-display text-headline-md text-primary mt-0.5">
                    {selectedIdea.scores.overallScore >= 90 ? 'S' : selectedIdea.scores.overallScore >= 80 ? 'A' : selectedIdea.scores.overallScore >= 70 ? 'B' : 'C'}
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
                    <span className="font-bold text-[#dee4e3]">{selectedIdea.scores.trendScore}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container border border-outline-variant/10">
                    <div className="h-full bg-secondary" style={{ width: `${selectedIdea.scores.trendScore}%` }}></div>
                  </div>
                </div>

                {/* Search Intent */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Search intent match</span>
                    <span className="font-bold text-[#dee4e3]">{selectedIdea.scores.searchIntentScore}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container border border-outline-variant/10">
                    <div className="h-full bg-secondary" style={{ width: `${selectedIdea.scores.searchIntentScore}%` }}></div>
                  </div>
                </div>

                {/* Competition Gap */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Competition opportunity gap</span>
                    <span className="font-bold text-[#dee4e3]">{selectedIdea.scores.competitionGapScore}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container border border-outline-variant/10">
                    <div className="h-full bg-primary" style={{ width: `${selectedIdea.scores.competitionGapScore}%` }}></div>
                  </div>
                </div>

                {/* Channel Fit */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Channel Profile relevance</span>
                    <span className="font-bold text-[#dee4e3]">{selectedIdea.scores.channelFitScore}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container border border-outline-variant/10">
                    <div className="h-full bg-primary" style={{ width: `${selectedIdea.scores.channelFitScore}%` }}></div>
                  </div>
                </div>

                {/* Affiliate Potential */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Affiliate matching revenue</span>
                    <span className="font-bold text-[#dee4e3]">{selectedIdea.scores.affiliatePotentialScore}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container border border-outline-variant/10">
                    <div className="h-full bg-primary" style={{ width: `${selectedIdea.scores.affiliatePotentialScore}%` }}></div>
                  </div>
                </div>

                {/* Merch Potential */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Merch integration matching</span>
                    <span className="font-bold text-[#dee4e3]">{selectedIdea.scores.merchPotentialScore}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container border border-outline-variant/10">
                    <div className="h-full bg-[#ffb68b]" style={{ width: `${selectedIdea.scores.merchPotentialScore}%` }}></div>
                  </div>
                </div>

                {/* Production Difficulty */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Production feasibility (100 = easiest)</span>
                    <span className="font-bold text-[#dee4e3]">{selectedIdea.scores.productionDifficultyScore}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container border border-outline-variant/10">
                    <div className="h-full bg-[#ffb68b]" style={{ width: `${selectedIdea.scores.productionDifficultyScore}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Analysis & Outlines */}
              <div className="space-y-4">
                
                {/* Search Intent Detail */}
                <div className="space-y-2">
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-primary border-b border-outline-variant/25 pb-1">Viewer Search Intent</span>
                  <div className="bg-[#090f10] border border-outline-variant/20 p-3.5 font-sans text-[11px] text-[#dee4e3] leading-relaxed italic">
                    "{selectedIdea.intent}"
                  </div>
                </div>

                {/* High-Retention Hook Strategy */}
                {selectedIdea.hooks && (
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
                            onClick={() => handleCopyText(selectedIdea.hooks.curiosity, 'hook-curiosity')}
                            className="text-primary hover:text-primary-light flex items-center gap-1 font-mono text-[8px] cursor-pointer"
                          >
                            {copiedField === 'hook-curiosity' ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <div className="bg-[#090f10] p-2 border border-outline-variant/15 font-sans text-[10.5px] text-[#dee4e3] normal-case leading-relaxed select-all">
                          {selectedIdea.hooks.curiosity}
                        </div>
                      </div>

                      {/* Pain-Point Hook */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[#ffb68b]/80 block text-[8px] tracking-wider font-semibold">2. Pain-Point Hook</span>
                          <button
                            onClick={() => handleCopyText(selectedIdea.hooks.painPoint, 'hook-painpoint')}
                            className="text-primary hover:text-primary-light flex items-center gap-1 font-mono text-[8px] cursor-pointer"
                          >
                            {copiedField === 'hook-painpoint' ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <div className="bg-[#090f10] p-2 border border-outline-variant/15 font-sans text-[10.5px] text-[#dee4e3] normal-case leading-relaxed select-all">
                          {selectedIdea.hooks.painPoint}
                        </div>
                      </div>

                      {/* Visual-Action Hook */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[#ffb68b]/80 block text-[8px] tracking-wider font-semibold">3. Visual-Action Hook</span>
                          <button
                            onClick={() => handleCopyText(selectedIdea.hooks.visualAction, 'hook-visual')}
                            className="text-primary hover:text-primary-light flex items-center gap-1 font-mono text-[8px] cursor-pointer"
                          >
                            {copiedField === 'hook-visual' ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <div className="bg-[#090f10] p-2 border border-outline-variant/15 font-sans text-[10.5px] text-[#dee4e3] normal-case leading-relaxed select-all italic">
                          {selectedIdea.hooks.visualAction}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Video Outline / Script Checklist */}
                <div className="space-y-2">
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-primary border-b border-outline-variant/25 pb-1">Outline talking points</span>
                  <div className="bg-[#090f10] border border-outline-variant/20 p-4 font-mono text-[10px] space-y-2 leading-relaxed">
                    {selectedIdea.outline.map((pt, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-secondary select-none font-bold">0{idx + 1}.</span>
                        <span className="text-[#dee4e3] select-all">{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Script Generator Section */}
                <div className="space-y-2.5">
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-primary border-b border-outline-variant/25 pb-1 flex items-center justify-between">
                    <span>AI Video Script</span>
                    {script && (
                      <button
                        onClick={() => handleCopyText(script, 'video-script')}
                        className="text-on-surface-variant hover:text-primary flex items-center gap-1 font-mono text-[8px] uppercase cursor-pointer"
                      >
                        {copiedField === 'video-script' ? <Check size={8} className="text-primary" /> : <Copy size={8} />} Copy Script
                      </button>
                    )}
                  </span>
                  
                  {script ? (
                    <div className="bg-[#090f10] border border-outline-variant/20 p-4 font-mono text-[10px] whitespace-pre-wrap select-all max-h-60 overflow-y-auto leading-relaxed text-[#dee4e3]">
                      {script}
                    </div>
                  ) : (
                    <div className="bg-[#090f10]/30 border border-outline-variant/20 p-4 flex flex-col items-center justify-center text-center space-y-3">
                      <p className="font-sans text-[10px] text-on-surface-variant/80 max-w-xs leading-normal">
                        Expand this concept's outline into a ready-to-read talking script with hook, body segments, call-to-actions, and b-roll cues.
                      </p>
                      {scriptError && (
                        <div className="font-mono text-[9px] text-[#ffdad6] bg-[#93000a]/10 border border-[#93000a]/35 px-3 py-1.5 w-full">
                          {scriptError}
                        </div>
                      )}
                      <button
                        onClick={handleGenerateScript}
                        disabled={isGeneratingScript}
                        className="px-4 py-2 bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-[#003737] font-mono text-[9px] uppercase tracking-wider font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
                      >
                        {isGeneratingScript ? (
                          <>
                            <Loader2 className="animate-spin text-[#003737]" size={10} /> Generating Script...
                          </>
                        ) : (
                          <>
                            <Sparkles size={10} /> Generate Video Script
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Thumbnail Visual Concept */}
                <div className="space-y-2">
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-primary border-b border-outline-variant/25 pb-1">Visual Thumbnail Strategy</span>
                  <div className="bg-[#090f10] border border-outline-variant/20 p-4 font-sans text-[11px] text-[#dee4e3] leading-relaxed">
                    {selectedIdea.thumbnailConcept}
                  </div>
                </div>

                {/* Monitization Channels details */}
                <div className="space-y-2">
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-primary border-b border-outline-variant/25 pb-1">Monetization & Channel Synergy</span>
                  <div className="bg-[#090f10] border border-outline-variant/20 p-4 font-mono text-[9px] space-y-3 uppercase leading-relaxed text-on-surface-variant">
                    <div>
                      <span className="text-secondary font-bold">Affiliates:</span>{" "}
                      <span className="text-on-surface normal-case font-sans text-[10px]">{selectedIdea.affiliatePotential}</span>
                    </div>
                    <div>
                      <span className="text-secondary font-bold">Merch Apparel:</span>{" "}
                      <span className="text-on-surface normal-case font-sans text-[10px]">{selectedIdea.merchPotential}</span>
                    </div>
                    <div>
                      <span className="text-[#ffb68b] font-bold">Blog Article Angle:</span>{" "}
                      <span className="text-on-surface normal-case font-sans text-[10px]">{selectedIdea.companionArticlePotential}</span>
                    </div>
                    <div>
                      <span className="text-[#ffb68b] font-bold">Short-Form Clip:</span>{" "}
                      <span className="text-on-surface normal-case font-sans text-[10px]">{selectedIdea.socialClipPotential}</span>
                    </div>
                  </div>
                </div>

                {/* Campaign Action Buttons */}
                <div className="space-y-3 pt-4 border-t border-outline-variant/10">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleSaveCampaign(selectedIdea)}
                      disabled={isSaving}
                      className="flex-grow py-3 border border-outline/30 hover:border-primary text-on-surface-variant hover:text-primary font-mono text-label-sm uppercase tracking-wider font-semibold cursor-pointer transition-colors flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="animate-spin" size={14} /> Saving...
                        </>
                      ) : (
                        <>
                          <PlusCircle size={14} /> Save to Planner
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleBuildCampaign(selectedIdea)}
                      className="flex-grow py-3 bg-[#4adada] hover:bg-[#4adada]/90 text-[#003737] font-mono text-label-sm uppercase tracking-wider font-bold cursor-pointer transition-colors flex items-center justify-center gap-2"
                    >
                      <Layers size={14} /> Build Campaign
                    </button>
                  </div>
                  
                  {saveSuccess && (
                    <div className="bg-[#4adada]/20 border border-[#4adada]/50 p-3 text-center text-xs font-mono text-[#4adada] uppercase tracking-wider">
                      ✓ Saved to campaigns planner database!
                    </div>
                  )}
                  {saveError && (
                    <div className="bg-[#93000a]/20 border border-[#93000a]/50 p-3 text-center text-xs font-mono text-[#ffdad6]">
                      ⚠️ {saveError}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </section>

      </div>
    </div>
  );
}
