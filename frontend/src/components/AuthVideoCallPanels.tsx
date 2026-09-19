import React from 'react';
import { Sparkles, Video, Mic, Volume2, Heart, MessageCircle, ShieldCheck } from 'lucide-react';

export const GirlVideoCallCard: React.FC = () => {
  return (
    <div className="hidden xl:flex flex-col w-[310px] 2xl:w-[340px] shrink-0 select-none animate-in fade-in slide-in-from-left duration-700">
      {/* Floating call container */}
      <div className="relative rounded-[2.2rem] p-3 bg-gradient-to-b from-pink-500/25 via-purple-500/10 to-indigo-500/20 border border-pink-500/30 shadow-[0_20px_60px_rgba(236,72,153,0.18)] backdrop-blur-2xl group transition-transform duration-500 hover:-translate-y-1">
        
        {/* Ambient Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/30 to-purple-600/30 rounded-[2.4rem] blur-xl opacity-60 -z-10 group-hover:opacity-90 transition-opacity" />

        {/* Video feed viewport */}
        <div className="relative aspect-[3/4] w-full rounded-[1.8rem] overflow-hidden bg-slate-900 border border-white/10 shadow-inner">
          <img
            src="/images/auth-girl-call.jpg"
            alt="Girl talking on VibeMeet video call"
            className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
          />

          {/* Top Live Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-xs font-semibold text-white shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="w-2 h-2 -ml-3.5 rounded-full bg-emerald-400" />
              <span>LIVE • 1080p</span>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-pink-500/80 backdrop-blur-md text-[11px] font-bold text-white shadow-md flex items-center gap-1">
              <Sparkles size={12} />
              <span>98% Match</span>
            </div>
          </div>

          {/* Floating speech bubble reaction */}
          <div className="absolute top-16 right-4 z-10 max-w-[200px] px-3.5 py-2 rounded-2xl rounded-tr-sm bg-black/70 backdrop-blur-md border border-pink-400/40 text-xs font-medium text-pink-100 shadow-xl flex items-center gap-2 animate-bounce [animation-duration:3s]">
            <Heart size={14} className="text-pink-400 fill-pink-400 shrink-0" />
            <span>"I love this playlist! What's the artist?"</span>
          </div>

          {/* Connected audio waveforms & bottom user tag */}
          <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-2.5 z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-white font-bold text-base drop-shadow-sm">Maya</h3>
                  <span className="text-slate-300 text-xs">22</span>
                  <span className="inline-flex items-center text-[10px] text-pink-300 bg-pink-500/20 px-1.5 py-0.5 rounded border border-pink-400/30 font-medium">
                    Verified
                  </span>
                </div>
                <p className="text-slate-300 text-xs flex items-center gap-1 mt-0.5">
                  <span>🎨 Design & Anime</span>
                </p>
              </div>

              {/* Dynamic Sound Wave visual */}
              <div className="flex items-end gap-0.5 h-5 px-2 py-1 rounded-lg bg-white/10 backdrop-blur-md">
                <span className="w-1 bg-pink-400 rounded-full h-2 animate-pulse" />
                <span className="w-1 bg-pink-400 rounded-full h-4 animate-pulse [animation-delay:150ms]" />
                <span className="w-1 bg-pink-400 rounded-full h-5 animate-pulse [animation-delay:300ms]" />
                <span className="w-1 bg-pink-400 rounded-full h-3 animate-pulse [animation-delay:450ms]" />
              </div>
            </div>

            {/* In-call controls aesthetic */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-slate-300 text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <Mic size={13} />
                <span>Microphone active</span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <Video size={13} className="text-pink-400" />
                <span>VibeMeet Cam</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom card caption */}
        <div className="mt-3 px-2 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" /> End-to-end encrypted
          </span>
          <span className="text-pink-300/80 font-medium">Vibe Cam Active</span>
        </div>
      </div>
    </div>
  );
};

export const BoyVideoCallCard: React.FC = () => {
  return (
    <div className="hidden xl:flex flex-col w-[310px] 2xl:w-[340px] shrink-0 select-none animate-in fade-in slide-in-from-right duration-700">
      {/* Floating call container */}
      <div className="relative rounded-[2.2rem] p-3 bg-gradient-to-b from-indigo-500/25 via-purple-500/10 to-pink-500/20 border border-indigo-500/30 shadow-[0_20px_60px_rgba(99,102,241,0.18)] backdrop-blur-2xl group transition-transform duration-500 hover:-translate-y-1">
        
        {/* Ambient Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/30 to-purple-600/30 rounded-[2.4rem] blur-xl opacity-60 -z-10 group-hover:opacity-90 transition-opacity" />

        {/* Video feed viewport */}
        <div className="relative aspect-[3/4] w-full rounded-[1.8rem] overflow-hidden bg-slate-900 border border-white/10 shadow-inner">
          <img
            src="/images/auth-boy-call.jpg"
            alt="Boy talking on VibeMeet video call"
            className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
          />

          {/* Top Live Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-xs font-semibold text-white shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="w-2 h-2 -ml-3.5 rounded-full bg-emerald-400" />
              <span>CONNECTED • 18ms</span>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-indigo-500/80 backdrop-blur-md text-[11px] font-bold text-white shadow-md flex items-center gap-1">
              <Volume2 size={12} />
              <span>HD Audio</span>
            </div>
          </div>

          {/* Floating speech bubble reaction */}
          <div className="absolute top-16 left-4 z-10 max-w-[200px] px-3.5 py-2 rounded-2xl rounded-tl-sm bg-black/70 backdrop-blur-md border border-indigo-400/40 text-xs font-medium text-indigo-100 shadow-xl flex items-center gap-2 animate-bounce [animation-duration:3.2s]">
            <MessageCircle size={14} className="text-indigo-400 shrink-0" />
            <span>"Haha that's crazy! Let me show you the guitar chords."</span>
          </div>

          {/* Connected audio waveforms & bottom user tag */}
          <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-2.5 z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-white font-bold text-base drop-shadow-sm">Alex</h3>
                  <span className="text-slate-300 text-xs">23</span>
                  <span className="inline-flex items-center text-[10px] text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded border border-indigo-400/30 font-medium">
                    Student
                  </span>
                </div>
                <p className="text-slate-300 text-xs flex items-center gap-1 mt-0.5">
                  <span>🎸 Indie Rock & Travel</span>
                </p>
              </div>

              {/* Dynamic Sound Wave visual */}
              <div className="flex items-end gap-0.5 h-5 px-2 py-1 rounded-lg bg-white/10 backdrop-blur-md">
                <span className="w-1 bg-indigo-400 rounded-full h-3 animate-pulse [animation-delay:200ms]" />
                <span className="w-1 bg-indigo-400 rounded-full h-5 animate-pulse [animation-delay:100ms]" />
                <span className="w-1 bg-indigo-400 rounded-full h-2 animate-pulse [animation-delay:400ms]" />
                <span className="w-1 bg-indigo-400 rounded-full h-4 animate-pulse [animation-delay:250ms]" />
              </div>
            </div>

            {/* In-call controls aesthetic */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-slate-300 text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <Mic size={13} />
                <span>Microphone active</span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <Video size={13} className="text-indigo-400" />
                <span>VibeMeet Cam</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom card caption */}
        <div className="mt-3 px-2 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-indigo-400" /> Face-to-Face Match
          </span>
          <span className="text-indigo-300/80 font-medium">Live On VibeMeet</span>
        </div>
      </div>
    </div>
  );
};

export const MobileAuthCallPreview: React.FC = () => {
  return (
    <div className="xl:hidden w-full max-w-lg mb-6 mx-auto animate-in fade-in duration-500">
      <div className="rounded-2xl p-3 bg-white/[0.04] border border-white/10 backdrop-blur-xl flex items-center justify-between gap-3 shadow-lg">
        {/* Girl avatar pill */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-pink-500 shrink-0 shadow-md">
            <img
              src="/images/auth-girl-call.jpg"
              alt="Girl in call"
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">Maya, 22</p>
            <p className="text-[10px] text-pink-300 truncate">Live on VibeMeet</p>
          </div>
        </div>

        {/* Connected pulse center */}
        <div className="flex flex-col items-center px-2 shrink-0">
          <div className="flex items-center gap-1 text-[10px] font-bold text-pink-300 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>IN CALL</span>
          </div>
          <div className="flex items-center gap-0.5 mt-1 text-slate-400">
            <span className="w-1 h-2 bg-pink-400/80 rounded-full animate-pulse" />
            <span className="w-1 h-3 bg-purple-400/80 rounded-full animate-pulse [animation-delay:150ms]" />
            <span className="w-1 h-2 bg-indigo-400/80 rounded-full animate-pulse [animation-delay:300ms]" />
          </div>
        </div>

        {/* Boy avatar pill */}
        <div className="flex items-center gap-2.5 min-w-0 text-right justify-end">
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">Alex, 23</p>
            <p className="text-[10px] text-indigo-300 truncate">Tokyo • Connected</p>
          </div>
          <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-indigo-500 shrink-0 shadow-md">
            <img
              src="/images/auth-boy-call.jpg"
              alt="Boy in call"
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900" />
          </div>
        </div>
      </div>
    </div>
  );
};
