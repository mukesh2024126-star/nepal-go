'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import RoundedCard from '@/components/ui/RoundedCard';
import PillButton from '@/components/ui/PillButton';
import { authAPI } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setErrorMessage('');

    try {
      const data = await authAPI.login({ email, password });
      // Backend returns { token, user: { id, full_name, username, email, ... } }
      const token = data.token || data.access_token;
      localStorage.setItem('nepal_token', token);
      localStorage.setItem('nepal_user', JSON.stringify(data.user || { id: data.user_id, username: data.username }));
      // Set cookie so the middleware allows access to protected routes
      document.cookie = `nepal_token=${token}; path=/; max-age=${7 * 24 * 3600}`;
      router.push('/dashboard');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: '"DM Sans", sans-serif' }}>
      {/* Left decorative panel */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-emerald-800 to-teal-900 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-[-100px] right-[-100px] w-96 h-96 rounded-full border-2 border-white opacity-10" />
        <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 rounded-full border-2 border-white opacity-10" />
        <div className="relative z-10 text-center text-white">
          <h2 className="font-black text-2xl mb-8" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>NepalGo</h2>
          <h3 className="font-black text-4xl leading-tight" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Discover Nepal,<br />Your Way
          </h3>
          <p className="text-white/70 mt-4 text-lg">Your AI-powered travel companion</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-[#F0EBF8] p-8">
        <RoundedCard className="max-w-md w-full" padding="lg">
          <p className="text-[#22C55E] font-bold text-center text-lg mb-6" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>NepalGo</p>
          <h1 className="font-black text-2xl text-center text-[#111827]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Welcome back</h1>
          <p className="text-[#6B7280] text-sm text-center mt-1 mb-6">Sign in to your account</p>

          {/* Google button */}
          <button className="w-full flex items-center justify-center gap-3 border border-[#E5E7EB] rounded-full py-3 text-sm font-medium text-[#374151] hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-red-500 text-white text-xs font-bold flex items-center justify-center">G</div>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#E5E7EB]" />
            <span className="text-xs text-[#9CA3AF]">or</span>
            <div className="flex-1 h-px bg-[#E5E7EB]" />
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="relative mb-4">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] w-4 h-4" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full rounded-full border border-[#E5E7EB] pl-12 pr-4 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-[#22C55E]"
              />
            </div>

            {/* Password */}
            <div className="relative mb-4">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] w-4 h-4" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-full border border-[#E5E7EB] pl-12 pr-12 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-[#22C55E]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-[#22C55E] text-sm text-right cursor-pointer mb-4 hover:text-[#16A34A]">Forgot password?</p>

            <PillButton variant="solid" size="lg" fullWidth type="submit" loading={loading}>
              Sign In
            </PillButton>

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-full px-4 py-2 text-center mt-3">
                {errorMessage}
              </div>
            )}
          </form>

          <p className="text-sm text-center text-[#6B7280] mt-4">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-[#22C55E] font-medium hover:text-[#16A34A]">Sign up</Link>
          </p>
        </RoundedCard>
      </div>
    </div>
  );
}
