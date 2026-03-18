'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, AtSign, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import RoundedCard from '@/components/ui/RoundedCard';
import PillButton from '@/components/ui/PillButton';
import { authAPI } from '@/lib/api';

const travelStyles = [
  { emoji: '🏔️', label: 'Adventure' },
  { emoji: '🏛️', label: 'Cultural' },
  { emoji: '🌿', label: 'Nature' },
  { emoji: '💎', label: 'Luxury' },
];

function getStrengthLabel(password: string): { label: string; color: string; width: string; bgColor: string } {
  if (password.length < 1) return { label: '', color: 'text-gray-400', width: 'w-0', bgColor: 'bg-gray-300' };
  if (password.length < 6) return { label: 'Weak', color: 'text-red-500', width: 'w-1/4', bgColor: 'bg-red-400' };
  if (password.length < 10) return { label: 'Medium', color: 'text-yellow-500', width: 'w-2/3', bgColor: 'bg-yellow-400' };
  return { label: 'Strong', color: 'text-green-600', width: 'w-full', bgColor: 'bg-[#22C55E]' };
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const toggleStyle = (label: string) => {
    setSelectedStyles((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  };

  const strength = getStrengthLabel(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setErrorMessage('Please enter a valid email.'); return; }
    if (password.length < 8) { setErrorMessage('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setErrorMessage('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await authAPI.register({ username, email, password, full_name: fullName });
      setSuccessMessage('Account created! Redirecting to login...');
      setTimeout(() => { window.location.href = '/auth/login'; }, 2000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Registration failed');
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
          <h1 className="font-black text-2xl text-center text-[#111827]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Create Account</h1>
          <p className="text-[#6B7280] text-sm text-center mt-1 mb-6">Join Nepal&apos;s travel community</p>

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-full px-4 py-2 text-center mb-4 text-sm">
              {successMessage}
            </div>
          )}

          {/* Google button */}
          <button className="w-full flex items-center justify-center gap-3 border border-[#E5E7EB] rounded-full py-3 text-sm font-medium text-[#374151] hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-red-500 text-white text-xs font-bold flex items-center justify-center">G</div>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#E5E7EB]" />
            <span className="text-xs text-[#9CA3AF]">or</span>
            <div className="flex-1 h-px bg-[#E5E7EB]" />
          </div>

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="relative mb-4">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] w-4 h-4" />
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name"
                className="w-full rounded-full border border-[#E5E7EB] pl-12 pr-4 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#22C55E]" />
            </div>

            {/* Username */}
            <div className="relative mb-4">
              <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] w-4 h-4" />
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username"
                className="w-full rounded-full border border-[#E5E7EB] pl-12 pr-4 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#22C55E]" />
            </div>

            {/* Email */}
            <div className="relative mb-4">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] w-4 h-4" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address"
                className="w-full rounded-full border border-[#E5E7EB] pl-12 pr-4 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#22C55E]" />
            </div>

            {/* Password */}
            <div className="relative mb-1">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] w-4 h-4" />
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
                className="w-full rounded-full border border-[#E5E7EB] pl-12 pr-12 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#22C55E]" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] cursor-pointer">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Strength bar */}
            <div className="mt-1 flex items-center gap-2 mb-4">
              <div className="flex-1 h-1.5 rounded-full bg-[#E5E7EB]">
                <div className={`h-full rounded-full transition-all duration-300 ${strength.width} ${strength.bgColor}`} />
              </div>
              <span className={`text-xs ${strength.color}`}>{strength.label}</span>
            </div>

            {/* Confirm Password */}
            <div className="relative mb-4">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] w-4 h-4" />
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password"
                className="w-full rounded-full border border-[#E5E7EB] pl-12 pr-4 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#22C55E]" />
            </div>
            {confirmPassword && confirmPassword !== password && (
              <p className="text-red-500 text-xs -mt-3 mb-3 px-4">Passwords do not match</p>
            )}

            {/* Travel Style */}
            <p className="text-sm text-[#6B7280] font-medium mt-4 mb-2">Your Travel Style</p>
            <div className="flex flex-wrap gap-2">
              {travelStyles.map(({ emoji, label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleStyle(label)}
                  className={`rounded-full px-4 py-2 text-sm font-medium cursor-pointer transition-all ${
                    selectedStyles.includes(label)
                      ? 'bg-[#22C55E] text-white border border-[#22C55E]'
                      : 'bg-[#F3F4F6] text-[#374151] border border-transparent hover:border-gray-300'
                  }`}
                >
                  {emoji} {label}
                </button>
              ))}
            </div>

            <PillButton variant="solid" size="lg" fullWidth className="mt-6" type="submit" loading={loading}>
              Create Account
            </PillButton>

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-full px-4 py-2 text-center mt-3">
                {errorMessage}
              </div>
            )}
          </form>

          <p className="text-sm text-center text-[#6B7280] mt-4">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#22C55E] font-medium hover:text-[#16A34A]">Sign in</Link>
          </p>
        </RoundedCard>
      </div>
    </div>
  );
}
