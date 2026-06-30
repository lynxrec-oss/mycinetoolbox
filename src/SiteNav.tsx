import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Home', to: '/', isRoute: true },
  { label: 'About', to: '/about', isRoute: true },
  { label: 'Videos', to: '/#videos', isRoute: false },
  { label: 'Blog', to: '/blog', isRoute: true },
  { label: 'Toolbox', to: '/#toolbox', isRoute: false },
  { label: 'Shop', to: '/#shop', isRoute: false },
  { label: 'Contact', to: '/contact', isRoute: true },
];

export default function SiteNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-40 flex justify-between items-center px-6 md:px-16 h-20 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#0f1415]/95 backdrop-blur-md border-b border-[#3c4949]/30'
            : 'bg-[#0f1415]/80 backdrop-blur-sm'
        }`}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 cursor-pointer">
          <img
            src="/logo.png"
            alt="My Cine Toolbox Logo"
            className="h-12 md:h-14 w-auto object-contain"
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex gap-8 items-center">
          {NAV_LINKS.map((link) => {
            const isActive = link.isRoute
              ? pathname === link.to
              : false;
            return link.isRoute ? (
              <Link
                key={link.label}
                to={link.to}
                className={`font-mono text-label-md uppercase tracking-wide transition-colors ${
                  isActive
                    ? 'text-primary border-b-2 border-primary pb-1'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.to}
                className="font-mono text-label-md text-on-surface-variant hover:text-primary transition-colors uppercase tracking-wide"
              >
                {link.label}
              </a>
            );
          })}
        </div>

        {/* Right side: Shop icon + mobile toggle */}
        <div className="flex items-center gap-4">
          <Link
            to="/#shop"
            aria-label="Shop"
            className="text-primary hover:text-primary-container transition-colors p-1"
          >
            <ShoppingBag size={20} />
          </Link>

          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden text-primary hover:text-primary-container transition-colors cursor-pointer p-1"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden md:hidden">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-full max-w-xs bg-surface border-l border-outline-variant/50 flex flex-col p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-10">
              <span className="font-display text-headline-md text-primary tracking-wider uppercase">
                Menu
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer p-1"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-6">
              {NAV_LINKS.map((link) =>
                link.isRoute ? (
                  <Link
                    key={link.label}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className="font-mono text-label-md text-on-surface hover:text-primary transition-colors uppercase text-sm"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.to}
                    onClick={() => setMobileOpen(false)}
                    className="font-mono text-label-md text-on-surface hover:text-primary transition-colors uppercase text-sm"
                  >
                    {link.label}
                  </a>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
