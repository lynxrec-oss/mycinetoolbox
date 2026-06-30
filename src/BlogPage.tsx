import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Clock, Tag } from 'lucide-react';
import SiteNav from './SiteNav';
import { BLOG_POSTS, CATEGORIES, type BlogPost } from './blogData';

function FeaturedCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group block relative w-full overflow-hidden border border-[#3c4949]/30 hover:border-primary/60 transition-all duration-300"
      style={{ minHeight: '420px' }}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-full h-full object-cover opacity-40 group-hover:opacity-55 group-hover:scale-105 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#090f10] via-[#090f10]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090f10] via-transparent to-transparent" />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-12 md:max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-primary text-[#003737] font-mono text-[10px] uppercase tracking-widest px-3 py-1 font-bold">
            Featured
          </span>
          <span className="bg-secondary-container text-white font-mono text-[10px] uppercase tracking-widest px-3 py-1">
            {post.category}
          </span>
        </div>
        <h2 className="font-display text-display-lg md:text-[52px] text-on-surface uppercase leading-none mb-4 group-hover:text-primary transition-colors duration-300">
          {post.title}
        </h2>
        <p className="font-body text-body-lg text-on-surface-variant mb-6 leading-relaxed line-clamp-2">
          {post.excerpt}
        </p>
        <div className="flex items-center gap-6 text-on-surface-variant">
          <span className="font-mono text-label-sm">{post.date}</span>
          <span className="flex items-center gap-1 font-mono text-label-sm">
            <Clock size={12} />
            {post.readTime}
          </span>
          <span className="flex items-center gap-1 font-mono text-label-sm text-primary group-hover:gap-2 transition-all">
            Read Article <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex flex-col bg-surface-container border border-outline-variant/30 hover:border-primary/50 hover-glow transition-all duration-300 overflow-hidden"
    >
      {/* Thumbnail */}
      <div className="aspect-video overflow-hidden relative bg-[#090f10]">
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-secondary-container text-white font-mono text-[9px] uppercase tracking-widest px-2 py-1">
            {post.category}
          </span>
        </div>
      </div>

      {/* Text */}
      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-display text-headline-md uppercase leading-tight mb-3 group-hover:text-primary transition-colors duration-200">
          {post.title}
        </h3>
        <p className="font-body text-body-md text-on-surface-variant text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
          {post.excerpt}
        </p>
        <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20">
          <div className="flex items-center gap-4 text-on-surface-variant">
            <span className="font-mono text-[10px] uppercase">{post.date}</span>
            <span className="flex items-center gap-1 font-mono text-[10px] uppercase">
              <Clock size={10} />
              {post.readTime}
            </span>
          </div>
          <span className="font-mono text-[10px] text-primary uppercase flex items-center gap-1 group-hover:gap-2 transition-all">
            Read <ChevronRight size={10} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered =
    activeCategory === 'All'
      ? BLOG_POSTS
      : BLOG_POSTS.filter((p) => p.category === activeCategory);

  const [featured, ...rest] = filtered;

  return (
    <div className="min-h-screen bg-background text-on-surface font-body">
      <div className="film-grain" />
      <SiteNav />

      {/* ── Hero Bar ── */}
      <section className="pt-32 pb-16 px-6 md:px-16 max-w-7xl mx-auto">
        <p className="font-mono text-label-sm text-primary tracking-[0.3em] uppercase mb-4">
          My Cine Toolbox
        </p>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h1 className="font-display text-[72px] md:text-[96px] text-on-surface uppercase leading-none">
              The <span className="text-primary">Lab</span>
            </h1>
            <p className="font-mono text-label-md text-on-surface-variant mt-2 uppercase tracking-widest">
              Field Notes, Gear Reviews &amp; Tutorials
            </p>
          </div>
          <div className="h-px md:h-auto md:w-px flex-1 md:flex-none bg-gradient-to-r md:bg-gradient-to-b from-transparent via-[#4adada] to-transparent mx-0 md:mx-8 my-4 md:my-0 self-stretch" />
          <div className="md:text-right">
            <p className="font-mono text-label-sm text-on-surface-variant">
              {BLOG_POSTS.length} articles published
            </p>
            <p className="font-mono text-label-sm text-primary mt-1">
              By Aaron Stowers — Detroit
            </p>
          </div>
        </div>
      </section>

      {/* ── Teal Divider ── */}
      <div className="teal-divider mx-6 md:mx-16 mb-12" />

      {/* ── Category Filters ── */}
      <section className="px-6 md:px-16 max-w-7xl mx-auto mb-12">
        <div className="flex flex-wrap gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`font-mono text-label-sm uppercase tracking-widest px-5 py-2.5 border transition-all duration-200 cursor-pointer ${
                activeCategory === cat
                  ? 'bg-primary text-[#003737] border-primary'
                  : 'border-outline-variant/40 text-on-surface-variant hover:border-primary hover:text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ── Featured Post ── */}
      {featured && (
        <section className="px-6 md:px-16 max-w-7xl mx-auto mb-12">
          <FeaturedCard post={featured} />
        </section>
      )}

      {/* ── Post Grid ── */}
      {rest.length > 0 && (
        <section className="px-6 md:px-16 max-w-7xl mx-auto mb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((post) => (
              <div key={post.slug}>
                <PostCard post={post} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <section className="px-6 md:px-16 max-w-7xl mx-auto mb-24 text-center py-24">
          <p className="font-display text-headline-lg text-on-surface-variant uppercase">
            No posts in this category yet.
          </p>
          <button
            onClick={() => setActiveCategory('All')}
            className="mt-6 font-mono text-label-md text-primary border border-primary px-6 py-3 uppercase hover:bg-primary/10 transition-all cursor-pointer"
          >
            View All Posts
          </button>
        </section>
      )}

      {/* ── Newsletter Strip ── */}
      <section className="bg-surface-container-lowest border-t border-[#3c4949]/30 py-16 px-6 md:px-16">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-mono text-label-sm text-primary tracking-[0.3em] uppercase mb-4">
            Stay Sharp
          </p>
          <h2 className="font-display text-display-lg uppercase mb-4">
            Join the Toolbox
          </h2>
          <p className="font-body text-body-lg text-on-surface-variant mb-8 leading-relaxed">
            New gear breakdowns and workflow tutorials straight to your inbox.
          </p>
          <form
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              required
              placeholder="YOUR EMAIL ADDRESS"
              className="flex-1 bg-transparent border-b border-primary py-3 font-mono text-label-md text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-secondary transition-colors uppercase"
            />
            <button
              type="submit"
              className="bg-primary text-[#003737] py-3 px-6 font-mono text-label-md uppercase tracking-widest hover:bg-primary-container transition-colors cursor-pointer font-bold whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
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
