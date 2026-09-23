import React, { useState, useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import Peer, { type SignalData } from 'simple-peer';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  Video, VideoOff, Mic, MicOff, MessageCircle, PhoneOff, AlertTriangle,
  LogOut, User as UserIcon, HelpCircle, Sparkles, Shield, Heart,
  X, Check, Mail, Send, Copy, CheckCheck, Radio, ChevronRight, LayoutDashboard
} from 'lucide-react';
import { Logo3D } from '../components/Logo3D';
import { NotificationBell } from '../components/NotificationBell';
import { apiUrl, getSocketUrl } from '../config/api';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
];

// Development fallback for users on networks that cannot establish a direct
// peer route. Production deployments should override this with private,
// time-limited TURN credentials via the VITE_TURN_* variables below.
const fallbackTurnServer: RTCIceServer = {
  urls: [
    'turn:openrelay.metered.ca:80?transport=tcp',
    'turn:openrelay.metered.ca:443?transport=tcp',
    'turns:openrelay.metered.ca:443?transport=tcp'
  ],
  username: 'openrelayproject',
  credential: 'openrelayproject'
};

const iceServers: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  ...(import.meta.env.VITE_TURN_URL
    ? [{
        urls: import.meta.env.VITE_TURN_URL,
        username: import.meta.env.VITE_TURN_USERNAME,
        credential: import.meta.env.VITE_TURN_CREDENTIAL
      }]
    : [fallbackTurnServer])
];

// Live Particle Background Component
const LiveAtmosphere: React.FC = () => {
  const particles = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    left: `${(i * 4.7 + 3) % 96}%`,
    top: `${(i * 7.9 + 5) % 94}%`,
    size: (i % 3) + 2.5,
    duration: `${6 + (i % 6)}s`,
    delay: `${(i * 0.4) % 4}s`,
    color: i % 3 === 0 ? 'rgba(236,72,153,0.7)' : i % 3 === 1 ? 'rgba(168,85,247,0.7)' : 'rgba(59,130,246,0.7)'
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Dynamic Aurora Meshes */}
      <div className="aurora-1 absolute w-[65vw] h-[65vw] rounded-full opacity-25 -top-28 -left-28 bg-radial from-pink-600/60 via-purple-800/30 to-transparent blur-3xl pointer-events-none" />
      <div className="aurora-2 absolute w-[55vw] h-[55vw] rounded-full opacity-20 -bottom-28 -right-28 bg-radial from-indigo-600/50 via-purple-900/30 to-transparent blur-3xl pointer-events-none" />
      <div className="aurora-3 absolute w-[45vw] h-[45vw] rounded-full opacity-15 top-1/3 left-1/2 -translate-x-1/2 bg-radial from-pink-500/40 via-blue-900/20 to-transparent blur-3xl pointer-events-none" />

      {/* Cyber Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Floating Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            animationDuration: p.duration,
            animationDelay: p.delay
          }}
        />
      ))}
    </div>
  );
};

const MatchPage: React.FC = () => {
  const { user, token, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  // Socket & WebRTC State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'QUEUED' | 'MATCHED' | 'IN_CALL'>('IDLE');

  const peerRef = useRef<Peer.Instance | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const userVideo = useRef<HTMLVideoElement>(null);
  const myVideo = useRef<HTMLVideoElement>(null);

  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);


  // Live Chat
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ senderId: string; message: string; timestamp: Date }[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  // Profile Edit Form State
  const [editUsername, setEditUsername] = useState(user?.username || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editGender, setEditGender] = useState(user?.gender || 'Prefer not to say');
  const [editPreferredGender, setEditPreferredGender] = useState(user?.preferredGender || 'Everyone');
  const [editIsCollegeStudent, setEditIsCollegeStudent] = useState(Boolean(user?.isCollegeStudent));
  const [editInstitutionName, setEditInstitutionName] = useState(user?.institutionName || '');
  const [editPreferredCommunity, setEditPreferredCommunity] = useState(user?.preferredCommunity || 'EVERYONE');
  const [editProfileImage, setEditProfileImage] = useState(user?.profileImage || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize Socket connection
  useEffect(() => {
    const socketUrl = getSocketUrl();
    const newSocket = io(socketUrl, {
      auth: { token },
      // Ngrok's free tunnel serves an HTML warning to HTTP polling requests.
      // A direct WebSocket connection avoids that page and is also the right
      // transport for a Vercel frontend talking to a laptop-hosted backend.
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5
    });
    setSocket(newSocket);

    newSocket.on('online-count', (count: number) => setOnlineCount(count));
    newSocket.on('connect_error', () => {
      setMediaError('Unable to connect to the matching service. Check that the server is running and try again.');
    });

    return () => {
      newSocket.off('connect_error');
      newSocket.disconnect();
    };
  }, [token]);

  // Stop camera and microphone tracks completely
  const stopMediaTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    setStream(null);
    if (myVideo.current) {
      myVideo.current.srcObject = null;
    }
  };

  // Initialize media (camera & mic) ONLY when user starts a video match
  const initMedia = async (): Promise<MediaStream | null> => {
    // Check for secure context — getUserMedia is blocked on non-HTTPS (except localhost)
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setMediaError(
        'Camera & microphone require a secure connection (HTTPS). ' +
        'Please access VibeMeet via https:// or on localhost.'
      );
      return null;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaError('Your browser does not support camera/microphone access. Please use Chrome, Edge, or Firefox.');
      return null;
    }

    try {
      const currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = currentStream;
      setStream(currentStream);
      setIsVideoOn(true);
      setIsAudioOn(true);
      setMediaError(null);
      if (myVideo.current) {
        myVideo.current.srcObject = currentStream;
      }
      return currentStream;
    } catch (err: any) {
      console.error('Media Device Error:', err);

      // Try video-only as fallback (mic might be in use by another app)
      if (err?.name === 'NotReadableError' || err?.name === 'AbortError') {
        try {
          const videoOnly = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = videoOnly;
          setStream(videoOnly);
          setIsVideoOn(true);
          setIsAudioOn(false);
          setMediaError('Microphone is in use by another app — connected with video only. Close other apps and retry for audio.');
          if (myVideo.current) myVideo.current.srcObject = videoOnly;
          return videoOnly;
        } catch {
          // fallthrough to error display below
        }
      }

      let message = 'Camera/microphone access failed.';
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        message =
          'Camera & microphone access was denied. ' +
          'Click the camera icon in your browser address bar → Allow, then try again.';
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        message =
          'No camera or microphone was found. ' +
          'Please connect a webcam/headset and try again.';
      } else if (err?.name === 'NotReadableError' || err?.name === 'AbortError') {
        message =
          'Your camera or microphone is being used by another app. ' +
          'Close Zoom, Teams, or other apps that may be holding the device, then retry.';
      } else if (err?.name === 'OverconstrainedError') {
        message = 'Camera settings are not supported by your device.';
      } else if (err?.name === 'SecurityError') {
        message = 'Camera access is blocked by your browser security settings.';
      }

      setMediaError(message);
      return null;
    }
  };


  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      stopMediaTracks();
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('match-found', (data: { roomId: string }) => {
      setStatus('MATCHED');
      setRoomId(data.roomId);
      setMessages([]);
      setSafetyWarning(null);
      // The server starts WebRTC only after both matched browsers confirm
      // their media stream and signaling room are ready.
      if (streamRef.current) socket.emit('peer-ready', { roomId: data.roomId });
    });

    socket.on('initiate-call', (data: { roomId: string }) => {
      const currentStream = streamRef.current;
      if (!currentStream) return;

      if (peerRef.current) {
        peerRef.current.destroy();
      }

      const newPeer = new Peer({
        initiator: true,
        trickle: false,
        stream: currentStream,
        config: {
          iceServers
        }
      });
      newPeer.on('signal', (s: SignalData) => socket.emit('call-offer', { offer: s, roomId: data.roomId }));
      newPeer.on('stream', (rStream: MediaStream) => {
        setRemoteStream(rStream);
        setStatus('IN_CALL');
      });
      newPeer.on('error', () => endCallCleanup());
      peerRef.current = newPeer;
    });

    socket.on('call-offer', (data: { offer: SignalData; roomId: string }) => {
      const currentStream = streamRef.current;
      if (!currentStream) return;

      if (peerRef.current) {
        peerRef.current.destroy();
      }

      const newPeer = new Peer({
        initiator: false,
        trickle: false,
        stream: currentStream,
        config: {
          iceServers
        }
      });
      newPeer.on('signal', (s: SignalData) => socket.emit('call-answer', { answer: s, roomId: data.roomId }));
      newPeer.on('stream', (rStream: MediaStream) => {
        setRemoteStream(rStream);
        setStatus('IN_CALL');
      });
      newPeer.on('error', () => endCallCleanup());
      peerRef.current = newPeer;
      newPeer.signal(data.offer);
    });

    socket.on('call-answer', (data: { answer: SignalData }) => {
      peerRef.current?.signal(data.answer);
    });

    socket.on('call-ended', () => {
      endCallCleanup();
    });

    socket.on('chat-message', (data: { senderId: string; message: string; timestamp: Date }) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on('safety-warning', (data: { message: string }) => {
      setSafetyWarning(data.message);
    });

    socket.on('account-restricted', () => {
      alert('Your account has been restricted due to a safety policy violation.');
      handleLogout();
    });

    return () => {
      socket.off('match-found');
      socket.off('initiate-call');
      socket.off('call-offer');
      socket.off('call-answer');
      socket.off('call-ended');
      socket.off('chat-message');
      socket.off('safety-warning');
      socket.off('account-restricted');
    };
  }, [socket]);

  // Bind remote stream to video element
  useEffect(() => {
    if (userVideo.current && remoteStream) {
      userVideo.current.srcObject = remoteStream;
    }
  }, [remoteStream, status]);

  // Bind local stream to video element
  useEffect(() => {
    if (myVideo.current && stream) {
      myVideo.current.srcObject = stream;
    }
  }, [stream]);

  // Controls
  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn;
        setIsVideoOn(!isVideoOn);
      }
    }
  };

  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioOn;
        setIsAudioOn(!isAudioOn);
      }
    }
  };

  // Start Video Match: ONLY NOW open camera & mic
  const joinQueue = async () => {
    // Do not show a fake searching state when Socket.IO is not connected. This
    // is especially important when a second device accesses the app over LAN.
    if (!socket?.connected) {
      setMediaError('Connecting to the matching service. Please wait a moment and try again.');
      socket?.connect();
      return;
    }

    const currentStream = await initMedia();
    if (!currentStream) return;
    setMediaError(null);
    setStatus('QUEUED');
    socket?.emit('join-match-queue');
  };

  // Leave queue: STOP camera & mic immediately
  const leaveQueue = () => {
    socket?.emit('leave-match-queue');
    setStatus('IDLE');
    stopMediaTracks();
  };

  // Cleanup call and turn off devices
  const endCallCleanup = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    setRemoteStream(null);
    setRoomId(null);
    setStatus('IDLE');
    setMessages([]);
    setIsChatOpen(false);
    setSafetyWarning(null);
    stopMediaTracks();
  };

  const endCall = () => {
    if (roomId) socket?.emit('end-call', { roomId });
    endCallCleanup();
  };

  // Skip to next person immediately
  const nextPerson = () => {
    if (roomId) socket?.emit('end-call', { roomId });
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    setRemoteStream(null);
    setRoomId(null);
    setMessages([]);
    setIsChatOpen(false);
    setSafetyWarning(null);
    setStatus('QUEUED');
    socket?.emit('join-match-queue');
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentMessage.trim() && socket && roomId) {
      socket.emit('chat-message', { message: currentMessage, roomId });
      setCurrentMessage('');
    }
  };

  const handleLogout = () => {
    stopMediaTracks();
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    logout();
    navigate('/');
  };

  // Save profile changes (DP, Bio, Preferences)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);

    try {
      const res = await fetch(apiUrl('/api/users/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: editUsername,
          bio: editBio,
          gender: editGender,
          preferredGender: editPreferredGender,
          profileImage: editProfileImage,
          isCollegeStudent: editIsCollegeStudent,
          institutionName: editInstitutionName,
          preferredCommunity: editPreferredCommunity
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      updateUser(data.user);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => {
        setIsProfileModalOpen(false);
        setProfileMsg(null);
      }, 1200);
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Error updating profile' });
    } finally {
      setProfileSaving(false);
    }
  };

  const copySupportEmail = () => {
    navigator.clipboard.writeText('logiterax@gmail.com');
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  return (
    <div className="h-screen w-full bg-[#070b14] text-white flex flex-col relative overflow-hidden font-sans select-none">

      {/* Live Atmospheric Background with Fluid Auroras & Particle Effects */}
      <LiveAtmosphere />

      {/* Top Professional Header Bar */}
      <header className="relative z-30 w-full px-6 py-4 flex items-center justify-between border-b border-white/10 bg-slate-950/70 backdrop-blur-2xl shadow-lg">

        {/* Brand & Connection State */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="pulse-glow absolute inset-0 rounded-full bg-pink-500/30 blur-md" />
              <Logo3D size={42} animate={false} className="relative z-10 group-hover:scale-105 transition-transform" />
            </div>
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              VibeMeet <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border border-pink-500/30 font-semibold tracking-wide">PRO v2.0</span>
            </span>
          </Link>

          {/* Dynamic Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300 shadow-sm">
            <span className={`w-2 h-2 rounded-full ${status === 'IN_CALL' ? 'bg-emerald-400 animate-ping' : status === 'QUEUED' ? 'bg-pink-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span>
              {status === 'IN_CALL' ? 'In Live Call' : status === 'QUEUED' ? 'Matching Radar...' : 'Ready to Vibe'}
            </span>
          </div>
        </div>

        {/* Action Controls: Notifications, Help Center, Profile, Logout */}
        <div className="flex items-center gap-2.5 sm:gap-3">

          {/* Notifications Bell */}
          <NotificationBell socket={socket} />

          {/* Help Center Button */}
          <button
            id="help-center-btn"
            onClick={() => { setIsHelpModalOpen(true); }}
            className="p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-white/10 shadow-sm"
            title="Help Center"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Profile Button */}
          <button
            id="profile-btn"
            onClick={() => {
              setIsProfileModalOpen(true);
              setIsHelpModalOpen(false);
              setEditUsername(user?.username || '');
              setEditBio(user?.bio || '');
              setEditGender(user?.gender || 'Prefer not to say');
              setEditPreferredGender(user?.preferredGender || 'Everyone');
              setEditProfileImage(user?.profileImage || '');
            }}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-all border border-white/10 shadow-sm group"
            title="View or Edit Profile"
          >
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user.name} className="w-7 h-7 rounded-full object-cover ring-1 ring-pink-500" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                {user?.name?.charAt(0).toUpperCase() || <UserIcon className="w-4 h-4" />}
              </div>
            )}
            <span className="text-xs font-semibold hidden md:inline-block max-w-[110px] truncate group-hover:text-pink-300 transition-colors">
              {user?.username || user?.name || 'Profile'}
            </span>
          </button>

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => navigate('/admin')}
              className="hidden sm:inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3.5 py-2 text-xs font-bold text-violet-200 transition-all hover:bg-violet-500/20 hover:text-white"
              title="Open Admin Dashboard"
            >
              <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
            </button>
          )}

          {/* Logout Button */}
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="p-2.5 rounded-full bg-slate-800/80 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-all border border-white/10 shadow-sm"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <main className="flex-1 relative flex items-center justify-center overflow-hidden z-10">

        {/* Remote Video Surface */}
        <div className="absolute inset-0 bg-transparent flex items-center justify-center">
          {status === 'IN_CALL' && remoteStream ? (
            <video ref={userVideo} autoPlay playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 max-w-3xl">

              {/* QUEUED STATE: Sonar Radar Animation */}
              {status === 'QUEUED' && (
                <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">

                  {/* Radar Ripple Container */}
                  <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                    {/* Concentric expanding ripples */}
                    <div className="absolute inset-0 rounded-full border border-pink-500/40 radar-ripple-1" />
                    <div className="absolute inset-0 rounded-full border border-purple-500/30 radar-ripple-2" />
                    <div className="absolute inset-0 rounded-full border border-blue-500/20 radar-ripple-3" />

                    {/* Rotating scanning beam */}
                    <div className="absolute inset-6 rounded-full overflow-hidden opacity-40">
                      <div className="w-full h-full radar-sweep rounded-full [background:conic-gradient(from_0deg,transparent_0_300deg,rgba(236,72,153,0.7)_360deg)]" />
                    </div>

                    {/* Central 3D Logo */}
                    <div className="relative z-10 w-24 h-24 rounded-3xl bg-slate-900/90 border border-pink-500/50 flex items-center justify-center shadow-[0_0_40px_rgba(236,72,153,0.4)] backdrop-blur-md">
                      <Logo3D size={80} animate={true} />
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 text-xs font-semibold mb-3">
                    <Radio className="w-3.5 h-3.5 animate-pulse" /> Vibe Radar Searching
                  </div>

                  <h2 className="text-3xl font-black text-white tracking-tight">Finding your vibe connection...</h2>
                  <p className="text-slate-400 text-sm mt-2 mb-8 max-w-md">
                    Looking for someone matching your preference: <span className="text-pink-400 font-bold">{user?.preferredGender || 'Everyone'}</span>{user?.preferredCommunity === 'COLLEGE_STUDENTS' ? <>, from <span className="text-pink-400 font-bold">{user.institutionName}</span></> : null}.
                  </p>

                  <button
                    onClick={leaveQueue}
                    className="px-8 py-3 rounded-full text-sm font-semibold bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white border border-white/15 transition-all shadow-lg hover:scale-105 active:scale-95"
                  >
                    Cancel Search
                  </button>
                </div>
              )}

              {/* IDLE STATE: Attractive Homepage Hero with Live Effects */}
              {status === 'IDLE' && (
                <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">

                  {/* Glowing 3D Logo Header */}
                  <div className="relative mb-6">
                    <div className="pulse-glow absolute -inset-8 bg-gradient-to-r from-pink-500/30 via-purple-600/30 to-blue-500/30 rounded-full blur-3xl" />
                    <Logo3D size={120} animate={false} className="relative z-10" />
                  </div>

                  {/* Greeting & Community Badge */}
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" /> Welcome back, {user?.name?.split(' ')[0] || user?.username || 'Viber'}!
                  </div>

                  {/* Hero Headline */}
                  <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight mb-4">
                    Ready to meet <span className="gradient-text">face to face?</span>
                  </h1>

                  <p className="text-slate-400 text-base sm:text-lg max-w-xl mb-8 leading-relaxed">
                    Real-time spontaneous 1-on-1 video conversations. No endless chats, no fake profiles — jump straight into genuine conversations.
                  </p>

                  {/* Primary Start Video Match CTA */}
                  <div className="relative group mb-8">
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 opacity-70 blur-xl group-hover:opacity-100 transition duration-500 group-hover:duration-200 animate-pulse" />
                    <button
                      id="start-match-btn"
                      onClick={joinQueue}
                      className="relative inline-flex items-center gap-3 px-11 py-5 rounded-full font-black text-lg text-white bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 shadow-[0_0_35px_rgba(236,72,153,0.4)] hover:shadow-[0_0_55px_rgba(236,72,153,0.7)] hover:scale-105 active:scale-95 transition-all duration-300"
                    >
                      <Video className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                      Start Video Match <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Live Stats Pill */}
                  <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 bg-slate-900/60 border border-white/10 px-5 py-2.5 rounded-full backdrop-blur-xl shadow-lg">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> {onlineCount !== null ? `${onlineCount.toLocaleString()} Vibers Online` : 'Vibers Online'}</span>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-pink-400" /> Preference: {user?.preferredCommunity === 'COLLEGE_STUDENTS' ? `Same college · ${user.institutionName}` : user?.preferredGender || 'Everyone'}</span>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-blue-400" /> AI Safety Active</span>
                  </div>

                  {/* Privacy Guarantee Reminder */}
                  <p className="text-[11px] text-slate-500 mt-4 flex items-center gap-1">
                    🔒 Microphone and camera are completely disabled until you click &quot;Start Video Match&quot;.
                  </p>

                  {/* Camera / Mic Error Banner */}
                  {mediaError && (
                    <div className="mt-5 flex items-start gap-3 max-w-lg bg-amber-500/10 border border-amber-400/30 text-amber-200 px-4 py-3.5 rounded-2xl text-sm text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <span className="text-xl shrink-0 mt-0.5">📷</span>
                      <div className="flex-1">
                        <p className="font-semibold text-amber-100 mb-0.5">Camera / Microphone Issue</p>
                        <p className="text-amber-200/80 text-xs leading-relaxed">{mediaError}</p>
                      </div>
                      <button onClick={() => setMediaError(null)} className="text-amber-400/60 hover:text-amber-200 transition-colors shrink-0 mt-0.5 text-lg leading-none">&times;</button>
                    </div>
                  )}
                </div>
              )}

              {/* MATCHED TRANSITION STATE */}
              {status === 'MATCHED' && (
                <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-24 h-24 rounded-3xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shadow-2xl shadow-emerald-500/40 mb-6">
                    <Sparkles className="w-12 h-12 text-emerald-400 animate-spin" />
                  </div>
                  <h2 className="text-3xl font-extrabold text-emerald-400">Match found!</h2>
                  <p className="text-slate-400 text-sm mt-2">Connecting peer video stream securely...</p>
                </div>

              )}

            </div>
          )}
        </div>

        {/* Floating Local Video Picture-in-Picture */}
        {stream && (
          <div className="absolute top-6 right-6 w-36 sm:w-52 aspect-[3/4] bg-slate-900/90 rounded-2xl overflow-hidden z-20 border-2 border-white/20 shadow-2xl backdrop-blur-md">
            <video
              ref={myVideo}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform scale-x-[-1] ${!isVideoOn ? 'opacity-0' : 'opacity-100'}`}
            />
            {!isVideoOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-400 text-xs">
                <VideoOff className="w-6 h-6 mb-1 text-red-400" />
                <span>Camera Off</span>
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-medium text-white">
              You
            </div>
          </div>
        )}

        {/* Safety Warning Notification Banner */}
        {safetyWarning && (
          <div className="absolute top-6 left-6 z-30 bg-red-600/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-red-400/50 backdrop-blur-lg max-w-sm flex items-start gap-3 animate-in slide-in-from-top duration-300">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-300 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed">{safetyWarning}</p>
          </div>
        )}

        {/* Live Chat Panel During Call */}
        {isChatOpen && status === 'IN_CALL' && (
          <div className="absolute top-6 left-6 bottom-28 w-80 sm:w-96 bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/15 z-20 flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-950/60">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-pink-400" />
                <h3 className="font-bold text-sm">Live Call Chat</h3>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4">
                  <Sparkles className="w-6 h-6 mb-2 opacity-50" />
                  <span>Break the ice! Say hello to your match.</span>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${m.senderId === user?._id ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white self-end rounded-br-none' : 'bg-slate-800 text-slate-200 self-start rounded-bl-none border border-white/10'}`}
                  >
                    {m.message}
                  </div>
                ))
              )}
            </div>

            <form onSubmit={sendMessage} className="p-3 bg-slate-950/60 border-t border-white/10 flex gap-2">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Send a positive message..."
                className="flex-1 bg-slate-800/90 border border-white/10 rounded-full px-4 py-2 text-xs focus:outline-none focus:border-pink-500"
              />
              <button type="submit" className="bg-gradient-to-r from-pink-500 to-purple-600 p-2 rounded-full hover:scale-105 transition-all">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

      </main>

      {/* In-Call Floating Bottom Control Dock */}
      {status === 'IN_CALL' && (
        <div className="relative z-30 w-full p-5 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex items-center justify-center">
          <div className="flex items-center gap-4 bg-slate-900/80 border border-white/15 px-6 py-3 rounded-full backdrop-blur-2xl shadow-2xl">

            {/* Audio Toggle */}
            <button
              onClick={toggleAudio}
              className={`p-3.5 rounded-full transition-all ${isAudioOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-500 text-white shadow-lg shadow-red-500/30'}`}
              title={isAudioOn ? 'Mute Mic' : 'Unmute Mic'}
            >
              {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            {/* Video Toggle */}
            <button
              onClick={toggleVideo}
              className={`p-3.5 rounded-full transition-all ${isVideoOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-500 text-white shadow-lg shadow-red-500/30'}`}
              title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            {/* Chat Drawer Toggle */}
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`p-3.5 rounded-full transition-all ${isChatOpen ? 'bg-pink-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
              title="Toggle Live Chat"
            >
              <MessageCircle className="w-5 h-5" />
            </button>

            {/* End Call Hangup */}
            <button
              onClick={endCall}
              className="p-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/40 hover:scale-105 active:scale-95 transition-all"
              title="End Call"
            >
              <PhoneOff className="w-5 h-5" />
            </button>

            {/* Skip / Next Person */}
            <button
              onClick={nextPerson}
              className="px-6 py-3 rounded-full font-bold text-sm bg-white hover:bg-slate-200 text-slate-950 shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              Next Person →
            </button>

          </div>
        </div>
      )}

      {/* PROFILE MODAL: View & Update DP, Bio, Preferences */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-white/15 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-600/20 border border-pink-500/30 text-pink-400">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Your Profile</h3>
                  <p className="text-xs text-slate-400">Update your avatar (DP), bio, and matching vibe.</p>
                </div>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Feedback message */}
            {profileMsg && (
              <div className={`p-3.5 rounded-2xl mb-4 text-xs font-semibold flex items-center gap-2 ${profileMsg.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                {profileMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5">

              {/* DP / Avatar Section */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Profile Picture (DP)</label>
                <div className="flex items-center gap-4">
                  <img
                    src={editProfileImage || AVATAR_PRESETS[0]}
                    alt="Avatar preview"
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-pink-500 shadow-lg shadow-pink-500/20"
                  />
                  <div className="flex-1">
                    <input
                      type="url"
                      value={editProfileImage}
                      onChange={(e) => setEditProfileImage(e.target.value)}
                      placeholder="Paste image URL or choose preset below"
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-slate-400 font-medium">Presets:</span>
                      {AVATAR_PRESETS.map((p, idx) => (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => setEditProfileImage(p)}
                          className="w-7 h-7 rounded-full overflow-hidden border border-white/20 hover:scale-110 transition-transform"
                        >
                          <img src={p} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Username</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="@username"
                  required
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Bio / Vibe Description</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  placeholder="Share your vibe, favorite artists, humor, or what you're looking for..."
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500 resize-none"
                />
              </div>

              {/* Gender & Match Preference Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Your Gender</label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value as any)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Match Preference</label>
                  <select
                    value={editPreferredGender}
                    onChange={(e) => setEditPreferredGender(e.target.value as any)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="Everyone">Everyone</option>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[.025] p-4 space-y-3">
                <label className="flex items-center justify-between gap-4 text-sm font-medium text-slate-200 cursor-pointer">
                  <span>Are you a college student?</span>
                  <input
                    type="checkbox"
                    checked={editIsCollegeStudent}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setEditIsCollegeStudent(checked);
                      if (!checked) {
                        setEditInstitutionName('');
                        setEditPreferredCommunity('EVERYONE');
                      }
                    }}
                    className="w-4 h-4 accent-pink-500"
                  />
                </label>

                {editIsCollegeStudent && <>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">College or University Name
                    <input
                      value={editInstitutionName}
                      onChange={(e) => setEditInstitutionName(e.target.value)}
                      required
                      placeholder="e.g. Parul University"
                      className="mt-1.5 w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Video Call Community
                    <select
                      value={editPreferredCommunity}
                      onChange={(e) => setEditPreferredCommunity(e.target.value as 'EVERYONE' | 'COLLEGE_STUDENTS')}
                      className="mt-1.5 w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500"
                    >
                      <option value="EVERYONE">Everyone</option>
                      <option value="COLLEGE_STUDENTS">Students from my college/university</option>
                    </select>
                  </label>
                  <p className="text-xs text-slate-500">Same-college matching uses your college or university name and respects both people’s preferences.</p>
                </>}
              </div>

              {/* Save Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white hover:opacity-95 shadow-lg shadow-pink-500/30 disabled:opacity-50 transition-all"
                >
                  {profileSaving ? 'Saving Profile Changes...' : 'Save Profile Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* HELP CENTER MODAL */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-white/15 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-400">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Help Center</h3>
                  <p className="text-xs text-slate-400">Direct support and community assistance.</p>
                </div>
              </div>
              <button
                onClick={() => setIsHelpModalOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">

              {/* Direct Support Card */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                <Mail className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-white text-sm">Official Support Email</h4>
                  <p className="text-slate-400 mt-1 leading-relaxed">Reach our admin and support team directly:</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-mono font-bold text-pink-400 text-sm">logiterax@gmail.com</span>
                    <button
                      onClick={copySupportEmail}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
                      title="Copy email"
                    >
                      {emailCopied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Guidelines */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" /> Safe Community Promise
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  • Camera & microphone are only activated when you start matching.<br />
                  • AI actively guards against violations and abusive conduct.<br />
                  • Skip any match instantly with the &quot;Next Person&quot; button.
                </p>
              </div>

              {/* Action Email Button */}
              <a
                href="mailto:logiterax@gmail.com?subject=VibeMeet%20Support%20Request"
                className="block text-center w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-95 shadow-md shadow-pink-500/25 transition-all"
              >
                Send Email to logiterax@gmail.com
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MatchPage;
