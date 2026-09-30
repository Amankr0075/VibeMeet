import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import { type Socket } from 'socket.io-client';
import Peer, { type SignalData } from 'simple-peer';

// ── ICE / STUN / TURN config ─────────────────────────────────────────────────
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

export const iceServers: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  ...(import.meta.env.VITE_TURN_URL
    ? [
        {
          urls: import.meta.env.VITE_TURN_URL as string,
          username: import.meta.env.VITE_TURN_USERNAME as string,
          credential: import.meta.env.VITE_TURN_CREDENTIAL as string,
        },
      ]
    : [fallbackTurnServer]),
];

// ── Types ─────────────────────────────────────────────────────────────────────
export type CallStatus = 'IDLE' | 'QUEUED' | 'MATCHED' | 'IN_CALL';

export interface ChatMessage {
  senderId: string;
  message: string;
  timestamp: Date;
}

interface CallContextValue {
  // State
  status: CallStatus;
  setStatus: React.Dispatch<React.SetStateAction<CallStatus>>;
  roomId: string | null;
  setRoomId: React.Dispatch<React.SetStateAction<string | null>>;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  setRemoteStream: React.Dispatch<React.SetStateAction<MediaStream | null>>;
  isVideoOn: boolean;
  isAudioOn: boolean;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  safetyWarning: string | null;
  setSafetyWarning: React.Dispatch<React.SetStateAction<string | null>>;
  onlineCount: number | null;
  setOnlineCount: React.Dispatch<React.SetStateAction<number | null>>;
  mediaError: string | null;
  setMediaError: React.Dispatch<React.SetStateAction<string | null>>;

  // Refs
  peerRef: React.MutableRefObject<Peer.Instance | null>;
  pendingCandidatesRef: React.MutableRefObject<SignalData[]>;
  roomIdRef: React.MutableRefObject<string | null>;
  streamRef: React.MutableRefObject<MediaStream | null>;
  myVideoRef: React.MutableRefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.MutableRefObject<HTMLVideoElement | null>;

  // Actions
  initMedia: () => Promise<MediaStream | null>;
  stopMediaTracks: () => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
  cleanupCall: () => void;

  // Socket
  socket: Socket | null;
  setSocket: React.Dispatch<React.SetStateAction<Socket | null>>;
}

const CallContext = createContext<CallContextValue | null>(null);

export const useCall = (): CallContextValue => {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used inside a CallProvider');
  return ctx;
};

// ── Provider ──────────────────────────────────────────────────────────────────
export const CallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<CallStatus>('IDLE');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Refs
  const peerRef = useRef<Peer.Instance | null>(null);
  const pendingCandidatesRef = useRef<SignalData[]>([]);
  const roomIdRef = useRef<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const myVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // ── Media helpers ─────────────────────────────────────────────────────────
  const stopMediaTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setLocalStream(null);
    if (myVideoRef.current) myVideoRef.current.srcObject = null;
  }, []);

  const initMedia = useCallback(async (): Promise<MediaStream | null> => {
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setMediaError(
        'Camera & microphone require a secure connection (HTTPS). ' +
          'Please access VibeMeet via https:// or on localhost.',
      );
      return null;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaError(
        'Your browser does not support camera/microphone access. Please use Chrome, Edge, or Firefox.',
      );
      return null;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = s;
      setLocalStream(s);
      setIsVideoOn(true);
      setIsAudioOn(true);
      setMediaError(null);
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = s;
        myVideoRef.current.play().catch(() => {});
      }
      return s;
    } catch (err: any) {
      // Fallback to video-only
      if (err?.name === 'NotReadableError' || err?.name === 'AbortError') {
        try {
          const videoOnly = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = videoOnly;
          setLocalStream(videoOnly);
          setIsVideoOn(true);
          setIsAudioOn(false);
          setMediaError(
            'Microphone is in use by another app — connected with video only. Close other apps and retry for audio.',
          );
          if (myVideoRef.current) myVideoRef.current.srcObject = videoOnly;
          return videoOnly;
        } catch {
          // fall through
        }
      }
      let message = 'Camera/microphone access failed.';
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        message =
          'Camera & microphone access was denied. Click the camera icon in your browser address bar and allow, then try again.';
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        message = 'No camera or microphone was found. Please connect a webcam/headset and try again.';
      } else if (err?.name === 'OverconstrainedError') {
        message = 'Camera settings are not supported by your device.';
      } else if (err?.name === 'SecurityError') {
        message = 'Camera access is blocked by your browser security settings.';
      }
      setMediaError(message);
      return null;
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsVideoOn(track.enabled);
      }
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (streamRef.current) {
      const track = streamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsAudioOn(track.enabled);
      }
    }
  }, []);

  const cleanupCall = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    setRemoteStream(null);
    setRoomId(null);
    roomIdRef.current = null;
    setMessages([]);
    setSafetyWarning(null);
    pendingCandidatesRef.current = [];
    stopMediaTracks();
    setStatus('IDLE');
  }, [stopMediaTracks]);

  const value: CallContextValue = {
    status,
    setStatus,
    roomId,
    setRoomId,
    localStream,
    remoteStream,
    setRemoteStream,
    isVideoOn,
    isAudioOn,
    messages,
    setMessages,
    safetyWarning,
    setSafetyWarning,
    onlineCount,
    setOnlineCount,
    mediaError,
    setMediaError,
    peerRef,
    pendingCandidatesRef,
    roomIdRef,
    streamRef,
    myVideoRef,
    remoteVideoRef,
    initMedia,
    stopMediaTracks,
    toggleVideo,
    toggleAudio,
    cleanupCall,
    socket,
    setSocket,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};
