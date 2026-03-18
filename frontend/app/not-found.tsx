import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F0EBF8] flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="text-center max-w-md">
          <div className="text-8xl mb-6">🏔️</div>
          <h1 className="text-4xl font-black text-[#111827] mb-3"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Lost in the Himalayas?
          </h1>
          <p className="text-[#6B7280] mb-8 leading-relaxed">
            The page you&apos;re looking for has wandered off the trail.
            Let&apos;s get you back to base camp.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/"
              className="inline-block bg-[#22C55E] text-white font-bold rounded-full px-7 py-3 hover:bg-[#16A34A] transition-colors"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              Back to Home
            </Link>
            <Link href="/destinations"
              className="inline-block border border-[#22C55E] text-[#22C55E] font-bold rounded-full px-7 py-3 hover:bg-[#22C55E] hover:text-white transition-colors"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              Browse Destinations
            </Link>
          </div>
          <p className="text-sm text-[#9CA3AF] mt-10">
            Error 404 — Page not found
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
