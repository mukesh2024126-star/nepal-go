'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogIn, LogOut, LayoutDashboard, Menu, X, ChevronDown, Sparkles } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import PillButton from '@/components/ui/PillButton';

const NAV_LINKS = [
  { href: '/destinations', label: 'Destinations' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/about', label: 'About' },
];

function getInitialUsername(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('nepal_user');
    return raw ? (JSON.parse(raw).username ?? null) : null;
  } catch {
    return null;
  }
}

export default function Navbar() {
  const pathname = usePathname();
  const [username, setUsername] = useState<string | null>(getInitialUsername);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isHomepage = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('nepal_token');
    localStorage.removeItem('nepal_user');
    document.cookie = 'nepal_token=; path=/; max-age=0';
    setUsername(null);
    setDropdownOpen(false);
    window.location.href = '/';
  };

  const initials = username ? username.slice(0, 2).toUpperCase() : '';
  const transparent = isHomepage && !scrolled;

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        transparent
          ? 'bg-transparent border-transparent'
          : 'bg-white border-b border-[#E5E7EB]'
      }`} style={{ boxShadow: transparent ? 'none' : '0 1px 12px rgba(0,0,0,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className={`font-black text-xl tracking-tight transition-colors ${transparent ? 'text-white' : 'text-[#111827]'}`}
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            NepalGo
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link key={href} href={href}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    active
                      ? 'bg-emerald-50 text-emerald-700'
                      : transparent
                        ? 'text-white/80 hover:text-white hover:bg-white/10'
                        : 'text-[#6B7280] hover:text-[#111827] hover:bg-gray-50'
                  }`}>
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-chat'));
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all bg-gradient-to-r from-[#22C55E] to-teal-500 text-white hover:opacity-90 hover:scale-105 active:scale-95"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              aria-label="Open AI Assistant"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden md:inline">AI Assistant</span>
            </button>
            {username ? (
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setDropdownOpen(o => !o)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${
                    transparent
                      ? 'border-white/30 text-white hover:bg-white/10'
                      : 'border-[#E5E7EB] text-[#111827] hover:bg-gray-50'
                  }`}>
                  <div className="w-7 h-7 rounded-full bg-[#22C55E] text-white text-xs font-black flex items-center justify-center">
                    {initials}
                  </div>
                  <span className="text-sm font-medium hidden sm:block">{username}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-[16px] border border-[#E5E7EB] py-1 z-50"
                    style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
                    <Link href="/dashboard" onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#374151] hover:bg-gray-50 hover:text-[#111827] transition-colors">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <div className="my-1 border-t border-[#F3F4F6]" />
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/login"
                className={`hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  transparent
                    ? 'border-white/30 text-white hover:bg-white/10'
                    : 'border-[#E5E7EB] text-[#374151] hover:bg-gray-50'
                }`}>
                <LogIn className="w-4 h-4" /> Login
              </Link>
            )}

            <Link href="/plan" className="hidden sm:block">
              <PillButton variant="solid" size="sm">Plan a Trip</PillButton>
            </Link>

            <button onClick={() => setMobileOpen(o => !o)}
              className={`md:hidden p-2 rounded-full transition-colors ${transparent ? 'text-white hover:bg-white/10' : 'text-[#6B7280] hover:bg-gray-50'}`}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-[#E5E7EB] px-6 py-4 space-y-1">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active ? 'bg-emerald-50 text-emerald-700' : 'text-[#374151] hover:bg-gray-50'
                  }`}>
                  {label}
                </Link>
              );
            })}
            <div className="pt-3 border-t border-[#F3F4F6] flex flex-col gap-2">
              {username ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 rounded-xl text-sm font-medium text-[#374151] hover:bg-gray-50">
                    Dashboard
                  </Link>
                  <button onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50">
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/auth/login" onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-medium text-[#374151] hover:bg-gray-50">
                  Login
                </Link>
              )}
              <Link href="/plan" onClick={() => setMobileOpen(false)}>
                <PillButton variant="solid" size="sm" fullWidth>Plan a Trip</PillButton>
              </Link>
            </div>
          </div>
        )}
      </nav>
      {!isHomepage && <div className="h-16" />}
    </>
  );
}
