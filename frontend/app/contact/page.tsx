'use client';

import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PillButton from '@/components/ui/PillButton';
import RoundedCard from '@/components/ui/RoundedCard';

export default function ContactPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', subject: 'Trip Planning Help', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    if (!form.firstName || !form.lastName || !form.email || !form.subject || !form.message) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      setSuccess('Thanks for reaching out! We will get back to you within 24 hours.');
      setForm({ firstName: '', lastName: '', email: '', subject: 'Trip Planning Help', message: '' });
    } catch {
      setError('Failed to send. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0EBF8]">
      <Navbar />
      <section className="pt-24 pb-12 px-6 text-center">
        <p className="text-[#22C55E] text-sm font-semibold uppercase tracking-widest mb-3">Get In Touch</p>
        <h1 className="text-4xl font-black text-[#111827] mb-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>We&apos;d Love to Hear From You</h1>
        <p className="text-[#6B7280] max-w-md mx-auto">Questions about a destination? Need help with your itinerary? Just say hi. We respond within 24 hours.</p>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-6">{[
            { icon: '📧', title: 'Email', detail: 'hello@nepalgo.com', sub: 'We reply within 24 hours' },
            { icon: '📍', title: 'Location', detail: 'Thamel, Kathmandu, Nepal', sub: 'Walk-in Mon–Fri 10am–6pm' },
            { icon: '📞', title: 'Phone', detail: '+977 01-4234567', sub: 'Available 8am–8pm NPT' },
            { icon: '💬', title: 'Social', detail: '@NepalGo', sub: 'Instagram & Twitter' },
          ].map(({ icon, title, detail, sub }) => (
            <RoundedCard key={title} padding="md"><div className="flex items-start gap-4"><span className="text-2xl">{icon}</span><div><div className="font-bold text-sm text-[#111827]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{title}</div><div className="text-[#111827] text-sm mt-0.5">{detail}</div><div className="text-xs text-[#9CA3AF] mt-0.5">{sub}</div></div></div></RoundedCard>
          ))}</div>

          <RoundedCard padding="lg">
            <h2 className="font-black text-xl text-[#111827] mb-6" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Send a Message</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-[#6B7280] mb-1 block">First Name</label><input type="text" value={form.firstName} onChange={(e)=>setForm({...form, firstName:e.target.value})} className="w-full border border-[#E5E7EB] rounded-[12px] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] bg-white" /></div>
                <div><label className="text-sm text-[#6B7280] mb-1 block">Last Name</label><input type="text" value={form.lastName} onChange={(e)=>setForm({...form, lastName:e.target.value})} className="w-full border border-[#E5E7EB] rounded-[12px] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] bg-white" /></div>
              </div>
              <div><label className="text-sm text-[#6B7280] mb-1 block">Email</label><input type="email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} className="w-full border border-[#E5E7EB] rounded-[12px] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] bg-white" /></div>
              <div><label className="text-sm text-[#6B7280] mb-1 block">Subject</label><select value={form.subject} onChange={(e)=>setForm({...form, subject:e.target.value})} className="w-full border border-[#E5E7EB] rounded-[12px] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] bg-white text-[#111827]"><option>Trip Planning Help</option><option>Destination Question</option><option>Bug / Technical Issue</option><option>Partnership Inquiry</option><option>Other</option></select></div>
              <div><label className="text-sm text-[#6B7280] mb-1 block">Message</label><textarea rows={5} value={form.message} onChange={(e)=>setForm({...form, message:e.target.value})} className="w-full border border-[#E5E7EB] rounded-[12px] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] bg-white resize-none" /></div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-green-700">{success}</p>}
              <PillButton variant="solid" type="submit" fullWidth>{loading ? 'Sending...' : 'Send Message'}</PillButton>
            </form>
          </RoundedCard>
        </div>
      </section>

      <Footer />
    </div>
  );
}
