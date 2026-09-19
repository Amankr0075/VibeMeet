import React, { useState, useEffect } from 'react';
import { 
  X, Info, Shield, BookOpen, FileText, Lock, Mail, Copy, Check, 
  Send, AlertCircle, CheckCircle2, BadgeCheck, EyeOff, Radio, UserCheck, ShieldCheck
} from 'lucide-react';
import { Logo3D } from './Logo3D';
import { apiUrl } from '../config/api';

export type InfoModalTab = 'about' | 'safety' | 'guidelines' | 'terms' | 'privacy' | 'contact';

interface InfoModalProps {
  isOpen: boolean;
  activeTab: InfoModalTab;
  onClose: () => void;
  onTabChange: (tab: InfoModalTab) => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  activeTab,
  onClose,
  onTabChange
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactCategory, setContactCategory] = useState<'GENERAL' | 'SAFETY' | 'TECHNICAL' | 'LEGAL' | 'PARTNERSHIP'>('GENERAL');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setContactSuccess(null);
      setContactError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('logiterax@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    setContactError(null);
    setContactSuccess(null);

    try {
      const res = await fetch(apiUrl('/api/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          category: contactCategory,
          subject: contactSubject,
          message: contactMessage
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message.');
      }

      setContactSuccess(data.message || 'Thank you! Your message was sent and an auto-responder confirmation was dispatched.');
      setContactSubject('');
      setContactMessage('');
    } catch (err: any) {
      setContactError(err.message);
    } finally {
      setContactLoading(false);
    }
  };

  const tabs: { id: InfoModalTab; label: string; icon: React.ReactNode }[] = [
    { id: 'about', label: 'About', icon: <Info size={16} /> },
    { id: 'safety', label: 'Safety', icon: <Shield size={16} /> },
    { id: 'guidelines', label: 'Guidelines', icon: <BookOpen size={16} /> },
    { id: 'terms', label: 'Terms', icon: <FileText size={16} /> },
    { id: 'privacy', label: 'Privacy', icon: <Lock size={16} /> },
    { id: 'contact', label: 'Contact', icon: <Mail size={16} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-4xl h-[88vh] max-h-[800px] flex flex-col rounded-3xl border border-white/10 bg-slate-900/95 shadow-2xl text-white overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <Logo3D size={38} animate={false} />
            <div>
              <span className="font-extrabold text-base tracking-tight gradient-text">VibeMeet Hub</span>
              <span className="hidden sm:inline-block ml-2 text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                Official Information &amp; Support
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close window"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="px-6 py-3 border-b border-white/5 bg-slate-950/20 flex gap-2 overflow-x-auto scrollbar-none">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20 scale-[1.02]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          
          {/* TAB: ABOUT */}
          {activeTab === 'about' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <span className="text-pink-400 text-xs font-bold uppercase tracking-widest">Our Story &amp; Purpose</span>
                <h2 className="text-3xl font-black mt-1">About <span className="gradient-text">VibeMeet</span></h2>
                <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                  VibeMeet was engineered to solve digital isolation and dating app fatigue by bringing back immediate, spontaneous, face-to-face human chemistry.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
                    <Info size={20} />
                  </div>
                  <h4 className="font-bold text-base text-white">The Anti-Swipe Ethos</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    No superficial photo swipe carousels or fake ghosting. Connect with real individuals on live camera in seconds.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Radio size={20} />
                  </div>
                  <h4 className="font-bold text-base text-white">Ultra-Crisp WebRTC</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Peer-to-peer media transport delivers encrypted, high-definition video and noise-cancelled audio with ultra-low ping.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <UserCheck size={20} />
                  </div>
                  <h4 className="font-bold text-base text-white">Accountability First</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Mandatory email validation and hardware telemetry keep malicious bots, scrapers, and trolls permanently off the network.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-300">
                  <span className="font-bold text-white">Have press or partnership inquiries?</span> Contact our team at <span className="font-mono text-pink-300">logiterax@gmail.com</span>
                </div>
                <button
                  onClick={() => onTabChange('contact')}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-pink-500 hover:bg-pink-600 text-white transition-all shadow-md shadow-pink-500/20 whitespace-nowrap"
                >
                  Write to Us
                </button>
              </div>
            </div>
          )}

          {/* TAB: SAFETY */}
          {activeTab === 'safety' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Built-In Protection</span>
                <h2 className="text-3xl font-black mt-1">Safety <span className="gradient-text">&amp; Security</span></h2>
                <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                  Your privacy and safety are paramount. We deploy comprehensive protections so you can connect with confidence.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex gap-4 items-start">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                    <BadgeCheck size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">1. Verified Membership Only</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Every single member must confirm their email before entering video matchmaking. Throwaway troll accounts and spammers are eliminated before matching begins.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex gap-4 items-start">
                  <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
                    <EyeOff size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">2. Zero Video or Audio Recording</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      All video and audio connections are strictly peer-to-peer via encrypted WebRTC. VibeMeet never records, stores, or saves any live video streams on any servers.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex gap-4 items-start">
                  <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">3. 1-Click Instant Reporting &amp; Ban Enforcer</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      If any participant displays inappropriate or offensive behavior, click Report to instantly sever the connection. Our automated systems and human moderators take swift disciplinary action.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex gap-4 items-start">
                  <div className="p-2.5 rounded-xl bg-pink-500/20 text-pink-400 shrink-0">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">4. Total Hardware &amp; Skip Control</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Camera and microphone permissions are only activated when you actively search for a match. You can mute, turn off your camera, or skip immediately at any second.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between gap-4">
                <div className="text-xs text-emerald-200">
                  <span className="font-bold text-white">Trust &amp; Safety Desk:</span> Direct emergency reports to <a href="mailto:logiterax@gmail.com" className="font-mono text-emerald-300 underline">logiterax@gmail.com</a>
                </div>
                <button
                  onClick={() => onTabChange('contact')}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                >
                  Report Issue
                </button>
              </div>
            </div>
          )}

          {/* TAB: GUIDELINES */}
          {activeTab === 'guidelines' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest">Standards &amp; Rules</span>
                <h2 className="text-3xl font-black mt-1">Community <span className="gradient-text">Guidelines</span></h2>
                <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                  By joining VibeMeet, you commit to maintaining a courteous, respectful, and safe environment for all members.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center shrink-0">1</div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Mutual Respect &amp; Civility</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Treat every match with warmth and courtesy. Harassment, racism, hate speech, bullying, or bigotry of any kind will trigger an immediate, permanent hardware and account ban.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 font-bold flex items-center justify-center shrink-0">2</div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Strict Prohibition on Nudity &amp; Adult Content</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      VibeMeet is an 18+ social conversation platform, NOT an adult webcam site. Explicit nudity, sexual gestures, obscene displays, or solicitation will result in an instant zero-tolerance ban.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0">3</div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Consent &amp; Personal Privacy</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Never record, screenshot, broadcast, or share another member's video feed or private disclosures without their explicit consent. Violating another user's privacy is illegal.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center shrink-0">4</div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Authentic Live Human Presence</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      You must be live on camera yourself. Using virtual camera software, looping video clips, still images, AI avatars, or impersonating others is strictly prohibited.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300">
                Need to appeal a suspension or flag an infraction? Contact our review panel at <a href="mailto:logiterax@gmail.com" className="text-pink-400 font-mono underline">logiterax@gmail.com</a>.
              </div>
            </div>
          )}

          {/* TAB: TERMS & CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <span className="text-purple-400 text-xs font-bold uppercase tracking-widest">Legal Agreement</span>
                <h2 className="text-3xl font-black mt-1">Terms <span className="gradient-text">&amp; Conditions</span></h2>
                <p className="text-slate-400 text-xs mt-1">Last updated: September 2026 &bull; Official contact: logiterax@gmail.com</p>
              </div>

              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="font-bold text-white text-sm mb-1">1. Acceptance of Terms</h4>
                  <p>By creating an account or accessing VibeMeet, you affirm that you are at least 18 years old and agree to be bound by these Terms. If you do not agree, discontinue use immediately.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="font-bold text-white text-sm mb-1">2. Age Eligibility</h4>
                  <p>You must be at least 18 years of age. VibeMeet reserves the absolute right to terminate accounts suspected of belonging to minors.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="font-bold text-white text-sm mb-1">3. Prohibited Conduct</h4>
                  <p>Prohibited actions include: harassment, unsolicited commercial advertising, nudity, hate speech, unlawful recording, or any act compromising the safety of members.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="font-bold text-white text-sm mb-1">4. Real-Time Telemetry &amp; Privacy</h4>
                  <p>All video calls are peer-to-peer. VibeMeet does NOT record or store live video or audio feeds.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="font-bold text-white text-sm mb-1">5. Account Termination</h4>
                  <p>We reserve the right to suspend or permanently ban accounts violating these terms with or without notice.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="font-bold text-white text-sm mb-1">6. Contact for Legal Notices</h4>
                  <p>Direct all legal inquiries to: <a href="mailto:logiterax@gmail.com" className="text-pink-400 font-mono">logiterax@gmail.com</a></p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">Data Protection &amp; Security</span>
                <h2 className="text-3xl font-black mt-1">Privacy <span className="gradient-text">Policy</span></h2>
                <p className="text-slate-400 text-xs mt-1">Last updated: September 2026 &bull; DPO Contact: logiterax@gmail.com</p>
              </div>

              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="font-bold text-white text-sm mb-1">1. Information We Collect</h4>
                  <p>We collect your account email, display name, gender preferences, and telemetry necessary to establish encrypted WebRTC peer-to-peer video sessions.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="font-bold text-white text-sm mb-1">2. Video and Audio Privacy</h4>
                  <p>Your video and audio streams travel directly between matched participants. VibeMeet servers never record, intercept, or store your private conversations.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="font-bold text-white text-sm mb-1">3. Third-Party Sharing</h4>
                  <p>We do not sell, rent, or monetize your personal information to advertisers. Data is strictly processed for authentication and service provision.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="font-bold text-white text-sm mb-1">4. Right to Deletion</h4>
                  <p>You may request complete account and data erasure at any time by contacting our Data Protection Officer at: <a href="mailto:logiterax@gmail.com" className="text-pink-400 font-mono">logiterax@gmail.com</a></p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CONTACT & SUPPORT (WITH AUTO-RESPONDER) */}
          {activeTab === 'contact' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <span className="text-pink-400 text-xs font-bold uppercase tracking-widest">Connect Directly</span>
                <h2 className="text-3xl font-black mt-1">Contact <span className="gradient-text">Us</span></h2>
                <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                  Have an issue, feedback, or need assistance? Reach us directly or send a message below to receive our <strong>instant auto-responder</strong> and 24-hour team response.
                </p>
              </div>

              {/* Direct Email Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-tr from-pink-500/10 via-purple-500/10 to-blue-500/10 border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                    <Mail size={22} />
                  </div>
                  <div>
                    <p className="text-xs uppercase font-bold text-pink-400 tracking-wider">Official Email Channel</p>
                    <p className="text-base font-bold text-white font-mono">logiterax@gmail.com</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyEmail}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 border border-white/10 flex items-center gap-2 transition-all"
                  >
                    {copiedEmail ? <><Check size={14} className="text-emerald-400" /> Copied!</> : <><Copy size={14} /> Copy</>}
                  </button>
                  <a
                    href="mailto:logiterax@gmail.com"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-95 text-white transition-all flex items-center gap-1.5"
                  >
                    <Send size={13} /> Open Mail App
                  </a>
                </div>
              </div>

              {/* Inbuilt Contact & Autoresponder Form */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Send size={18} className="text-pink-400" /> Send Message Online (Instant Auto-Responder)
                </h4>

                {contactSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-200 text-xs flex items-start gap-2.5">
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Message Dispatched!</p>
                      <p className="mt-0.5">{contactSuccess}</p>
                    </div>
                  </div>
                )}

                {contactError && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-200 text-xs flex items-start gap-2.5">
                    <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                    <span>{contactError}</span>
                  </div>
                )}

                <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block text-slate-300 font-semibold uppercase tracking-wider">
                      Your Full Name
                      <input
                        type="text"
                        value={contactName}
                        onChange={e => setContactName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="auth-input text-xs mt-1.5"
                      />
                    </label>

                    <label className="block text-slate-300 font-semibold uppercase tracking-wider">
                      Your Email (receives auto-responder)
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={e => setContactEmail(e.target.value)}
                        placeholder="you@domain.com"
                        required
                        className="auth-input text-xs mt-1.5"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block text-slate-300 font-semibold uppercase tracking-wider">
                      Category
                      <select
                        value={contactCategory}
                        onChange={e => setContactCategory(e.target.value as any)}
                        className="auth-input text-xs mt-1.5 bg-slate-900"
                      >
                        <option value="GENERAL">General Inquiries</option>
                        <option value="SAFETY">Safety &amp; Abuse Report</option>
                        <option value="TECHNICAL">Technical Support</option>
                        <option value="LEGAL">Legal &amp; Privacy</option>
                        <option value="PARTNERSHIP">Partnership / Press</option>
                      </select>
                    </label>

                    <label className="block text-slate-300 font-semibold uppercase tracking-wider">
                      Subject
                      <input
                        type="text"
                        value={contactSubject}
                        onChange={e => setContactSubject(e.target.value)}
                        placeholder="Brief summary of your request"
                        required
                        className="auth-input text-xs mt-1.5"
                      />
                    </label>
                  </div>

                  <label className="block text-slate-300 font-semibold uppercase tracking-wider">
                    Detailed Message
                    <textarea
                      rows={4}
                      value={contactMessage}
                      onChange={e => setContactMessage(e.target.value)}
                      placeholder="Explain how we can help you..."
                      required
                      className="auth-input text-xs mt-1.5 resize-none"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={contactLoading}
                    className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-95 text-white shadow-lg shadow-pink-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {contactLoading ? 'Dispatching Message...' : 'Send Message & Receive Confirmation'}
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
