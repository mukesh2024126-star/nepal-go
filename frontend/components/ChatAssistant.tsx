'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, Send, Sparkles, MessageCircle, ChevronDown } from 'lucide-react';
import { chatAPI } from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  ts: string;
  action?: { type: string; url: string; label: string };
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  'Plan a 5-day trip to Pokhara',
  'Best time to visit Everest?',
  'How much does a Chitwan safari cost?',
  'Suggest a trip under NPR 30,000',
];

function getTimestamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'ai', text: "Hi! I'm NepalGo AI. 👋 Ask me anything about Nepal travel — destinations, budgets, best seasons, or let me plan your trip!", ts: getTimestamp() },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [bounced, setBounced] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string; content: string}>>([]);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // bounce on first mount
  useEffect(() => {
    const t = setTimeout(() => setBounced(true), 600);
    const t2 = setTimeout(() => setBounced(false), 2400);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);

  // listen for navbar open-chat event
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-chat', handler);
    return () => window.removeEventListener('open-chat', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || typing) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: text.trim(), ts: getTimestamp() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    const newHistory = [...conversationHistory, { role: 'user', content: text.trim() }];

    try {
      const data = await chatAPI.send({ message: text.trim(), conversation_history: conversationHistory });
      const responseText = data.response || data.message || 'Sorry, I could not process that.';
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: responseText,
        ts: getTimestamp(),
        action: data.action,
        suggestions: data.suggestions,
      };
      setMessages(prev => [...prev, aiMsg]);
      setConversationHistory([...newHistory, { role: 'assistant', content: responseText }]);
      if (data.suggestions && data.suggestions.length > 0) {
        setCurrentSuggestions(data.suggestions);
      }
    } catch {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: "I'm having trouble connecting to the server right now. Please try again in a moment! 🔄",
        ts: getTimestamp(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setTyping(false);
    }
  }, [typing, conversationHistory]);

  const showSuggestions = messages.length <= 2 && !typing;

  return (
    <>
      {/* Floating Bubble */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {!open && (
          <div className={`transition-all duration-300 ${bounced ? 'translate-y-[-8px]' : 'translate-y-0'}`}>
            <button
              onClick={() => setOpen(true)}
              className="group relative w-14 h-14 rounded-full bg-gradient-to-br from-[#22C55E] to-teal-500 shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              aria-label="Open AI Assistant"
            >
              <MessageCircle className="w-6 h-6 text-white" />
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-full bg-[#22C55E] animate-ping opacity-20" />
            </button>
            {/* Tooltip */}
            <div className="absolute right-16 bottom-3 bg-[#111827] text-white text-xs rounded-full px-3 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ right: '68px', bottom: '12px', position: 'absolute' }}>
              Ask NepalGo AI
            </div>
          </div>
        )}

        {/* Chat Panel */}
        {open && (
          <div
            className="w-[380px] rounded-[20px] bg-white overflow-hidden flex flex-col"
            style={{
              height: '520px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
              animation: 'slideUp 0.25s ease-out',
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#22C55E] to-teal-500 px-4 py-3 flex items-center gap-3 flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-sm" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>NepalGo AI</p>
                <span className="text-white/70 text-[10px]">Powered by AI • Always ready</span>
              </div>
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#E5E7EB transparent' }}>
              {messages.map(msg => (
                <div key={msg.id}>
                  <div className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {msg.role === 'ai' && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#22C55E] to-teal-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      <div className={`rounded-[16px] px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#22C55E] text-white rounded-tr-sm'
                          : 'bg-[#F3F4F6] text-[#111827] rounded-tl-sm'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-[#9CA3AF] px-1">{msg.ts}</span>
                    </div>
                  </div>
                  {/* Action button */}
                  {msg.action && msg.role === 'ai' && (
                    <div className="ml-9 mt-2">
                      <button
                        onClick={() => router.push(msg.action!.url)}
                        className="text-xs bg-[#22C55E] text-white rounded-full px-3 py-1.5 hover:bg-green-600 transition-colors cursor-pointer"
                      >
                        {msg.action.label} →
                      </button>
                    </div>
                  )}
                  {/* Inline suggestions */}
                  {msg.suggestions && msg.role === 'ai' && msg.id === messages[messages.length - 1]?.id && (
                    <div className="ml-9 mt-2 flex flex-col gap-1.5">
                      {msg.suggestions.map(s => (
                        <button key={s} onClick={() => sendMessage(s)}
                          className="text-left text-xs border border-[#E5E7EB] rounded-full px-3 py-1.5 text-[#374151] hover:border-[#22C55E] hover:text-[#22C55E] hover:bg-green-50 transition-colors cursor-pointer">
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {typing && (
                <div className="flex gap-2 items-center">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#22C55E] to-teal-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-[#F3F4F6] rounded-[16px] rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                    {[0, 0.2, 0.4].map((d, i) => (
                      <span key={i} className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce"
                        style={{ animationDelay: `${d}s` }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {showSuggestions && (
                <div className="pt-1">
                  <p className="text-[10px] text-[#9CA3AF] mb-2 uppercase tracking-wide font-medium">Suggested</p>
                  <div className="flex flex-col gap-2">
                    {currentSuggestions.map(s => (
                      <button key={s} onClick={() => sendMessage(s)}
                        className="text-left text-xs border border-[#E5E7EB] rounded-full px-3 py-2 text-[#374151] hover:border-[#22C55E] hover:text-[#22C55E] hover:bg-green-50 transition-colors cursor-pointer">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-[#F3F4F6] px-3 py-3 flex gap-2 flex-shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                placeholder="Ask about Nepal travel…"
                className="flex-1 text-sm rounded-full border border-[#E5E7EB] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#22C55E] bg-white"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || typing}
                className="w-9 h-9 rounded-full bg-[#22C55E] text-white flex items-center justify-center hover:bg-[#16A34A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex-shrink-0">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Minimise button when open */}
        {open && (
          <button onClick={() => setOpen(false)}
            className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer shadow-md">
            <ChevronDown className="w-4 h-4 text-[#6B7280]" />
          </button>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>
    </>
  );
}
