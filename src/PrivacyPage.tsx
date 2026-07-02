import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SiteNav from './SiteNav';

export default function PrivacyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-surface font-body">
      <div className="film-grain" />
      <SiteNav />

      {/* ── HERO ── */}
      <section className="relative h-[45vh] min-h-[320px] flex items-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/contact-hero.png?v=2"
            alt="Cinematic background"
            className="w-full h-full object-cover object-center opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1415] via-[#0f1415]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1415]/60 to-transparent" />
        </div>
        <div className="relative z-10 px-6 md:px-16 pb-12 max-w-7xl mx-auto w-full">
          <p className="font-mono text-label-sm text-primary tracking-[0.3em] uppercase mb-3">
            Legal &amp; Transparency
          </p>
          <h1 className="font-display text-[64px] md:text-[80px] text-on-surface uppercase leading-none">
            Privacy <span className="text-primary">Policy</span>
          </h1>
          <p className="font-mono text-label-md text-on-surface-variant uppercase tracking-widest mt-2">
            Effective Date: June 21, 2026
          </p>
        </div>
      </section>

      {/* ── Teal Divider ── */}
      <div className="teal-divider" />

      {/* ── MAIN CONTENT ── */}
      <section className="px-6 md:px-16 max-w-4xl mx-auto py-16">
        <div className="prose-cine">
          <p>
            At <strong>My Cine Toolbox</strong>, we respect your privacy and are committed to protecting any personal data we collect. This Privacy Policy outlines what information we gather, how we use it, and the security measures we take to ensure your data remains yours.
          </p>

          <h2>1. Data Collection &amp; Transparency</h2>
          <p>
            We collect only the minimum necessary information to provide our services, communicate with you, and improve the site. Specifically:
          </p>
          <ul>
            <li>
              <strong>Mailing List Signup:</strong> If you subscribe to our newsletter, we collect your email address. This is used solely to send you filmmaking tutorials, gear breakdowns, and technical tips.
            </li>
            <li>
              <strong>Project Briefs &amp; Contact Inquiries:</strong> When you fill out the contact form, we collect your name, email address, project type (commercial, narrative, etc.), timeline, and any message or details you provide. This is used to respond to your inquiry and evaluate collaborations.
            </li>
          </ul>

          <h2>2. Zero Third-Party Data Sales</h2>
          <blockquote>
            <strong>Our Sacred Pledge:</strong> We will never sell, trade, rent, or distribute your email address or personal details to any third-party advertisers, data brokers, or marketing networks. Your support of My Cine Toolbox is built on trust, and we keep that trust absolute.
          </blockquote>

          <h2>3. YouTube API &amp; Google Services</h2>
          <p>
            Our site utilizes Google and YouTube API Services to pull public video statistics, content feeds, and metadata. By using these features, you acknowledge and agree to be bound by the YouTube Terms of Service and the Google Privacy Policy.
          </p>
          <p>
            We do not collect or store any personal credentials or non-public user data via YouTube APIs. Any YouTube data fetched is processed on the client side to display our content channel.
          </p>

          <h2>4. Payments &amp; Financial Security</h2>
          <p>
            All financial transactions on our shop are processed securely through our payment provider, <strong>Stripe</strong>. We do not store or have access to your raw credit card numbers or financial passwords. Stripe operates under its own strict security protocols and privacy standards.
          </p>

          <h2>5. Cookies &amp; Tracking</h2>
          <p>
            We run a cookie-free, privacy-focused performance metric system to see which pages are visited without tracking individual user identities. No cross-site tracking cookies are set by us.
          </p>

          <h2>6. Your Rights &amp; Deletion Requests</h2>
          <p>
            You have full sovereignty over your digital footprint. You can opt out of our email newsletters at any time by clicking the "unsubscribe" link at the bottom of any email.
          </p>
          <p>
            If you wish to have your contact details or email subscription permanently deleted from our records, simply send an email request to our management contact below.
          </p>

          <h2>7. Contact Us</h2>
          <p>
            If you have any questions or concerns about this policy, please reach out directly:
          </p>
          <p className="font-mono text-label-md text-primary mt-2">
            Email: <a href="mailto:aaron@mycinetoolbox.com" className="text-primary hover:text-primary-container transition-colors">aaron@mycinetoolbox.com</a>
          </p>
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
