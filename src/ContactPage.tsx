import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  Youtube,
  Instagram,
  Facebook,
  MapPin,
  Clock,
  ChevronRight,
  Camera,
  Film,
  Monitor,
  Aperture,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import SiteNav from './SiteNav';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

type ProjectType =
  | ''
  | 'Commercial'
  | 'Narrative Film'
  | 'Documentary'
  | 'Music Video'
  | 'Corporate / Brand'
  | 'Other';

const PROJECT_TYPES: ProjectType[] = [
  'Commercial',
  'Narrative Film',
  'Documentary',
  'Music Video',
  'Corporate / Brand',
  'Other',
];

const SERVICES = [
  {
    icon: Camera,
    label: 'Cinematography',
    desc: 'Director of Photography for narrative, commercial, and documentary projects.',
  },
  {
    icon: Monitor,
    label: 'Color Grading',
    desc: 'DaVinci Resolve color grading, LUT design, and film-look development.',
  },
  {
    icon: Film,
    label: 'Gear Consulting',
    desc: 'Camera, lens, and workflow consulting for indie filmmakers and studios.',
  },
  {
    icon: Aperture,
    label: 'Workshops',
    desc: 'In-person and online workshops covering cinematography and post workflow.',
  },
];

export default function ContactPage() {
  const [projectType, setProjectType] = useState<ProjectType>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [timeline, setTimeline] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message || !projectType) return;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      await addDoc(collection(db, 'inquiries'), {
        name,
        email,
        projectType,
        timeline,
        message,
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err: any) {
      console.error('Failed to submit contact brief to Firestore:', err);
      setSubmitError(err.message || 'Failed to submit proposal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body">
      <div className="film-grain" />
      <SiteNav />

      {/* ── HERO ── */}
      <section className="relative h-[55vh] min-h-[400px] flex items-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/contact-hero.png?v=2"
            alt="Aaron Stowers on location in Detroit"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1415] via-[#0f1415]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1415]/60 to-transparent" />
        </div>
        <div className="relative z-10 px-6 md:px-16 pb-14 max-w-7xl mx-auto w-full">
          <p className="font-mono text-label-sm text-primary tracking-[0.3em] uppercase mb-3">
            My Cine Toolbox
          </p>
          <h1 className="font-display text-[64px] md:text-[96px] text-on-surface uppercase leading-none">
            Let's <span className="text-primary">Work</span>
          </h1>
          <p className="font-mono text-label-md text-on-surface-variant uppercase tracking-widest mt-2">
            Detroit, Michigan — Available Worldwide
          </p>
        </div>
      </section>

      {/* ── AVAILABILITY STRIP ── */}
      <div className="bg-primary/10 border-y border-primary/20 px-6 md:px-16 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-label-sm text-primary uppercase tracking-widest">
              Currently Available — Q3 2026
            </span>
          </div>
          <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
            Response time: within 24 hours
          </span>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <section className="px-6 md:px-16 max-w-7xl mx-auto py-20">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">

          {/* ── LEFT: Info Panel (2/5) ── */}
          <div className="lg:col-span-2 flex flex-col gap-10">

            {/* About the contact */}
            <div>
              <h2 className="font-display text-headline-lg uppercase mb-4">
                Start a Conversation
              </h2>
              <p className="font-body text-body-lg text-on-surface-variant leading-relaxed">
                Whether you're planning a commercial shoot, a short film, or need a color grade for a project already in the can — tell me what you're working on and I'll get back to you within 24 hours.
              </p>
            </div>

            <div className="teal-divider" />

            {/* Contact details */}
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <MapPin size={16} className="text-primary mt-1 shrink-0" />
                <div>
                  <p className="font-mono text-label-sm text-on-surface uppercase">Location</p>
                  <p className="font-body text-body-md text-on-surface-variant mt-1">
                    Detroit, Michigan — Available for travel worldwide
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Clock size={16} className="text-primary mt-1 shrink-0" />
                <div>
                  <p className="font-mono text-label-sm text-on-surface uppercase">Availability</p>
                  <p className="font-body text-body-md text-on-surface-variant mt-1">
                    Currently booking for Q3 – Q4 2026 projects
                  </p>
                </div>
              </div>
            </div>

            <div className="teal-divider" />

            {/* Social links */}
            <div>
              <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-widest mb-5">
                Follow the Work
              </p>
              <div className="flex flex-col gap-3">
                <a
                  href="https://www.youtube.com/@mycinetoolbox1979"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 bg-surface-container border border-outline-variant/30 hover:border-primary/50 px-5 py-4 transition-all hover-glow"
                >
                  <Youtube size={18} className="text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-label-sm text-on-surface uppercase">YouTube</p>
                    <p className="font-body text-[11px] text-on-surface-variant">@mycinetoolbox1979</p>
                  </div>
                  <ChevronRight size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=100063927638487"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 bg-surface-container border border-outline-variant/30 hover:border-primary/50 px-5 py-4 transition-all hover-glow"
                >
                  <Facebook size={18} className="text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-label-sm text-on-surface uppercase">Facebook</p>
                    <p className="font-body text-[11px] text-on-surface-variant">My Cine Toolbox</p>
                  </div>
                  <ChevronRight size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
            </div>

            <div className="teal-divider" />

            {/* Quote */}
            <blockquote className="border-l-2 border-primary pl-5">
              <p className="font-mono text-label-md text-on-surface leading-relaxed italic">
                "The best gear in the world means nothing without a clear vision and a clean workflow. Let's build both."
              </p>
              <cite className="font-mono text-[10px] text-primary uppercase tracking-widest mt-3 block not-italic">
                — Aaron Stowers
              </cite>
            </blockquote>
          </div>

          {/* ── RIGHT: Contact Form (3/5) ── */}
          <div className="lg:col-span-3">
            {submitted ? (
              /* Success State */
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center bg-surface-container border border-primary/20 p-12">
                <div className="w-16 h-16 border-2 border-primary flex items-center justify-center mb-8">
                  <span className="text-primary text-2xl font-mono">✓</span>
                </div>
                <h3 className="font-display text-display-lg uppercase text-on-surface mb-4">
                  Message Sent
                </h3>
                <p className="font-body text-body-lg text-on-surface-variant mb-2 leading-relaxed max-w-sm">
                  Thanks for reaching out, {name.split(' ')[0]}. I'll review your project details and get back to you within 24 hours.
                </p>
                <p className="font-mono text-label-sm text-primary uppercase tracking-widest mt-6">
                  — Aaron Stowers
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setName(''); setEmail(''); setMessage('');
                    setProjectType(''); setTimeline('');
                  }}
                  className="mt-10 font-mono text-label-sm text-on-surface-variant border border-outline-variant/40 px-6 py-3 uppercase hover:border-primary hover:text-primary transition-all cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="bg-surface-container border border-outline-variant/30 p-8 md:p-10">
                <h3 className="font-display text-headline-lg uppercase mb-8 text-primary">
                  Project Brief
                </h3>

                {/* Project Type Grid */}
                <div className="mb-8">
                  <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest block mb-3">
                    Project Type <span className="text-primary">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PROJECT_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setProjectType(type)}
                        className={`py-3 px-3 font-mono text-[10px] uppercase tracking-wider border transition-all cursor-pointer text-center ${
                          projectType === type
                            ? 'bg-primary text-[#003737] border-primary font-bold'
                            : 'border-outline-variant/40 text-on-surface-variant hover:border-primary hover:text-primary'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name + Email */}
                <div className="grid sm:grid-cols-2 gap-6 mb-6">
                  <div className="relative">
                    <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest block mb-2">
                      Name <span className="text-primary">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onFocus={() => setFocused('name')}
                      onBlur={() => setFocused('')}
                      placeholder="Your full name"
                      className={`w-full bg-transparent border-b py-3 font-mono text-label-md text-on-surface placeholder:text-outline/50 focus:outline-none transition-colors uppercase ${
                        focused === 'name' ? 'border-primary' : 'border-outline-variant/40'
                      }`}
                    />
                  </div>
                  <div className="relative">
                    <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest block mb-2">
                      Email <span className="text-primary">*</span>
                    </label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused('')}
                      placeholder="your@email.com"
                      className={`w-full bg-transparent border-b py-3 font-mono text-label-md text-on-surface placeholder:text-outline/50 focus:outline-none transition-colors uppercase ${
                        focused === 'email' ? 'border-primary' : 'border-outline-variant/40'
                      }`}
                    />
                  </div>
                </div>

                {/* Timeline */}
                <div className="mb-6">
                  <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest block mb-2">
                    Project Timeline
                  </label>
                  <input
                    type="text"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    onFocus={() => setFocused('timeline')}
                    onBlur={() => setFocused('')}
                    placeholder="e.g. August 2026 — 3 day shoot"
                    className={`w-full bg-transparent border-b py-3 font-mono text-label-md text-on-surface placeholder:text-outline/50 focus:outline-none transition-colors uppercase ${
                      focused === 'timeline' ? 'border-primary' : 'border-outline-variant/40'
                    }`}
                  />
                </div>

                {/* Message */}
                <div className="mb-8">
                  <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest block mb-2">
                    Project Details <span className="text-primary">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onFocus={() => setFocused('message')}
                    onBlur={() => setFocused('')}
                    placeholder="Tell me about your project — location, vision, deliverables, anything useful..."
                    className={`w-full bg-transparent border-b py-3 font-mono text-label-md text-on-surface placeholder:text-outline/50 focus:outline-none transition-colors resize-none uppercase ${
                      focused === 'message' ? 'border-primary' : 'border-outline-variant/40'
                    }`}
                  />
                </div>

                {/* Error Banner */}
                {submitError && (
                  <div className="mb-6 bg-[#93000a]/20 border border-[#93000a]/50 p-4 flex gap-3 text-sm font-mono text-[#ffdad6]">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!name || !email || !message || !projectType || isSubmitting}
                  className="w-full bg-primary text-[#003737] py-5 font-display text-headline-md tracking-widest uppercase hover:bg-primary-container transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-bold"
                >
                  {isSubmitting ? (
                    <>
                      Sending Proposal <Loader2 size={16} className="animate-spin" />
                    </>
                  ) : (
                    <>
                      Send Project Brief <Send size={16} />
                    </>
                  )}
                </button>

                <p className="font-mono text-[10px] text-outline uppercase text-center mt-4 tracking-wider">
                  No spam. No cold pitches. Strictly project inquiries.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── SERVICES GRID ── */}
      <section className="bg-surface-container-lowest border-t border-[#3c4949]/30 py-20 px-6 md:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <p className="font-mono text-label-sm text-primary tracking-[0.3em] uppercase mb-3">
              What I Do
            </p>
            <h2 className="font-display text-display-lg uppercase leading-none">
              Available <span className="text-primary">For</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SERVICES.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="bg-surface-container border border-outline-variant/30 hover:border-primary/40 p-6 transition-all hover-glow group"
              >
                <div className="w-10 h-10 bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5 group-hover:bg-primary/20 transition-colors">
                  <Icon size={20} />
                </div>
                <h4 className="font-display text-headline-md uppercase mb-2 group-hover:text-primary transition-colors">
                  {label}
                </h4>
                <p className="font-body text-body-sm text-on-surface-variant text-sm leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROCESS STRIP ── */}
      <section className="py-20 px-6 md:px-16 max-w-7xl mx-auto">
        <p className="font-mono text-label-sm text-primary tracking-[0.3em] uppercase mb-3 text-center">
          How It Works
        </p>
        <h2 className="font-display text-headline-lg uppercase text-center mb-12">
          From Brief to Final Delivery
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 relative">
          {/* connector line desktop */}
          <div className="hidden md:block absolute top-8 left-[16.6%] right-[16.6%] h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
          {[
            { step: '01', title: 'Send the Brief', desc: 'Fill out the form above with your project type, timeline, and vision. The more detail the better.' },
            { step: '02', title: 'Discovery Call', desc: 'We jump on a 20-minute call to align on creative direction, logistics, and deliverables.' },
            { step: '03', title: 'We Build It', desc: 'Pre-production, principal photography, post — a clean workflow from first frame to final export.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex flex-col items-center text-center px-6 py-8 relative">
              <div className="w-16 h-16 border-2 border-primary bg-background flex items-center justify-center mb-5 relative z-10">
                <span className="font-display text-headline-md text-primary">{step}</span>
              </div>
              <h4 className="font-display text-headline-md uppercase mb-3">{title}</h4>
              <p className="font-body text-body-md text-on-surface-variant text-sm leading-relaxed max-w-xs">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-8 px-6 md:px-16 border-t border-[#3c4949]/20 bg-[#090f10]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <Link to="/" className="font-display text-headline-sm text-on-surface uppercase">
            My Cine Toolbox
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/faq" className="font-mono text-[10px] text-on-surface-variant hover:text-primary transition-colors uppercase">
              FAQ
            </Link>
            <Link to="/privacy" className="font-mono text-[10px] text-on-surface-variant hover:text-primary transition-colors uppercase">
              Privacy Policy
            </Link>
            <p className="font-mono text-[10px] text-outline uppercase tracking-tighter">
              © 2026 Aaron Stowers Cinematography. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
