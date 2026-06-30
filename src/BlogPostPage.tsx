import React, { useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Tag, ChevronRight, Youtube, Twitter } from 'lucide-react';
import SiteNav from './SiteNav';
import { BLOG_POSTS } from './blogData';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const postIndex = BLOG_POSTS.findIndex((p) => p.slug === slug);
  const post = BLOG_POSTS[postIndex];
  const nextPost = BLOG_POSTS[postIndex + 1] ?? BLOG_POSTS[0];
  const related = BLOG_POSTS.filter((p) => p.slug !== slug && p.category === post?.category).slice(0, 3);
  const fallbackRelated = BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 3);
  const sidebarPosts = related.length > 0 ? related : fallbackRelated;

  useEffect(() => {
    window.scrollTo({ top: 0 });
    if (!post) navigate('/blog');
  }, [slug]);

  if (!post) return null;

  const shareUrl = encodeURIComponent(window.location.href);
  const shareText = encodeURIComponent(post.title + ' — My Cine Toolbox');
  const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;

  return (
    <div className="min-h-screen bg-background text-on-surface font-body">
      <div className="film-grain" />
      <SiteNav />

      {/* ── Hero ── */}
      <section className="relative h-[60vh] min-h-[420px] flex flex-col justify-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1415] via-[#0f1415]/60 to-[#0f1415]/20" />
        </div>
        <div className="relative z-10 px-6 md:px-16 pb-12 max-w-7xl mx-auto w-full">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 font-mono text-label-sm text-primary hover:text-primary-container transition-colors uppercase tracking-wider mb-6 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to The Lab
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-secondary-container text-white font-mono text-[10px] uppercase tracking-widest px-3 py-1">
              {post.category}
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-on-surface-variant uppercase">
              <Clock size={10} />
              {post.readTime}
            </span>
          </div>
          <h1 className="font-display text-[42px] md:text-[64px] text-on-surface uppercase leading-none max-w-4xl">
            {post.title}
          </h1>
        </div>
      </section>

      {/* ── Article Body ── */}
      <section className="px-6 md:px-16 max-w-7xl mx-auto py-12">
        <div className="flex flex-col lg:flex-row gap-12">

          {/* Main Content */}
          <article className="flex-1 min-w-0">
            {/* Byline */}
            <div className="flex items-center gap-6 pb-8 mb-8 border-b border-outline-variant/30">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#252b2b] border-2 border-primary flex items-center justify-center">
                <img
                  src="/aaron-avatar.jpg"
                  alt="Aaron Stowers"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-mono text-label-sm text-on-surface uppercase">{post.author}</p>
                <p className="font-mono text-[10px] text-on-surface-variant uppercase">{post.date}</p>
              </div>
            </div>

            {/* Prose */}
            <div
              className="prose-cine"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-outline-variant/30">
              <Tag size={14} className="text-primary mt-1 shrink-0" />
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[10px] uppercase border border-outline-variant/40 text-on-surface-variant px-3 py-1.5"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Share */}
            <div className="flex items-center gap-6 mt-8">
              <span className="font-mono text-label-sm text-on-surface-variant uppercase">Share:</span>
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 font-mono text-label-sm text-on-surface-variant hover:text-primary transition-colors uppercase"
              >
                <Twitter size={14} /> Twitter
              </a>
              <a
                href="https://www.youtube.com/@mycinetoolbox1979"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 font-mono text-label-sm text-on-surface-variant hover:text-primary transition-colors uppercase"
              >
                <Youtube size={14} /> Watch the Video
              </a>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:w-72 shrink-0">
            <div className="lg:sticky lg:top-28 space-y-8">
              {/* More Articles */}
              <div className="bg-surface-container border border-outline-variant/30 p-6">
                <h3 className="font-display text-headline-sm uppercase text-primary mb-6 tracking-wide">
                  More From The Lab
                </h3>
                <div className="space-y-5">
                  {sidebarPosts.map((p) => (
                    <Link
                      key={p.slug}
                      to={`/blog/${p.slug}`}
                      className="group flex gap-3 items-start"
                    >
                      <div className="w-16 h-12 shrink-0 overflow-hidden bg-[#090f10]">
                        <img
                          src={p.coverImage}
                          alt={p.title}
                          className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono text-[9px] text-secondary uppercase tracking-widest mb-1">
                          {p.category}
                        </p>
                        <p className="font-display text-sm uppercase leading-tight text-on-surface group-hover:text-primary transition-colors line-clamp-2">
                          {p.title}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  to="/blog"
                  className="mt-6 flex items-center gap-1 font-mono text-label-sm text-primary uppercase hover:gap-2 transition-all"
                >
                  View All <ChevronRight size={12} />
                </Link>
              </div>

              {/* YouTube CTA */}
              <div className="bg-surface-container border border-outline-variant/30 p-6 text-center">
                <Youtube size={28} className="text-primary mx-auto mb-3" />
                <h4 className="font-display text-headline-sm uppercase mb-2">Watch on YouTube</h4>
                <p className="font-body text-body-sm text-on-surface-variant text-xs leading-relaxed mb-4">
                  See the full video breakdowns behind these articles.
                </p>
                <a
                  href="https://www.youtube.com/@mycinetoolbox1979"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-primary text-[#003737] py-3 font-mono text-label-sm uppercase tracking-widest hover:bg-primary-container transition-colors font-bold"
                >
                  Subscribe Free
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* ── Next Article ── */}
      {nextPost && nextPost.slug !== post.slug && (
        <section className="px-6 md:px-16 max-w-7xl mx-auto mb-16">
          <div className="teal-divider mb-10" />
          <p className="font-mono text-label-sm text-primary uppercase tracking-widest mb-4">Up Next</p>
          <Link
            to={`/blog/${nextPost.slug}`}
            className="group flex flex-col md:flex-row gap-6 bg-surface-container border border-outline-variant/30 hover:border-primary/50 hover-glow transition-all p-6 md:p-8 overflow-hidden"
          >
            <div className="md:w-48 aspect-video md:aspect-auto shrink-0 overflow-hidden bg-[#090f10]">
              <img
                src={nextPost.coverImage}
                alt={nextPost.title}
                className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
              />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <span className="font-mono text-[10px] text-secondary uppercase tracking-widest mb-2">
                {nextPost.category}
              </span>
              <h3 className="font-display text-headline-lg uppercase leading-tight group-hover:text-primary transition-colors">
                {nextPost.title}
              </h3>
              <p className="font-body text-body-md text-on-surface-variant text-sm mt-2 line-clamp-2 leading-relaxed">
                {nextPost.excerpt}
              </p>
              <span className="mt-4 flex items-center gap-1 font-mono text-label-sm text-primary uppercase group-hover:gap-2 transition-all">
                Read Article <ChevronRight size={12} />
              </span>
            </div>
          </Link>
        </section>
      )}

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
