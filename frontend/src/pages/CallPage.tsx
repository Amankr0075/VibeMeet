/**
 * CallPage.tsx — Full-screen WebRTC video call page for VibeMeet
 *
 * Route: /call/:roomId
 *
 * Responsibilities:
 *  - Establishes a Socket.IO connection (inherits token from AuthContext)
 *  - Manages WebRTC peer lifecycle (offer / answer / ICE via simple-peer)
 *  - Renders local PiP + remote full-bleed video
 *  - In-call chat panel with live Socket.IO delivery
 *  - AI safety warning banners (from server via socket events)
 *  - Control dock: mute, camera, chat, end-call, next-person
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import Peer, { type SignalData } from 'simple-peer';
import {
  Video, VideoOff, Mic, MicOff, MessageCircle, PhoneOff,
  AlertTriangle, Send, X, Sparkles, ChevronRight, Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSocketUrl } from '../config/api';
import { checkMessageRiskLocally } from '../ai/moderationService';
import '../styles/call.css';

// ── ICE Servers ───────────────────────────────────────────────────────────────
const fallbackTurnServer: RTCIceServer = {
  urls: [
    'turn:openrelay.metered.ca:80',
    'turn:openrelay.metered.ca:80?transport=tcp',
    'turn:openrelay.metered.ca:443?transport=tcp',
    'turns:openrelay.metered.ca:443?transport=tcp',
  ],
  username: 'openrelayproject',
  credential: 'openrelayproject',
};
const iceServers: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  ...(import.meta.env.VITE_TURN_URL
    ? [{
        urls: import.meta.env.VITE_TURN_URL as string,
        username: import.meta.env.VITE_TURN_USERNAME as string,
        credential: import.meta.env.VITE_TURN_CREDENTIAL as string,
      }]
    : [fallbackTurnServer]),
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface ChatMsg { senderId: string; message: string; timestamp: Date; }
type Status = 'CONNECTING' | 'MATCHED' | 'IN_CALL' | 'ENDED';

// ── Particle background (reused from MatchPage aesthetic) ─────────────────────
const LiveAtmosphere: React.FC = () => {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${(i * 5.2 + 4) % 94}%`,
    top: `${(i * 7.3 + 6) % 92}%`,
    size: (i % 3) + 2,
    duration: `${7 + (i % 5)}s`,
    delay: `${(i * 0.5) % 4}s`,
    color: i % 3 === 0 ? 'rgba(236,72,153,0.65)' : i % 3 === 1 ? 'rgba(168,85,247,0.65)' : 'rgba(59,130,246,0.65)',
  }));
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <div className="aurora-1 absolute w-[60vw] h-[60vw] rounded-full opacity-20 -top-24 -left-24 bg-radial from-pink-600/50 via-purple-800/25 to-transparent blur-3xl" />
      <div className="aurora-2 absolute w-[50vw] h-[50vw] rounded-full opacity-15 -bottom-24 -right-24 bg-radial from-indigo-600/40 via-purple-900/20 to-transparent blur-3xl" />
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left, top: p.top,
            width: `${p.size}px`, height: `${p.size}px`,
            background: p.color, boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            animationDuration: p.duration, animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const CallPage: React.FC = () => {
  const { roomId: routeRoomId } = useParams<{ roomId: string }>();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [status, setStatus] = useState<Status>('CONNECTING');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<Peer.Instance | null>(null);
  const pendingCandidatesRef = useRef<SignalData[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const roomId = routeRoomId!;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setLocalStream(null);
  }, []);

  const initMedia = useCallback(async (): Promise<MediaStream | null> => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaError('Your browser does not support camera/microphone access.');
      return null;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = s;
      setLocalStream(s);
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = s;
        myVideoRef.current.play().catch(() => {});
      }
      return s;
    } catch (err: any) {
      // Fallback: video only
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = s;
        setLocalStream(s);
        setIsAudioOn(false);
        setMediaError('Microphone unavailable — connected with video only.');
        if (myVideoRef.current) myVideoRef.current.srcObject = s;
        return s;
      } catch {
        setMediaError(
          err?.name === 'NotAllowedError'
            ? 'Camera & microphone access was denied. Allow camera in browser settings and reload.'
            : 'Camera/microphone access failed.',
        );
        return null;
      }
    }
  }, []);

  const destroyPeer = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    pendingCandidatesRef.current = [];
  }, []);

  const endCallCleanup = useCallback(() => {
    destroyPeer();
    stopTracks();
    setRemoteStream(null);
    setStatus('ENDED');
  }, [destroyPeer, stopTracks]);

  // ── Socket + WebRTC setup ─────────────────────────────────────────────────
  useEffect(() => {
    if (!token) { navigate('/login'); return; }

    const socket = io(getSocketUrl(), {
      auth: { token },
      extraHeaders: { 'ngrok-skip-browser-warning': 'true' },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    // ── Boot sequence ──────────────────────────────────────────────────────
    const boot = async () => {
      const stream = await initMedia();
      if (!stream) return;

      // Join the room and announce readiness
      socket.emit('peer-ready', { roomId });
    };

    socket.on('connect', boot);

    // ── Initiator: server tells us to make the offer ───────────────────────
    socket.on('initiate-call', () => {
      const s = streamRef.current;
      if (!s) return;

      destroyPeer();
      const peer = new Peer({ initiator: true, trickle: true, stream: s, config: { iceServers } });

      peer.on('signal', (sig: SignalData) => {
        if ((sig as any).type === 'offer') {
          socket.emit('call-offer', { offer: sig, roomId });
        } else {
          socket.emit('ice-candidate', { candidate: sig, roomId });
        }
      });

      peer.on('stream', (remote: MediaStream) => {
        setRemoteStream(remote);
        setStatus('IN_CALL');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remote;
          remoteVideoRef.current.play().catch(() => {});
        }
      });

      peer.on('error', (e) => { console.error('Peer error (init):', e); endCallCleanup(); });
      peer.on('close', () => endCallCleanup());
      peerRef.current = peer;
    });

    // ── Receiver: got an SDP offer ────────────────────────────────────────
    socket.on('call-offer', (data: { offer: SignalData; roomId: string }) => {
      const s = streamRef.current;
      if (!s) return;

      if ((data.offer as any).type === 'candidate' || (data.offer as any).candidate) {
        if (peerRef.current) {
          try { peerRef.current.signal(data.offer); } catch (e) { console.warn(e); }
        } else {
          pendingCandidatesRef.current.push(data.offer);
        }
        return;
      }

      destroyPeer();
      const peer = new Peer({ initiator: false, trickle: true, stream: s, config: { iceServers } });

      peer.on('signal', (sig: SignalData) => {
        if ((sig as any).type === 'answer') {
          socket.emit('call-answer', { answer: sig, roomId });
        } else {
          socket.emit('ice-candidate', { candidate: sig, roomId });
        }
      });

      peer.on('stream', (remote: MediaStream) => {
        setRemoteStream(remote);
        setStatus('IN_CALL');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remote;
          remoteVideoRef.current.play().catch(() => {});
        }
      });

      peer.on('error', (e) => { console.error('Peer error (recv):', e); endCallCleanup(); });
      peer.on('close', () => endCallCleanup());
      peerRef.current = peer;

      try { peer.signal(data.offer); } catch (e) { console.error(e); }

      pendingCandidatesRef.current.forEach((c) => {
        try { peer.signal(c); } catch (e) { console.warn(e); }
      });
      pendingCandidatesRef.current = [];
    });

    socket.on('call-answer', (data: { answer: SignalData }) => {
      if (peerRef.current && data.answer) {
        try { peerRef.current.signal(data.answer); } catch (e) { console.error(e); }
      }
    });

    socket.on('ice-candidate', (data: { candidate: SignalData }) => {
      if (!data?.candidate) return;
      if (peerRef.current) {
        try { peerRef.current.signal(data.candidate); } catch (e) { console.warn(e); }
      } else {
        pendingCandidatesRef.current.push(data.candidate);
      }
    });

    socket.on('call-ended', () => endCallCleanup());

    socket.on('chat-message', (data: ChatMsg) => {
      setMessages(prev => [...prev, data]);
    });

    socket.on('safety-warning', (data: { message: string }) => {
      setSafetyWarning(data.message);
    });

    socket.on('account-restricted', () => {
      alert('Your account has been restricted due to a safety policy violation.');
      logout();
      navigate('/');
    });

    return () => {
      destroyPeer();
      stopTracks();
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Bind remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  // ── Controls ───────────────────────────────────────────────────────────────
  const toggleVideo = () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !isVideoOn; setIsVideoOn(!isVideoOn); }
  };

  const toggleAudio = () => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !isAudioOn; setIsAudioOn(!isAudioOn); }
  };

  const endCall = () => {
    socketRef.current?.emit('end-call', { roomId });
    endCallCleanup();
  };

  const nextPerson = () => {
    socketRef.current?.emit('end-call', { roomId });
    destroyPeer();
    stopTracks();
    setRemoteStream(null);
    setMessages([]);
    setSafetyWarning(null);
    navigate('/dashboard');
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = currentMessage.trim();
    if (!msg || !socketRef.current) return;

    // Optimistic local risk check
    const localCheck = checkMessageRiskLocally(msg);
    if (localCheck.flagged && localCheck.riskLevel === 'HIGH') {
      setSafetyWarning(localCheck.reason);
    }

    socketRef.current.emit('chat-message', { message: msg, roomId });
    setCurrentMessage('');
  };

  // ── "Call Ended" screen ───────────────────────────────────────────────────
  if (status === 'ENDED') {
    return (
      <div className="call-shell">
        <LiveAtmosphere />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
          <div className="w-20 h-20 rounded-3xl bg-slate-800/80 border border-white/10 flex items-center justify-center mb-5 shadow-2xl">
            <PhoneOff className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Call Ended</h2>
          <p className="text-slate-400 text-sm mb-8">Hope you had a great vibe! Ready for another match?</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-3 rounded-full font-bold text-sm bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white shadow-lg shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all"
            >
              Find Next Match
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 rounded-full font-bold text-sm bg-white/10 hover:bg-white/15 text-slate-300 border border-white/15 hover:scale-105 active:scale-95 transition-all"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="call-shell">
      <LiveAtmosphere />

      {/* ── Remote video (full-bleed) ──────────────────────────────────────── */}
      <div className="absolute inset-0 z-0 bg-slate-950">
        {status === 'IN_CALL' && remoteStream ? (
          <>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="call-remote-video"
            />
            {/* Live badge */}
            <div className="absolute top-4 left-4 z-20">
              <span className="live-badge">
                <span className="live-badge__dot" />
                Live Video Active
              </span>
            </div>
          </>
        ) : (
          // Connecting / Matched overlay
          <div className="call-connecting">
            <div className="w-24 h-24 rounded-3xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mb-5 shadow-2xl shadow-emerald-500/25">
              <Sparkles className="w-12 h-12 text-emerald-400 animate-spin" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">
              {status === 'MATCHED' ? 'Match Found!' : 'Connecting...'}
            </h2>
            <p className="text-slate-400 text-sm max-w-xs text-center">
              {status === 'MATCHED'
                ? 'Establishing secure peer-to-peer video stream...'
                : 'Initialising your camera and connecting to the room...'}
            </p>
            {mediaError && (
              <div className="mt-5 flex items-start gap-3 max-w-sm bg-amber-500/10 border border-amber-400/30 text-amber-200 px-4 py-3 rounded-2xl text-xs text-left">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <p>{mediaError}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Local video PiP ───────────────────────────────────────────────── */}
      {localStream && (
        <div className="call-pip z-20">
          <video
            ref={myVideoRef}
            autoPlay
            playsInline
            muted
            className={!isVideoOn ? 'opacity-0' : ''}
          />
          {!isVideoOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-400 text-xs">
              <VideoOff className="w-5 h-5 mb-1 text-red-400" />
              Camera Off
            </div>
          )}
          <div className="pip-label">You</div>
        </div>
      )}

      {/* ── Safety warning toast ───────────────────────────────────────────── */}
      {safetyWarning && (
        <div className="safety-toast z-35">
          <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm mb-0.5">Safety Warning</p>
            <p className="text-red-200/90 leading-relaxed">{safetyWarning}</p>
          </div>
          <button
            onClick={() => setSafetyWarning(null)}
            className="text-red-300/60 hover:text-white transition-colors ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Chat sidebar ──────────────────────────────────────────────────── */}
      {isChatOpen && status === 'IN_CALL' && (
        <div className="call-chat z-20">
          {/* Header */}
          <div className="call-chat__header">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-pink-400" />
              <span className="text-sm font-bold">Live Chat</span>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="call-chat__messages">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs text-center py-8">
                <Sparkles className="w-5 h-5 mb-2 opacity-40" />
                Break the ice — say hello!
              </div>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={`chat-bubble ${m.senderId === user?._id ? 'chat-bubble--mine' : 'chat-bubble--theirs'}`}
                >
                  {m.message}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="call-chat__input-row">
            <input
              id="chat-input"
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Send a positive message..."
              className="call-chat__input"
              autoComplete="off"
            />
            <button type="submit" className="call-chat__send" title="Send">
              <Send className="w-4 h-4 text-white" />
            </button>
          </form>
        </div>
      )}

      {/* ── Header bar ────────────────────────────────────────────────────── */}
      <header className="relative z-30 px-5 py-3 flex items-center justify-between border-b border-white/[0.07] bg-slate-950/60 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <span className="text-base font-black tracking-tight text-white">VibeMeet</span>
          {status === 'IN_CALL' && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              In Live Call
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          AI Safety Active
        </div>
      </header>

      {/* ── Bottom control dock ───────────────────────────────────────────── */}
      {(status === 'IN_CALL' || status === 'MATCHED') && (
        <div className="call-controls">
          <div className="call-controls-inner">

            {/* Mute */}
            <button
              id="toggle-audio-btn"
              onClick={toggleAudio}
              className={`ctrl-btn ${isAudioOn ? 'ctrl-btn--neutral' : 'ctrl-btn--muted'}`}
              title={isAudioOn ? 'Mute Mic' : 'Unmute Mic'}
            >
              {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            {/* Camera */}
            <button
              id="toggle-video-btn"
              onClick={toggleVideo}
              className={`ctrl-btn ${isVideoOn ? 'ctrl-btn--neutral' : 'ctrl-btn--muted'}`}
              title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            {/* Chat */}
            <button
              id="toggle-chat-btn"
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`ctrl-btn ${isChatOpen ? 'ctrl-btn--chat-active' : 'ctrl-btn--neutral'}`}
              title="Toggle Chat"
            >
              <MessageCircle className="w-5 h-5" />
            </button>

            {/* End Call */}
            <button
              id="end-call-btn"
              onClick={endCall}
              className="ctrl-btn ctrl-btn--danger"
              title="End Call"
            >
              <PhoneOff className="w-5 h-5" />
            </button>

            {/* Next Person */}
            <button
              id="next-person-btn"
              onClick={nextPerson}
              className="ctrl-btn--next"
            >
              Next Person <ChevronRight className="inline w-4 h-4 -mt-0.5" />
            </button>

          </div>
        </div>
      )}
    </div>
  );
};

export default CallPage;
