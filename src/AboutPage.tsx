import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Youtube, Mail, Camera, Film, Monitor, Compass, Shield } from 'lucide-react';
import SiteNav from './SiteNav';

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-surface font-body relative">
      <div className="film-grain" />
      <SiteNav />

      {/* ── HERO ── */}
      <section className="relative w-full aspect-video md:h-[70vh] flex items-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/contact-hero.png?v=2"
            alt="Aaron Stowers on set"
            className="w-full h-full object-cover object-top opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1415] via-[#0f1415]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1415]/50 to-transparent" />
        </div>
        <div className="relative z-10 px-6 md:px-16 pb-14 max-w-7xl mx-auto w-full">
          <p className="font-mono text-label-sm text-primary tracking-[0.3em] uppercase mb-3">
            The Craft &amp; Mission
          </p>
          <h1 className="font-display text-[64px] md:text-[96px] text-on-surface uppercase leading-none">
            About <span className="text-primary">Aaron</span>
          </h1>
          <p className="font-mono text-label-md text-on-surface-variant uppercase tracking-widest mt-2">
            Detroit, Michigan — Cinematographer &amp; Workflow Specialist
          </p>
        </div>
      </section>

      {/* ── Teal Divider ── */}
      <div className="teal-divider" />

      {/* ── MAIN SPLIT CONTENT ── */}
      <section className="px-6 md:px-16 max-w-7xl mx-auto py-20">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-start">
          
          {/* ── LEFT COLUMN: Portrait (2/5) ── */}
          <div className="lg:col-span-2 space-y-8">
            <div className="relative group">
              {/* Backlit glow effect behind the portrait */}
              <div className="absolute -inset-1 bg-primary/20 rounded-none blur-xl opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
              
              {/* Corner accent */}
              <div className="absolute -top-4 -left-4 w-16 h-16 border-t-2 border-l-2 border-primary z-20 pointer-events-none" />
              
              {/* Image Frame */}
              <div className="relative border-2 border-primary overflow-hidden z-10 shadow-[0_0_30px_rgba(74,218,218,0.15)] bg-surface-container-low">
                <img
                  src="/aaron-portrait.jpg"
                  alt="Aaron Stowers portrait"
                  className="w-full object-cover aspect-[4/5] opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                />
              </div>
            </div>

            {/* Quick Stats Box */}
            <div className="bg-surface-container border border-outline-variant/30 p-6 space-y-4">
              <h3 className="font-mono text-label-md text-primary uppercase tracking-widest border-b border-outline-variant/20 pb-2">Technical Specs</h3>
              <div className="grid grid-cols-2 gap-4 font-mono text-[11px] text-on-surface-variant uppercase">
                <div>
                  <span className="text-outline block mb-1">Base</span>
                  <span>Detroit, MI</span>
                </div>
                <div>
                  <span className="text-outline block mb-1">Role</span>
                  <span>DP &amp; Workflow Spec</span>
                </div>
                <div>
                  <span className="text-outline block mb-1">Primary Tools</span>
                  <span>Resolve, RED, ARRI</span>
                </div>
                <div>
                  <span className="text-outline block mb-1">Availability</span>
                  <span>Worldwide Projects</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Bio / Copy (3/5) ── */}
          <div className="lg:col-span-3 space-y-8">
            <div className="space-y-6">
              <h2 className="font-display text-display-md text-on-surface uppercase leading-none">
                Bridging Tech Spec &amp; <span className="text-primary">Artistic Output</span>
              </h2>
              <div className="h-px bg-gradient-to-r from-primary to-transparent w-32" />
            </div>

            <div className="prose-cine space-y-6">
              <p>
                Based in the industrial heart of Detroit, I am a cinematographer, post-production consultant, and technical workflow specialist dedicated to the craft of visual storytelling. Through my platform, <strong>My Cine Toolbox</strong>, I help filmmakers bridge the gap between complex camera metrics and emotional cinematic results.
              </p>
              <p>
                My journey began on active indie film sets and commercial shoots, where I quickly realized that technical intimidation often gets in the way of creative expression. Whether it's dialing in the correct color space transform, choosing the right lens set, or building a color-grading pipeline, I believe filmmakers should master their gear so they can focus entirely on the art of the story.
              </p>
              <p>
                In addition to active director of photography (DP) duties on commercial and narrative projects, I specialize in DaVinci Resolve color workflows, custom LUT engineering, and camera package consulting for production houses and indie filmmakers globally.
              </p>
            </div>

            {/* Backlit Blockquote Callout */}
            <blockquote className="border-l-4 border-primary bg-primary/[0.03] p-6 font-mono text-sm leading-relaxed text-[#dee4e3] tracking-wide max-w-2xl">
              "Cinematography isn't just about capturing sharp images; it's about engineering a visual pipeline that feeds the narrative's emotional core."
            </blockquote>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 pt-4">
              <a
                href="https://www.youtube.com/@mycinetoolbox1979"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary hover:bg-primary-container text-on-primary font-mono text-label-md uppercase tracking-wider px-6 py-3.5 font-bold transition-all flex items-center gap-2"
              >
                <Youtube size={16} /> Subscribe to channel
              </a>
              <Link
                to="/contact"
                className="border border-outline hover:border-primary text-on-surface font-mono text-label-md uppercase tracking-wider px-6 py-3.5 transition-colors flex items-center gap-2"
              >
                <Mail size={16} /> Start a Project
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ── Footer ── */}
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
