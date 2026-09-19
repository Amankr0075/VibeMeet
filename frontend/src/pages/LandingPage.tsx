import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, useInView } from "framer-motion";
import { 
  Video, Heart, Shield, Sparkles, Zap, Star, Users, ChevronRight, ArrowRight, 
  BadgeCheck, PhoneCall, Radio, Megaphone, Share2, Copy, Check, X
} from "lucide-react";
import { Logo3D } from "../components/Logo3D";
import { InfoModal, type InfoModalTab } from "../components/InfoModal";
import { apiUrl } from "../config/api";

const MarqueeTicker: React.FC<{ text: string }> = ({ text }) => {
  const items = Array.from({ length: 6 }, () => text);
  return (
    <div className="community-ticker-root w-full overflow-hidden relative flex items-center" style={{
      background: 'linear-gradient(90deg, rgba(236,72,153,0.05) 0%, rgba(139,92,246,0.08) 50%, rgba(59,130,246,0.05) 100%)',
      border: '1px solid rgba(236,72,153,0.15)',
      borderRadius: '2rem',
      padding: '4px',
    }}>
      {/* Left premium badge (static, solid background to prevent text overlap) */}
      <div className="relative z-20 flex-shrink-0 flex items-center gap-2 px-5 py-2 rounded-full text-[11px] font-black tracking-widest uppercase whitespace-nowrap" style={{
        background: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
        border: '1px solid rgba(236,72,153,0.4)',
        color: '#f9a8d4',
        boxShadow: '0 0 20px rgba(236,72,153,0.25), inset 0 0 10px rgba(139,92,246,0.2)',
      }}>
        <div className="relative flex items-center justify-center">
          <span className="absolute w-full h-full rounded-full bg-pink-500 animate-ping opacity-40"></span>
          <Radio size={13} className="text-pink-400 relative z-10" />
        </div>
        <span>Live Update</span>
      </div>

      {/* Gradient fade edge for scrolling text */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10" style={{ background: 'linear-gradient(to left, #0a0f1e, transparent)' }} />
      <div className="pointer-events-none absolute inset-y-0 left-[140px] w-12 z-10" style={{ background: 'linear-gradient(to right, #0a0f1e, transparent)' }} />

      {/* Scrolling text */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex" style={{ animation: 'ticker-scroll 35s linear infinite', willChange: 'transform' }}>
          {items.map((t, i) => (
            <div key={i} className="flex items-center gap-6 px-8 py-2 shrink-0">
              <span className="flex items-center gap-2.5 text-sm font-semibold tracking-wide whitespace-nowrap" style={{ color: 'rgba(249,168,212,0.85)' }}>
                <Megaphone size={14} className="text-fuchsia-400 shrink-0" />
                {t}
              </span>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', boxShadow: '0 0 8px rgba(236,72,153,0.6)' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


const Particles = () => {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 4 + 2,
    duration: `${Math.random() * 6 + 4}s`,
    delay: `${Math.random() * 5}s`,
    color: i % 3 === 0 ? "rgba(236,72,153,0.6)" : i % 3 === 1 ? "rgba(96,165,250,0.6)" : "rgba(168,85,247,0.6)",
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div key={p.id} className="particle" style={{ left: p.left, top: p.top, width: p.size, height: p.size, background: p.color, animationDuration: p.duration, animationDelay: p.delay, boxShadow: `0 0 ${p.size * 2}px ${p.color}` }} />
      ))}
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
  delay?: number;
}

type LandingPost = { title: string; description: string; active: boolean; imageUrl?: string; expiresAt?: string };
type LiveContent = {
  announcement: string;
  occasion: LandingPost & { badge: string };
  offer: LandingPost & { ctaLabel: string };
  collaboration: LandingPost & { partner: string };
};

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, desc, color, delay = 0 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay }} whileHover={{ scale: 1.04, y: -4 }} className="glass-panel p-7 rounded-3xl flex flex-col gap-4 group cursor-default relative overflow-hidden">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" style={{ background: `radial-gradient(circle at 50% 0%, ${color}22 0%, transparent 70%)` }} />
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center relative z-10" style={{ background: `${color}22`, boxShadow: `0 0 20px ${color}44` }}>{icon}</div>
      <h3 className="text-xl font-bold relative z-10">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed relative z-10">{desc}</p>
    </motion.div>
  );
};

const CampaignCard: React.FC<{ post: LandingPost; label: string; color: 'pink' | 'violet' | 'blue'; cta?: string }> = ({ post, label, color, cta }) => {
  const palettes = {
    pink: 'from-pink-500/40 via-fuchsia-500/10 to-transparent border-pink-400/25 text-pink-200',
    violet: 'from-violet-500/40 via-purple-500/10 to-transparent border-violet-400/25 text-violet-200',
    blue: 'from-blue-500/40 via-cyan-500/10 to-transparent border-blue-400/25 text-blue-200',
  };
  return <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -8, scale: 1.015 }} transition={{ duration: .35 }} className={`group relative min-h-[310px] overflow-hidden rounded-3xl border bg-gradient-to-br ${palettes[color]} shadow-2xl`}>
    {post.imageUrl ? <img src={post.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" /> : <div className="absolute inset-0 opacity-70" style={{ background: `radial-gradient(circle at 20% 15%, ${color === 'pink' ? '#ec4899' : color === 'violet' ? '#8b5cf6' : '#3b82f6'}88, transparent 45%)` }} />}
    <div className="absolute inset-0 bg-gradient-to-t from-[#090b18] via-[#090b18]/65 to-[#090b18]/10" />
    <motion.div animate={{ rotate: [0, 12, 0], scale: [1, 1.12, 1] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
    <div className="relative z-10 flex h-full min-h-[310px] flex-col items-start p-7">
      <span className="inline-flex rounded-full border border-white/20 bg-black/25 px-3 py-1 text-[10px] font-black tracking-widest text-white backdrop-blur-xl">{label}</span>
      <div className="mt-auto"><h3 className="text-2xl font-black leading-tight text-white">{post.title}</h3><p className="mt-3 text-sm leading-relaxed text-slate-200">{post.description}</p>{cta && <Link to="/register" className="mt-5 inline-flex items-center gap-1 text-sm font-black text-white transition-transform hover:translate-x-1">{cta} <ArrowRight className="h-4 w-4" /></Link>}</div>
    </div>
  </motion.article>;
};

const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [activeInfoTab, setActiveInfoTab] = useState<InfoModalTab>('about');
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liveContent, setLiveContent] = useState<LiveContent>({
    announcement: 'New connections are happening now — your next great conversation could start today.',
    occasion: { title: 'Tonight on VibeMeet', description: 'Meet people who are ready for a real conversation.', badge: 'LIVE EVENT', active: true },
    offer: { title: 'Your first vibe is on us', description: 'Join free and discover a more human way to meet.', ctaLabel: 'Join free', active: true },
    collaboration: { title: 'Made for meaningful moments', description: 'A safer, warmer place to meet beyond the scroll.', partner: 'VibeMeet community', active: true },
  });
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  // Handle both ISO UTC strings (from DB) and datetime-local strings (YYYY-MM-DDTHH:mm from new saves)
  const parseExpiry = (expiresAt?: string): number | null => {
    if (!expiresAt) return null;
    const d = new Date(expiresAt);
    return isNaN(d.getTime()) ? null : d.getTime();
  };
  const postIsLive = (post: LandingPost) => post.active && (!post.expiresAt || (parseExpiry(post.expiresAt) ?? 0) > currentTime);

  const openInfoModal = (tab: InfoModalTab) => {
    setActiveInfoTab(tab);
    setInfoModalOpen(true);
  };

  // Scroll reveal animations for '.fade-up' elements
  useEffect(() => {
    const elements = document.querySelectorAll('.fade-up');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const clock = window.setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetch(apiUrl('/api/admin/landing-content'));
        const data = await response.json();
        if (response.ok && data.content) setLiveContent(data.content);
      } catch { /* Default content keeps the landing page resilient if the API is offline. */ }
    };
    loadContent();
    const refresh = window.setInterval(loadContent, 30000);
    return () => window.clearInterval(refresh);
  }, []);

  const scrollTo = (id: string) => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://vibemeetchat.vercel.app';
  const shareText = `🎯 VibeMeet — No Swipes. Just Connections.\n\nMeet real people face-to-face in spontaneous video conversations powered by AI. No filters, no swiping — just genuine vibes.\n\nJoin me on VibeMeet: ${shareUrl}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareChannels = [
    {
      name: 'WhatsApp', color: '#25D366', icon: '💬',
      href: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'Twitter / X', color: '#000000', icon: '𝕏',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'Facebook', color: '#1877F2', icon: '𝒇',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'LinkedIn', color: '#0A66C2', icon: 'in',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'Telegram', color: '#2AABEE', icon: '✈️',
      href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'Email', color: '#ec4899', icon: '✉️',
      href: `mailto:?subject=${encodeURIComponent('Join me on VibeMeet!')}&body=${encodeURIComponent(shareText)}`,
    },
  ];

  return (
    <div className="min-h-screen text-white overflow-hidden relative" style={{ background: "#0a0f1e" }}>
      {/* Aurora BG */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="aurora-1 absolute w-[70vw] h-[70vw] rounded-full opacity-30" style={{ top: "-20%", left: "-20%", background: "radial-gradient(circle, #ec489980 0%, transparent 70%)" }} />
        <div className="aurora-2 absolute w-[60vw] h-[60vw] rounded-full opacity-25" style={{ bottom: "-15%", right: "-15%", background: "radial-gradient(circle, #3b82f680 0%, transparent 70%)" }} />
        <div className="aurora-3 absolute w-[40vw] h-[40vw] rounded-full opacity-20" style={{ top: "40%", left: "55%", background: "radial-gradient(circle, #a855f780 0%, transparent 70%)" }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <Particles />
      </div>

      {/* Nav */}
      <motion.nav initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }} className="relative z-50 container mx-auto px-6 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative">
            <div className="pulse-glow absolute inset-0 rounded-full" style={{ background: "rgba(236,72,153,0.3)", filter: "blur(8px)" }} />
            <Logo3D size={140} animate={false} className="relative z-10 group-hover:scale-105 transition-transform duration-300" />
          </div>
        </Link>
        <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button onClick={() => scrollTo('how-it-works')} className="hover:text-pink-400 transition-colors">How it works</button>
          <button onClick={() => openInfoModal('about')} className="hover:text-pink-400 transition-colors">About</button>
          <button onClick={() => openInfoModal('safety')} className="hover:text-pink-400 transition-colors">Safety</button>
          <button onClick={() => openInfoModal('guidelines')} className="hover:text-pink-400 transition-colors">Guidelines</button>
          <button onClick={() => openInfoModal('terms')} className="hover:text-pink-400 transition-colors">Terms</button>
          <button onClick={() => openInfoModal('privacy')} className="hover:text-pink-400 transition-colors">Privacy</button>
          <button onClick={() => openInfoModal('contact')} className="hover:text-pink-400 transition-colors">Contact</button>
        </div>
        <div className="flex items-center gap-3">
          {/* Share Button */}
          <button
            onClick={async () => {
              if (navigator.share) {
                try { await navigator.share({ title: 'VibeMeet', text: shareText, url: shareUrl }); return; } catch {}
              }
              setShowShare(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border border-white/15 bg-white/5 hover:bg-pink-500/15 hover:border-pink-500/40 transition-all duration-300"
            style={{ color: 'rgba(249,168,212,0.9)' }}
            title="Share VibeMeet"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {user ? (
            <Link to="/dashboard" className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25 hover:scale-105 transition-all duration-300">
              Go to Dashboard <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold border border-pink-500/40 bg-pink-500/10 hover:bg-pink-500/20 hover:border-pink-400 transition-all duration-300">
                Sign In <ChevronRight className="w-4 h-4" />
              </Link>
              <Link to="/register" className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20 hover:scale-105 transition-all duration-300">
                Get Started
              </Link>
            </>
          )}
        </div>
      </motion.nav>

      {/* Hero */}
      <main className="relative z-10 container mx-auto px-6 pt-16 pb-24 flex flex-col items-center text-center">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-5xl mb-8">
          <MarqueeTicker text={liveContent.announcement} />
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-10 text-sm font-medium fade-up" style={{ background: "rgba(236,72,153,0.12)", border: "1px solid rgba(236,72,153,0.3)", color: "#f472b6" }}>
          <Sparkles className="w-4 h-4" />
          The new way to genuinely connect · v2.0
        </motion.div>

        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="relative mb-5">
          <div className="pulse-glow absolute inset-0 rounded-full bg-pink-500/30 blur-xl" />
          <Logo3D size={122} className="relative z-10" />
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: .92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: .7, delay: .35 }} className="relative w-full max-w-4xl h-[250px] sm:h-[390px] mb-10 flex items-center justify-between px-4 sm:px-16">
          <div className="absolute left-[24%] right-[24%] top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-pink-400 via-fuchsia-200 to-blue-400 opacity-90 live-connection-line" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-fuchsia-500/30 blur-2xl pulse-glow" />
          <div className="absolute z-20 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-slate-950/80 border border-pink-300/60 shadow-[0_0_30px_rgba(236,72,153,.7)]"><Heart className="w-7 h-7 text-pink-300 fill-pink-300" /></div>
          <motion.div animate={{ y: [0, -8, 0], rotate: [-3, -1, -3] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="relative z-10 w-[34%] max-w-[220px] h-[92%] rounded-[1.9rem] p-1.5 bg-gradient-to-br from-pink-300 via-fuchsia-600 to-slate-950 shadow-[0_20px_45px_rgba(236,72,153,.35)]">
            <div className="relative h-full rounded-[1.55rem] overflow-hidden bg-slate-950 border border-white/20" style={{ backgroundImage: "url('/vibemeet-live-call-hero.png')", backgroundSize: '355% auto', backgroundPosition: '24% 34%' }}>
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 sm:w-20 sm:h-5 rounded-full bg-black" /><div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2"><span className="w-7 h-7 rounded-full bg-white/15 backdrop-blur flex items-center justify-center"><Video size={13} /></span><span className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center"><PhoneCall size={13} /></span></div>
            </div>
          </motion.div>
          <motion.div animate={{ y: [0, 8, 0], rotate: [3, 1, 3] }} transition={{ duration: 4.3, repeat: Infinity, ease: 'easeInOut' }} className="relative z-10 w-[34%] max-w-[220px] h-[92%] rounded-[1.9rem] p-1.5 bg-gradient-to-br from-blue-300 via-blue-600 to-slate-950 shadow-[0_20px_45px_rgba(59,130,246,.35)]">
            <div className="relative h-full rounded-[1.55rem] overflow-hidden bg-slate-950 border border-white/20" style={{ backgroundImage: "url('/vibemeet-live-call-hero.png')", backgroundSize: '355% auto', backgroundPosition: '76% 34%' }}>
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 sm:w-20 sm:h-5 rounded-full bg-black" /><div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2"><span className="w-7 h-7 rounded-full bg-white/15 backdrop-blur flex items-center justify-center"><Video size={13} /></span><span className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center"><PhoneCall size={13} /></span></div>
            </div>
          </motion.div>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="text-4xl md:text-6xl font-black max-w-4xl leading-[1.04] mb-5">A better way to meet people <span className="gradient-text">face to face.</span></motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.65 }} className="text-lg md:text-xl text-slate-400 mb-8 max-w-2xl leading-relaxed">
          Spontaneous one-to-one video conversations powered by AI — matched by your vibe, not your photo.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }} className="flex flex-col sm:flex-row gap-4 items-center mb-20">
          <Link to="/register" className="signup-cta btn-shimmer relative overflow-hidden inline-flex items-center gap-2 px-10 py-4 rounded-full font-bold text-white text-lg transition-transform hover:scale-105 active:scale-95" style={{ background: "linear-gradient(135deg, #ec4899, #8b5cf6, #3b82f6)" }}>
            <Video className="w-5 h-5" />
            Start meeting people <ArrowRight className="w-5 h-5" />
          </Link>
          <button onClick={() => scrollTo('how-it-works')} className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-medium text-white border border-white/15 bg-white/5 hover:bg-white/10 transition-colors">
            How it works
          </button>
        </motion.div>
        
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-400 -mt-14 mb-20">
          <span className="inline-flex items-center gap-1.5"><BadgeCheck size={15} className="text-emerald-400" /> Email-verified community</span>
          <span className="inline-flex items-center gap-1.5"><Shield size={15} className="text-blue-400" /> Safety tools in every call</span>
          <span className="inline-flex items-center gap-1.5"><Sparkles size={15} className="text-pink-400" /> Join free</span>
        </div>

        {(postIsLive(liveContent.occasion) || postIsLive(liveContent.offer) || postIsLive(liveContent.collaboration)) && (
          <section className="w-full max-w-6xl mb-24 text-left">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-8"><div><span className="text-pink-400 font-semibold text-sm uppercase tracking-widest">Always current</span><h2 className="text-3xl md:text-4xl font-black mt-2">Fresh reasons to <span className="gradient-text">show up</span></h2></div><p className="text-slate-400 text-sm max-w-sm">Updates published by the VibeMeet team appear here automatically.</p></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {postIsLive(liveContent.occasion) && <CampaignCard post={liveContent.occasion} label={liveContent.occasion.badge} color="pink" />}
              {postIsLive(liveContent.offer) && <CampaignCard post={liveContent.offer} label="MEMBER OFFER" color="violet" cta={liveContent.offer.ctaLabel} />}
              {postIsLive(liveContent.collaboration) && <CampaignCard post={liveContent.collaboration} label={liveContent.collaboration.partner} color="blue" />}
            </div>
          </section>
        )}

        {/* Feature Grid */}
        <div className="w-full max-w-6xl text-left mb-24">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-14">
            <span className="text-pink-400 font-semibold text-sm uppercase tracking-widest fade-up">Why VibeMeet</span>
            <h2 className="text-4xl md:text-5xl font-black mt-2 mb-4">Built for <span className="gradient-text">real humans</span></h2>
            <p className="text-slate-400 max-w-xl mx-auto">Every feature is designed to remove friction and help you form genuine connections instantly.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard delay={0.1} icon={<Video className="w-7 h-7 text-pink-400" />} title="Real 1-to-1 Video" desc="No fake profiles or endless messaging. See who you are talking to instantly in HD quality with ultra-low latency." color="#ec4899" />
            <FeatureCard delay={0.2} icon={<Heart className="w-7 h-7 text-purple-400" />} title="Preference-Based Matching" desc="Our engine matches you with compatible partners in seconds according to your desired vibes." color="#a855f7" />
            <FeatureCard delay={0.3} icon={<Shield className="w-7 h-7 text-blue-400" />} title="AI Safety First" desc="Real-time privacy-conscious moderation keeps the community safe with zero tolerance for misconduct." color="#3b82f6" />
            <FeatureCard delay={0.4} icon={<Zap className="w-7 h-7 text-yellow-400" />} title="Instant Matching" desc="Instant matching with your preferred vibes. No waiting rooms, no swiping — just immediate connection." color="#facc15" />
            <FeatureCard delay={0.5} icon={<Users className="w-7 h-7 text-emerald-400" />} title="Global Community" desc="Connect with verified users from across the globe. Expand your horizons from the comfort of your home." color="#34d399" />
            <FeatureCard delay={0.6} icon={<Star className="w-7 h-7 text-orange-400" />} title="Premium Experience" desc="Crystal-clear audio, HD video, and a silky-smooth interface that makes every conversation unforgettable." color="#fb923c" />
          </div>
        </div>

        {/* How it works */}
        <div id="how-it-works" className="w-full max-w-4xl mb-28 scroll-mt-20">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14 fade-up">
            <span className="text-blue-400 font-semibold text-sm uppercase tracking-widest">Simple Process</span>
            <h2 className="text-4xl md:text-5xl font-black mt-2">How it <span className="gradient-text">works</span></h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Create Profile", desc: "Register with your email, verify your account, and set your vibe in under 60 seconds.", color: "#ec4899" },
              { step: "02", title: "Get Matched", desc: "Our matchmaking engine pairs you with genuine verified participants ready to talk.", color: "#a855f7" },
              { step: "03", title: "Start Vibing", desc: "Jump straight into a live video call. No awkward intros — just real conversation.", color: "#3b82f6" },
            ].map((item, i) => (
              <motion.div key={item.step} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.15 }} className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black" style={{ background: `linear-gradient(135deg, ${item.color}40, ${item.color}15)`, border: `1px solid ${item.color}40`, color: item.color }}>{item.step}</div>
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA card */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="glass-panel w-full max-w-3xl rounded-3xl p-12 flex flex-col items-center text-center gap-6 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(236,72,153,0.12) 0%, transparent 70%)" }} />
          <Logo3D size={160} className="relative z-10" />
          <h2 className="text-3xl md:text-4xl font-black relative z-10">Ready to find your <span className="gradient-text">vibe?</span></h2>
          <p className="text-slate-400 max-w-md relative z-10">Have genuine conversations right now. It's free, it's safe — it's VibeMeet.</p>
          <Link to="/login" className="btn-shimmer relative overflow-hidden inline-flex items-center gap-2 px-10 py-4 rounded-full font-bold text-white text-lg transition-transform hover:scale-105 active:scale-95 z-10" style={{ background: "linear-gradient(135deg, #ec4899, #8b5cf6)", boxShadow: "0 0 40px rgba(236,72,153,0.4)" }}>
            <Sparkles className="w-5 h-5" />
            Get Started — Free
          </Link>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 mt-16">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <Logo3D size={120} animate={false} />
            </div>
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
              <button onClick={() => openInfoModal('about')} className="hover:text-pink-400 transition-colors">About</button>
              <button onClick={() => openInfoModal('safety')} className="hover:text-pink-400 transition-colors">Safety</button>
              <button onClick={() => openInfoModal('guidelines')} className="hover:text-pink-400 transition-colors">Guidelines</button>
              <button onClick={() => openInfoModal('terms')} className="hover:text-pink-400 transition-colors font-medium">Terms &amp; Conditions</button>
              <button onClick={() => openInfoModal('privacy')} className="hover:text-pink-400 transition-colors font-medium">Privacy Policy</button>
              <button onClick={() => openInfoModal('contact')} className="hover:text-pink-400 transition-colors">Contact</button>
            </nav>
            <div className="text-slate-600 text-xs text-center md:text-right">
              &copy; 2026 VibeMeet Inc.<br />Direct contact: <a href="mailto:logiterax@gmail.com" className="text-slate-400 hover:text-pink-400 transition-colors">logiterax@gmail.com</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Info Modal Window for About, Safety, Guidelines, Terms, Privacy, Contact */}
      <InfoModal
        isOpen={infoModalOpen}
        activeTab={activeInfoTab}
        onClose={() => setInfoModalOpen(false)}
        onTabChange={setActiveInfoTab}
      />

      {/* Share Sheet Modal */}
      {showShare && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
          onClick={() => setShowShare(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl p-6 relative"
            style={{
              background: 'linear-gradient(145deg, #0f1223, #1a0d2e)',
              border: '1px solid rgba(236,72,153,0.25)',
              boxShadow: '0 0 60px rgba(139,92,246,0.3), 0 30px 60px rgba(0,0,0,0.5)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setShowShare(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <X className="w-4 h-4 text-slate-400" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}>
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black">Share VibeMeet</h3>
                <p className="text-xs text-slate-500">Invite friends to join the platform</p>
              </div>
            </div>

            {/* Preview message box */}
            <div className="my-4 p-3.5 rounded-2xl text-xs leading-relaxed" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(148,163,184,0.9)' }}>
              🎯 <strong className="text-pink-300">VibeMeet</strong> — No Swipes. Just Connections.<br />
              Meet real people face-to-face in AI-powered video conversations.<br />
              <span className="text-purple-400 font-mono">{shareUrl}</span>
            </div>

            {/* Share channels */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {shareChannels.map(ch => (
                <a
                  key={ch.name}
                  href={ch.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all hover:scale-105 active:scale-95"
                  style={{ background: `${ch.color}18`, border: `1px solid ${ch.color}35` }}
                >
                  <span className="text-2xl leading-none">{ch.icon}</span>
                  <span className="text-[10px] font-bold text-center" style={{ color: ch.color }}>{ch.name}</span>
                </a>
              ))}
            </div>

            {/* Copy link */}
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all"
              style={{
                background: copied ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.12)'}`,
                color: copied ? '#34d399' : 'rgba(255,255,255,0.8)',
              }}
            >
              <span className="flex items-center gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Link copied!' : 'Copy link'}
              </span>
              <span className="font-mono text-xs truncate max-w-[140px]" style={{ color: 'rgba(148,163,184,0.6)' }}>{shareUrl}</span>
            </button>

            <p className="text-center text-[10px] text-slate-600 mt-4">Share with friends and help grow our community 🌟</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
