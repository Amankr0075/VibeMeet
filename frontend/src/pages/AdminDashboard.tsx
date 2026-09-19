import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { 
  Users, Video, AlertTriangle, Shield, Activity, Search, LogOut,
  RefreshCw, CheckCircle, ArrowUpRight,
  PhoneCall, Sparkles, Trash2, Mail, Reply, Send,
  Clock, CheckCircle2, MessageSquare, AlertCircle, X,
  Zap, ChevronRight, Database, Wifi, Bot, AtSign,
  UserSearch, Download, Link, Megaphone
} from 'lucide-react';
import { apiUrl } from '../config/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface StatsData {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalCalls: number;
  activeCalls: number;
  totalIncidents: number;
  criticalIncidents: number;
}

interface MemberUser {
  _id: string;
  name: string;
  username?: string;
  email: string;
  gender?: string;
  preferredGender?: string;
  role: 'USER' | 'ADMIN';
  accountStatus: 'ACTIVE' | 'BANNED' | 'SUSPENDED' | 'AI_BLOCKED';
  profileImage?: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface CallSessionItem {
  _id: string;
  userA?: { _id: string; name: string; email: string; username?: string };
  userB?: { _id: string; name: string; email: string; username?: string };
  status: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
}

interface IncidentItem {
  _id: string;
  userId?: { _id: string; name: string; email: string; username?: string };
  source: string;
  categories: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedAction: string;
  finalAction: string;
  createdAt: string;
}

interface SupportMessageItem {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  category?: string;
  status: 'PENDING' | 'REPLIED' | 'CLOSED';
  replies: Array<{
    senderEmail: string;
    senderName: string;
    message: string;
    sentAt: string;
  }>;
  createdAt: string;
}

type TabId = 'overview' | 'campaigns' | 'users' | 'calls' | 'incidents' | 'email' | 'investigation' | 'broadcasts';

interface UserProfileResult {
  user: {
    _id: string; name: string; username?: string; email: string;
    gender?: string; preferredGender?: string; role: string;
    accountStatus: string; profileImage?: string;
    createdAt: string; lastLoginAt?: string; lastActiveAt?: string;
    isOnline: boolean;
  };
  calls: Array<{
    _id: string;
    userA?: { _id: string; name: string; email: string; username?: string };
    userB?: { _id: string; name: string; email: string; username?: string };
    status: string; startedAt?: string; endedAt?: string; createdAt: string;
  }>;
  incidents: Array<{
    _id: string; source: string; categories: string[];
    riskLevel: string; finalAction: string; status: string; createdAt: string;
  }>;
}

interface LandingContent {
  announcement: string;
  occasion: LandingPost & { badge: string };
  offer: LandingPost & { ctaLabel: string };
  collaboration: LandingPost & { partner: string };
  updatedAt?: string;
}

interface LandingPost { title: string; description: string; active: boolean; imageUrl?: string; expiresAt?: string }

const riskColors: Record<string, string> = {
  LOW: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  MEDIUM: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  HIGH: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  CRITICAL: 'bg-red-500/15 text-red-300 border-red-500/30',
};

const AdminDashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [stats, setStats] = useState<StatsData | null>(null);
  const [recentUsers, setRecentUsers] = useState<MemberUser[]>([]);
  const [members, setMembers] = useState<MemberUser[]>([]);
  const [calls, setCalls] = useState<CallSessionItem[]>([]);
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [messages, setMessages] = useState<SupportMessageItem[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BANNED'>('ALL');

  const [composerTo, setComposerTo] = useState('');
  const [composerSubject, setComposerSubject] = useState('');
  const [composerMessage, setComposerMessage] = useState('');
  const [composerTicketId, setComposerTicketId] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [landingContent, setLandingContent] = useState<LandingContent | null>(null);
  const [publishingContent, setPublishingContent] = useState(false);
  const [contentSuccess, setContentSuccess] = useState<string | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventFormData, setEventFormData] = useState({ title: '', description: '', badge: 'LIVE EVENT', imageUrl: '', imageUrlInput: '', expiresAt: '' });

  // Investigation tab state
  const [investigationQuery, setInvestigationQuery] = useState('');
  const [investigationLoading, setInvestigationLoading] = useState(false);
  const [investigationError, setInvestigationError] = useState<string | null>(null);
  const [investigationResult, setInvestigationResult] = useState<UserProfileResult | null>(null);

  // Broadcast tab state
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);

  const handleInvestigationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investigationQuery.trim()) return;
    setInvestigationLoading(true);
    setInvestigationError(null);
    setInvestigationResult(null);
    try {
      const res = await fetch(apiUrl(`/api/admin/user-profile?query=${encodeURIComponent(investigationQuery.trim())}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'User not found');
      setInvestigationResult(data);
    } catch (err: any) {
      setInvestigationError(err.message);
    } finally {
      setInvestigationLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!investigationResult) return;
    const { user, calls, incidents } = investigationResult;
    const blockCount = incidents.filter(i => i.finalAction?.toLowerCase().includes('ban') || i.finalAction?.toLowerCase().includes('block')).length;
    const generatedAt = new Date();
    const reportId = `VM-${Date.now().toString(36).toUpperCase()}`;

    // Load actual transparent logo
    let logoBase64 = '';
    try {
      const res = await fetch('/logo.png');
      const blob = await res.blob();
      logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn('Failed to load logo for PDF:', e);
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    // ─── Colour helpers ───────────────────────────────────────────────
    const hex = (h: string) => { const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16); return [r, g, b] as [number, number, number]; };
    const PINK = hex('#ec4899');
    const PURPLE = hex('#8b5cf6');
    const DARK = hex('#0a0f1e');
    const SLATE = hex('#94a3b8');

    const addPage = () => {
      doc.addPage();

      // Professional solid light-slate background
      doc.setFillColor(250, 251, 253);
      doc.rect(0, 0, W, H, 'F');

      // Premium Page Border
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.rect(5, 5, W - 10, H - 10, 'S');

      // Subtle grid overlay (like technical blueprint)
      doc.setDrawColor(241, 245, 249); // slate-100
      doc.setLineWidth(0.1);
      for (let x = 10; x <= W - 10; x += 10) doc.line(x, 10, x, H - 10);
      for (let y = 10; y <= H - 10; y += 10) doc.line(10, y, W - 10, y);

      // Elegant central watermark (if logo available)
      if (logoBase64) {
        doc.setGState(new (doc as any).GState({ opacity: 0.03 }));
        const wmSize = 100;
        doc.addImage(logoBase64, 'PNG', (W - wmSize) / 2, (H - wmSize) / 2, wmSize, wmSize);
        doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
      }
    };

    const drawGradientHeader = () => {
      // Dark header band
      doc.setFillColor(...DARK);
      doc.rect(0, 0, W, 38, 'F');

      // Pink accent stripe at very top
      doc.setFillColor(...PINK);
      doc.rect(0, 0, W, 1.2, 'F');

      // Decorative circle glows (subtle professional touch)
      doc.setFillColor(139, 92, 246, 0.15);
      doc.circle(W - 18, 6, 22, 'F');
      doc.setFillColor(236, 72, 153, 0.1);
      doc.circle(22, 32, 18, 'F');

      if (logoBase64) {
        // Drop shadow for logo in header
        doc.setFillColor(0, 0, 0, 0.2);
        doc.circle(20, 18.5, 10, 'F');

        doc.addImage(logoBase64, 'PNG', 10, 8, 20, 20);

        // Brand name
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...PINK);
        doc.text('VibeMeet', 33, 19);

        // Sub-brand
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...SLATE);
        doc.text('No Swipes. Just Connections.', 33, 24);
      } else {
        // Logo icon — stylised shield fallback
        doc.setFillColor(...PURPLE);
        doc.roundedRect(10, 9, 14, 16, 2, 2, 'F');
        doc.setFillColor(...PINK);
        doc.roundedRect(12, 11, 10, 12, 1.5, 1.5, 'F');
        doc.setFillColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('VM', 13.5, 19.5);

        // Brand name
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...PINK);
        doc.text('VibeMeet', 27, 19);

        // Sub-brand
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...SLATE);
        doc.text('No Swipes. Just Connections.', 27, 24);
      }

      // Right-side label
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...SLATE);
      doc.text('CONFIDENTIAL ADMIN REPORT', W - 10, 14, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.text(`Report ID: ${reportId}`, W - 10, 19, { align: 'right' });
      doc.text(`Generated: ${generatedAt.toLocaleString()}`, W - 10, 24, { align: 'right' });

      // Divider
      doc.setDrawColor(...PINK);
      doc.setLineWidth(0.4);
      doc.line(10, 39, W - 10, 39);
    };

    const drawPageFooter = (pageNum: number, totalPages: number) => {
      const y = H - 10;
      doc.setDrawColor(...PURPLE);
      doc.setLineWidth(0.3);
      doc.line(10, y - 4, W - 10, y - 4);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...SLATE);
      doc.text('VibeMeet — Confidential Admin Report', 10, y);
      doc.text(`Page ${pageNum} of ${totalPages}`, W - 10, y, { align: 'right' });
      doc.text('System Generated · No Physical Signature Required', W / 2, y, { align: 'center' });
    };

    // ─── PAGE 1 ──────────────────────────────────────────────────────
    // faint grid
    doc.setDrawColor(230, 230, 240);
    doc.setLineWidth(0.1);
    for (let x = 0; x <= W; x += 8) doc.line(x, 0, x, H);
    for (let y2 = 0; y2 <= H; y2 += 8) doc.line(0, y2, W, y2);

    drawGradientHeader();

    let y = 48;

    // ── Report Title ─
    doc.setFillColor(236, 72, 153, 0.07);
    doc.roundedRect(10, y - 3, W - 20, 16, 2, 2, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('User Investigation Report', 16, y + 6);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SLATE);
    doc.text(`Prepared by VibeMeet Admin Console  ·  ${generatedAt.toDateString()}`, 16, y + 12);
    y += 22;

    // ── Profile Section ─
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PURPLE);
    doc.text('● PROFILE DETAILS', 10, y);
    y += 5;

    const profileRows: [string, string][] = [
      ['Full Name', user.name || '—'],
      ['Username', user.username ? `@${user.username}` : '—'],
      ['Email Address', user.email],
      ['Role', user.role],
      ['Account Status', user.accountStatus],
      ['Gender', user.gender || '—'],
      ['Preferred Gender', user.preferredGender || '—'],
      ['Online Now', user.isOnline ? 'Yes ✓' : 'No'],
    ];

    autoTable(doc, {
      startY: y,
      margin: { left: 10, right: 10 },
      head: [],
      body: profileRows,
      styles: { fontSize: 8, cellPadding: 3, textColor: [30, 30, 50] },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [245, 243, 255], textColor: hex('#7c3aed'), cellWidth: 45 },
        1: { fillColor: [255, 255, 255] },
      },
      alternateRowStyles: { fillColor: [250, 250, 255] },
      tableLineColor: [220, 215, 240],
      tableLineWidth: 0.2,
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // ── Account Timeline ─
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PURPLE);
    doc.text('● ACCOUNT TIMELINE', 10, y);
    y += 5;

    const timelineRows: [string, string][] = [
      ['Account Created', user.createdAt ? new Date(user.createdAt).toLocaleString() : '—'],
      ['Last Login', user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'],
      ['Last Active', user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString() : '—'],
    ];

    autoTable(doc, {
      startY: y,
      margin: { left: 10, right: 10 },
      head: [],
      body: timelineRows,
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [240, 253, 250], textColor: hex('#0f766e'), cellWidth: 45 },
        1: { fillColor: [255, 255, 255] },
      },
      tableLineColor: [190, 235, 225],
      tableLineWidth: 0.2,
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // ── Summary Metrics ─
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PURPLE);
    doc.text('● ACTIVITY SUMMARY', 10, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      margin: { left: 10, right: 10 },
      head: [['Metric', 'Value']],
      body: [
        ['Total Call Sessions', String(calls.length)],
        ['Total Incidents / Flags', String(incidents.length)],
        ['Times Blocked / Banned', String(blockCount)],
        ['Pending Incidents', String(incidents.filter(i => i.status === 'PENDING').length)],
        ['Reviewed Incidents', String(incidents.filter(i => i.status === 'REVIEWED').length)],
      ],
      headStyles: { fillColor: PURPLE, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 80 } },
      alternateRowStyles: { fillColor: [248, 245, 255] },
      tableLineColor: [220, 215, 240],
      tableLineWidth: 0.2,
    });

    // ─── PAGE 2 — Call History ────────────────────────────────────────
    addPage();
    drawGradientHeader();
    y = 48;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PURPLE);
    doc.text('● CALL HISTORY', 10, y);
    y += 5;

    if (calls.length === 0) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...SLATE);
      doc.text('No call sessions recorded for this user.', 10, y + 6);
    } else {
      const callRows = calls.map((c, idx) => {
        const partner = c.userA?._id === user._id ? c.userB : c.userA;
        const dur = c.startedAt && c.endedAt
          ? `${Math.round((new Date(c.endedAt).getTime() - new Date(c.startedAt).getTime()) / 1000)}s`
          : '—';
        return [
          String(idx + 1),
          new Date(c.createdAt).toLocaleString(),
          partner?.name || 'Unknown',
          partner?.email || '—',
          partner?.username ? `@${partner.username}` : '—',
          c.status,
          dur,
        ];
      });

      autoTable(doc, {
        startY: y,
        margin: { left: 10, right: 10 },
        head: [['#', 'Date & Time', 'Partner Name', 'Partner Email', 'Username', 'Status', 'Duration']],
        body: callRows,
        headStyles: { fillColor: hex('#0f766e'), textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
        styles: { fontSize: 7, cellPadding: 2.5 },
        columnStyles: {
          0: { cellWidth: 7, halign: 'center' },
          5: { halign: 'center' },
          6: { halign: 'center', cellWidth: 18 },
        },
        alternateRowStyles: { fillColor: [240, 253, 250] },
        tableLineColor: [190, 235, 225],
        tableLineWidth: 0.2,
        didDrawPage: (data) => {
          drawGradientHeader();
          drawPageFooter(data.pageNumber, 0); // total filled after
        },
      });
    }

    // ─── PAGE 3 — Incident Log ────────────────────────────────────────
    addPage();
    drawGradientHeader();
    y = 48;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PURPLE);
    doc.text('● MODERATION & INCIDENT LOG', 10, y);
    y += 5;

    if (incidents.length === 0) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(34, 197, 94);
      doc.text('✓ No moderation incidents found. Clean record.', 10, y + 6);
    } else {
      const incidentRows = incidents.map((inc, idx) => [
        String(idx + 1),
        new Date(inc.createdAt).toLocaleString(),
        inc.source,
        inc.categories.join(', ') || '—',
        inc.riskLevel,
        inc.finalAction,
        inc.status,
      ]);

      autoTable(doc, {
        startY: y,
        margin: { left: 10, right: 10 },
        head: [['#', 'Date', 'Source', 'Categories', 'Risk', 'Action Taken', 'Status']],
        body: incidentRows,
        headStyles: { fillColor: PINK, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
        styles: { fontSize: 7, cellPadding: 2.5 },
        columnStyles: {
          0: { cellWidth: 7, halign: 'center' },
          4: { halign: 'center', cellWidth: 18 },
          6: { halign: 'center', cellWidth: 18 },
        },
        alternateRowStyles: { fillColor: [255, 241, 242] },
        tableLineColor: [254, 205, 211],
        tableLineWidth: 0.2,
        didDrawPage: (data) => {
          drawGradientHeader();
          drawPageFooter(data.pageNumber, 0);
        },
      });
    }

    // ─── LAST PAGE — Digital Signature ───────────────────────────────
    addPage();
    drawGradientHeader();

    const sigY = H / 2 - 30;

    // Signature box
    doc.setFillColor(248, 246, 255);
    doc.roundedRect(20, sigY, W - 40, 80, 4, 4, 'F');
    doc.setDrawColor(...PURPLE);
    doc.setLineWidth(0.5);
    doc.roundedRect(20, sigY, W - 40, 80, 4, 4, 'S');

    // Stamp circle
    doc.setFillColor(...PURPLE);
    doc.circle(W / 2, sigY + 18, 12, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('VM', W / 2 - 3.5, sigY + 20);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('VibeMeet', W / 2, sigY + 36, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PURPLE);
    doc.text('DIGITAL SIGNATURE', W / 2, sigY + 43, { align: 'center' });

    // Signature line (decorative cursive-style)
    doc.setDrawColor(...PINK);
    doc.setLineWidth(1.2);
    // Simulated cursive "VibeMeet" underline
    doc.line(W / 2 - 28, sigY + 55, W / 2 + 28, sigY + 55);
    doc.setLineWidth(0.3);
    doc.line(W / 2 - 20, sigY + 58, W / 2 + 20, sigY + 58);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...SLATE);
    doc.text('VibeMeet Administration System', W / 2, sigY + 64, { align: 'center' });
    doc.text('Digitally signed at: ' + generatedAt.toUTCString(), W / 2, sigY + 69, { align: 'center' });
    doc.text(`Report Reference ID: ${reportId}`, W / 2, sigY + 74, { align: 'center' });

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PINK);
    doc.text('THIS IS A SYSTEM GENERATED REPORT — NO PHYSICAL SIGNATURE REQUIRED', W / 2, sigY + 82, { align: 'center' });

    // ─── Fix footer page numbers ──────────────────────────────────────
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      drawPageFooter(p, totalPages);
    }

    doc.save(`VibeMeet-Report-${user.username || user.email}-${reportId}.pdf`);
  };

  const setPostImage = (key: 'occasion' | 'offer' | 'collaboration', file?: File) => {
    if (!file || !landingContent) return;
    if (!file.type.startsWith('image/') || file.size > 3 * 1024 * 1024) {
      setContentSuccess('Choose an image file smaller than 3 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLandingContent(current => current ? { ...current, [key]: { ...current[key], imageUrl: String(reader.result) } } : current);
    reader.readAsDataURL(file);
  };

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(apiUrl('/api/admin/stats'), { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) { setStats(data.stats); setRecentUsers(data.recentUsers || []); }
    } catch (err) { console.error('Failed to fetch admin stats:', err); }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch(apiUrl('/api/admin/members?limit=100'), { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setMembers(data.members || []);
    } catch (err) { console.error('Failed to fetch members:', err); }
  };

  const fetchCalls = async () => {
    try {
      const res = await fetch(apiUrl('/api/admin/calls?limit=50'), { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setCalls(data.sessions || []);
    } catch (err) { console.error('Failed to fetch calls:', err); }
  };

  const fetchIncidents = async () => {
    try {
      const res = await fetch(apiUrl('/api/admin/incidents'), { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setIncidents(data.incidents || []);
    } catch (err) { console.error('Failed to fetch incidents:', err); }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(apiUrl('/api/admin/messages'), { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setMessages(data.messages || []);
    } catch (err) { console.error('Failed to fetch support messages:', err); }
  };

  const fetchLandingContent = async () => {
    try {
      const res = await fetch(apiUrl('/api/admin/landing-content'));
      const data = await res.json();
      if (res.ok) setLandingContent(data.content);
    } catch (err) { console.error('Failed to fetch landing content:', err); }
  };

  const loadAllData = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchMembers(), fetchCalls(), fetchIncidents(), fetchMessages(), fetchLandingContent()]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadAllData(); }, [token]);

  const handleToggleBlock = async (targetId: string, currentStatus: string) => {
    setActionLoading(targetId);
    try {
      const isBanned = currentStatus === 'BANNED' || currentStatus === 'AI_BLOCKED';
      const endpoint = isBanned ? `/api/admin/unblock/${targetId}` : `/api/admin/block/${targetId}`;
      const res = await fetch(apiUrl(endpoint), { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) await Promise.all([fetchStats(), fetchMembers()]);
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  const handleDeleteUser = async (targetId: string, email: string) => {
    if (!window.confirm(`Permanently delete user "${email}"?\n\nThis will erase their account, profile, and all session history.`)) return;
    setActionLoading(targetId);
    try {
      const res = await fetch(apiUrl(`/api/admin/users/${targetId}`), { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) { await Promise.all([fetchStats(), fetchMembers()]); }
      else alert(data.error || 'Failed to delete user.');
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  const handleDeleteCall = async (callId: string) => {
    if (!window.confirm('Permanently delete this call session record?')) return;
    try {
      const res = await fetch(apiUrl(`/api/admin/calls/${callId}`), { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) await Promise.all([fetchStats(), fetchCalls()]);
    } catch (err) { console.error(err); }
  };

  const handleDeleteIncident = async (incidentId: string) => {
    if (!window.confirm('Delete this incident record?')) return;
    try {
      const res = await fetch(apiUrl(`/api/admin/incidents/${incidentId}`), { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) await Promise.all([fetchStats(), fetchIncidents()]);
    } catch (err) { console.error(err); }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!window.confirm('Delete this support ticket?')) return;
    try {
      const res = await fetch(apiUrl(`/api/admin/messages/${msgId}`), { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) await fetchMessages();
    } catch (err) { console.error(err); }
  };

  const handleSendAdminEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingEmail(true);
    setEmailError(null);
    setEmailSuccess(null);
    try {
      const res = await fetch(apiUrl('/api/admin/send-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ to: composerTo.trim().toLowerCase(), subject: composerSubject.trim(), message: composerMessage.trim(), ticketId: composerTicketId || undefined })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch email.');
      setEmailSuccess(`Email delivered to ${composerTo}!`);
      setComposerSubject('');
      setComposerMessage('');
      setComposerTicketId(null);
      await fetchMessages();
    } catch (err: any) { setEmailError(err.message); }
    finally { setSendingEmail(false); }
  };

  const handleStartReply = (msg: SupportMessageItem) => {
    setComposerTo(msg.email);
    setComposerSubject(msg.subject.startsWith('Re:') ? msg.subject : `Re: ${msg.subject}`);
    setComposerTicketId(msg._id);
    setActiveTab('email');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleComposeToUser = (userEmail: string) => {
    setComposerTo(userEmail);
    setComposerSubject('Message from VibeMeet Operations');
    setComposerTicketId(null);
    setActiveTab('email');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  const publishLandingContent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!landingContent) return;
    setPublishingContent(true); setContentSuccess(null);
    try {
      const res = await fetch(apiUrl('/api/admin/landing-content'), { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(landingContent) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not publish landing content');
      setLandingContent(data.content); setContentSuccess('Published — the landing page updates for all visitors within 30 seconds.');
    } catch (err: any) { setContentSuccess(err.message); }
    finally { setPublishingContent(false); }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) return;

    if (!window.confirm('Are you absolutely sure? This will send an email and in-app notification to ALL active users.')) {
      return;
    }

    setBroadcasting(true);
    setBroadcastSuccess(null);
    setBroadcastError(null);
    try {
      const res = await fetch(apiUrl('/api/admin/broadcast'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject: broadcastSubject, message: broadcastMessage }),
      });
      const data = await res.json();
      if (res.ok) {
        setBroadcastSuccess(data.message || 'Broadcast initiated successfully.');
        setBroadcastSubject('');
        setBroadcastMessage('');
        setTimeout(() => setBroadcastSuccess(null), 5000);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error(err);
      setBroadcastError(err.message || 'Failed to send broadcast.');
    } finally {
      setBroadcasting(false);
    }
  };

  const handleCreateEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!landingContent) return;
    const updatedContent = {
      ...landingContent,
      occasion: {
        title: eventFormData.title,
        description: eventFormData.description,
        badge: eventFormData.badge,
        imageUrl: eventFormData.imageUrl,
        expiresAt: eventFormData.expiresAt || undefined,
        active: true
      }
    };
    setLandingContent(updatedContent);
    setShowEventModal(false);
    setContentSuccess('Event updated in studio. Click "Publish to landing page" to make it live.');
  };

  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.username?.toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (statusFilter === 'ACTIVE') return m.accountStatus === 'ACTIVE';
    if (statusFilter === 'BANNED') return m.accountStatus === 'BANNED' || m.accountStatus === 'AI_BLOCKED' || m.accountStatus === 'SUSPENDED';
    return true;
  });

  const pendingMessagesCount = messages.filter(m => m.status === 'PENDING').length;

  const navItems: { id: TabId; label: string; icon: React.ElementType; badge?: string | number | null }[] = [
    { id: 'overview', label: 'Live Overview', icon: Activity },
    { id: 'campaigns', label: 'Landing Studio', icon: Sparkles },
    { id: 'investigation', label: 'Investigate User', icon: UserSearch },
    { id: 'broadcasts', label: 'Broadcasts', icon: Megaphone },
    { id: 'users', label: 'User Directory', icon: Users, badge: stats?.totalUsers },
    { id: 'calls', label: 'Call Monitor', icon: Video, badge: stats?.activeCalls ? `${stats.activeCalls} live` : null },
    { id: 'incidents', label: 'Safety & Incidents', icon: AlertTriangle, badge: stats?.criticalIncidents || null },
    { id: 'email', label: 'Email & Support', icon: Mail, badge: pendingMessagesCount > 0 ? pendingMessagesCount : null },
  ];

  const Avatar: React.FC<{ name: string; img?: string; size?: number }> = ({ name, img, size = 9 }) => (
    img
      ? <img src={img} alt={name} className={`w-${size} h-${size} rounded-full object-cover ring-2 ring-white/10`} />
      : <div className={`w-${size} h-${size} rounded-full flex items-center justify-center font-bold text-sm shrink-0`}
        style={{ background: 'linear-gradient(135deg,#ec4899,#8b5cf6)', color: '#fff' }}>
        {name?.charAt(0)?.toUpperCase() || '?'}
      </div>
  );

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const isActive = status === 'ACTIVE';
    return (
      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide border ${isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-red-400'}`} style={{ boxShadow: isActive ? '0 0 4px #34d399' : '0 0 4px #f87171' }} />
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex text-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif", background: '#02040a' }}>

      {/* ─── Energetic Ambient Glows ─── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full opacity-[0.25] blur-[120px] animate-pulse" style={{ background: 'radial-gradient(circle, #ec4899, transparent)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full opacity-[0.25] blur-[100px] animate-pulse" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', animationDelay: '2s' }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      </div>

      {/* ─── Sidebar ─── */}
      <aside className="relative z-10 w-64 flex-col hidden md:flex"
        style={{ background: 'linear-gradient(180deg, rgba(15,18,35,0.97) 0%, rgba(10,12,22,0.98) 100%)', borderRight: '1px solid rgba(255,255,255,0.07)' }}>

        {/* Brand */}
        <div className="p-5 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)', boxShadow: '0 4px 20px rgba(139,92,246,0.4)' }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-white block" style={{ background: 'linear-gradient(90deg,#f9a8d4,#c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>VibeMeet</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400/70">Admin Console</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 mt-2">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group"
                style={isActive
                  ? { background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 30px rgba(236,72,153,0.3), inset 0 2px 10px rgba(255,255,255,0.2)' }
                  : { background: 'transparent', border: '1px solid transparent' }
                }
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-pink-400'}`} />
                  <span className={`text-sm font-bold transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-black ${item.id === 'email' && pendingMessagesCount > 0 ? 'bg-white text-pink-600' : (isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400')}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Admin card */}
        <div className="p-3 border-t border-white/[0.07]">
          <div className="p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)' }}>
                {user.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-purple-400 font-semibold">Super Administrator</p>
              </div>
              <button onClick={handleLogout} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all" title="Sign Out">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Main workspace ─── */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">

        {/* Top Bar */}
        <header className="h-16 px-6 flex items-center justify-between backdrop-blur-xl relative z-10"
          style={{ background: 'rgba(5,8,16,0.6)', borderBottom: '1px solid rgba(236,72,153,0.15)', boxShadow: '0 4px 30px rgba(0,0,0,0.5)' }}>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Console</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-bold text-white">
              {activeTab === 'overview' && 'Live System Overview'}
              {activeTab === 'campaigns' && 'Landing Page Studio'}
              {activeTab === 'investigation' && 'User Investigation'}
              {activeTab === 'users' && 'User Directory'}
              {activeTab === 'calls' && 'Call Monitor'}
              {activeTab === 'incidents' && 'Safety & Incidents'}
              {activeTab === 'email' && 'Email & Support Center'}
              {activeTab === 'broadcasts' && 'Global Broadcasts'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAllData}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-pink-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline text-slate-400">{refreshing ? 'Refreshing…' : 'Refresh'}</span>
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all text-pink-300"
              style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.25)' }}
            >
              User View <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
              <p className="text-slate-500 text-sm">Loading system data…</p>
            </div>
          ) : (
            <>
              {/* ── Stat Cards ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Total Members', value: stats?.totalUsers ?? 0,
                    sub: `${stats?.activeUsers ?? 0} active · ${stats?.bannedUsers ?? 0} banned`,
                    icon: Users, color: '#ec4899', glow: 'rgba(236,72,153,0.3)',
                    gradient: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(139,92,246,0.05))',
                  },
                  {
                    label: 'Active Calls', value: stats?.activeCalls ?? 0,
                    sub: `${stats?.totalCalls ?? 0} total sessions`,
                    icon: Video, color: '#10b981', glow: 'rgba(16,185,129,0.3)',
                    valueColor: '#34d399', gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(52,211,153,0.05))',
                  },
                  {
                    label: 'Safety Flags', value: stats?.totalIncidents ?? 0,
                    sub: `${stats?.criticalIncidents ?? 0} critical incidents`,
                    icon: AlertTriangle, color: '#f59e0b', glow: 'rgba(245,158,11,0.3)',
                    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,191,36,0.05))',
                  },
                  {
                    label: 'Support Tickets', value: messages.length,
                    sub: `${pendingMessagesCount} pending`,
                    icon: MessageSquare, color: '#8b5cf6', glow: 'rgba(139,92,246,0.3)',
                    valueColor: '#c4b5fd', gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(167,139,250,0.05))',
                  },
                ].map(card => (
                  <div key={card.label} className="relative rounded-3xl p-6 overflow-hidden group hover:-translate-y-1 transition-transform duration-300"
                    style={{ background: card.gradient, border: `1px solid ${card.glow.replace('0.3', '0.2')}`, backdropFilter: 'blur(20px)', boxShadow: `0 8px 32px ${card.glow.replace('0.3', '0.15')}` }}>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" style={{ background: `radial-gradient(circle at 50% -20%, ${card.glow} 0%, transparent 70%)` }} />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-black uppercase tracking-widest text-white/80">{card.label}</span>
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center relative shadow-lg" style={{ background: card.color }}>
                          <div className="absolute inset-0 rounded-2xl animate-ping opacity-20" style={{ background: card.color }} />
                          <card.icon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <p className="text-5xl font-black tracking-tighter" style={{ color: (card as any).valueColor || '#fff', textShadow: `0 0 20px ${card.glow}` }}>{card.value}</p>
                      <p className="text-xs text-white/60 mt-3 font-medium">{card.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── TAB: LANDING STUDIO ── */}
              {activeTab === 'campaigns' && landingContent && (
                <form onSubmit={publishLandingContent} className="max-w-5xl mx-auto space-y-6">
                  <div className="rounded-3xl p-7 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,rgba(124,58,237,.2),rgba(236,72,153,.1))', border: '1px solid rgba(196,181,253,.22)' }}>
                    <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-pink-500/20 blur-3xl" />
                    <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-5"><div><div className="flex items-center gap-2 text-pink-300"><Sparkles className="w-5 h-5" /><span className="text-xs font-black uppercase tracking-widest">No-code publishing</span></div><h2 className="text-3xl font-black mt-3">Control the story on your landing page.</h2><p className="text-slate-300/80 mt-2 max-w-2xl">Edit occasions, offers and collaborations here. Your changes are safely stored and shown with responsive alignment across the public landing page.</p></div><span className="shrink-0 text-xs font-bold px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">● PUBLIC PAGE CONNECTED</span></div>
                  </div>
                  <div className="rounded-3xl p-6 space-y-5 flex flex-col md:flex-row gap-5 items-center justify-between" style={{ background: 'rgba(15,18,35,.82)', border: '1px solid rgba(255,255,255,.09)' }}>
                    <label className="block flex-1"><span className="text-sm font-bold text-white">Announcement ribbon</span><span className="block text-xs text-slate-500 mt-1">A concise update shown at the top of the landing page.</span><input value={landingContent.announcement} onChange={e => setLandingContent({ ...landingContent, announcement: e.target.value })} className="mt-3 w-full rounded-xl px-4 py-3 text-sm bg-black/25 border border-white/10 text-white outline-none focus:border-pink-400" /></label>
                    <button type="button" onClick={() => setShowEventModal(true)} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all shrink-0">
                      <Sparkles className="w-4 h-4" /> Create Event
                    </button>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {([
                      ['occasion', 'Occasion / event', 'badge'], ['offer', 'Offer', 'ctaLabel'], ['collaboration', 'Collaboration', 'partner']
                    ] as const).map(([key, heading, detail]) => {
                      const item = landingContent[key] || { title: '', description: '', active: false };
                      const detailValue = (item as any)[detail] || '';
                      return <div key={key} className="rounded-3xl p-6 space-y-4" style={{ background: 'rgba(15,18,35,.82)', border: '1px solid rgba(255,255,255,.09)' }}>
                        <div className="flex items-center justify-between"><h3 className="font-black">{heading}</h3><button type="button" onClick={() => setLandingContent({ ...landingContent, [key]: { ...item, active: !item.active } })} className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${item.active ? 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10' : 'text-slate-500 border-white/10'}`}>{item.active ? 'VISIBLE' : 'HIDDEN'}</button></div>
                        <input value={item.title || ''} onChange={e => setLandingContent({ ...landingContent, [key]: { ...item, title: e.target.value } })} placeholder="Headline" className="w-full rounded-xl px-3 py-2.5 text-sm bg-black/25 border border-white/10 text-white outline-none focus:border-pink-400" />
                        <textarea value={item.description || ''} onChange={e => setLandingContent({ ...landingContent, [key]: { ...item, description: e.target.value } })} placeholder="Description" rows={3} className="w-full rounded-xl px-3 py-2.5 text-sm bg-black/25 border border-white/10 text-white outline-none focus:border-pink-400 resize-none" />
                        <input value={detailValue} onChange={e => setLandingContent({ ...landingContent, [key]: { ...item, [detail]: e.target.value } })} placeholder={detail} className="w-full rounded-xl px-3 py-2.5 text-sm bg-black/25 border border-white/10 text-white outline-none focus:border-pink-400" />
                        <label className="block text-xs text-slate-400">Image URL
                          <input value={item.imageUrl || ''} onChange={e => setLandingContent({ ...landingContent, [key]: { ...item, imageUrl: e.target.value } })} placeholder="https://…" className="mt-1.5 w-full rounded-xl px-3 py-2.5 text-sm bg-black/25 border border-white/10 text-white outline-none focus:border-pink-400" />
                        </label>
                        <label className="block text-xs text-slate-400">Or upload image <span className="text-slate-600">(max 3 MB)</span>
                          <input type="file" accept="image/*" onChange={e => setPostImage(key, e.target.files?.[0])} className="mt-1.5 block w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-pink-500/15 file:px-3 file:py-2 file:text-pink-200" />
                        </label>
                        {item.imageUrl && <img src={item.imageUrl} alt="Post preview" className="h-28 w-full rounded-xl object-cover border border-white/10" />}
                        <label className="block text-xs text-slate-400">Hide automatically after
                          <input type="datetime-local" value={item.expiresAt ? item.expiresAt.slice(0, 16) : ''} onChange={e => setLandingContent({ ...landingContent, [key]: { ...item, expiresAt: e.target.value || undefined } })} className="mt-1.5 w-full rounded-xl px-3 py-2.5 text-sm bg-black/25 border border-white/10 text-white outline-none focus:border-pink-400" />
                        </label>
                      </div>;
                    })}
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl p-5" style={{ background: 'rgba(15,18,35,.82)', border: '1px solid rgba(255,255,255,.09)' }}><p className={`text-sm ${contentSuccess?.startsWith('Published') ? 'text-emerald-300' : 'text-red-300'}`}>{contentSuccess || 'Ready to publish your changes.'}</p><button disabled={publishingContent} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black bg-gradient-to-r from-pink-500 to-violet-600 disabled:opacity-60"><Send className="w-4 h-4" />{publishingContent ? 'Publishing…' : 'Publish to landing page'}</button></div>
                </form>
              )}

              {/* ── TAB: INVESTIGATE USER ── */}
              {activeTab === 'investigation' && (
                <div className="space-y-6">
                  {/* Hero search card */}
                  <div className="rounded-3xl p-7 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,rgba(56,189,248,0.12),rgba(139,92,246,0.10))', border: '1px solid rgba(125,211,252,0.2)' }}>
                    <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full opacity-20" style={{ background: 'radial-gradient(circle,#7dd3fc,transparent)' }} />
                    <div className="relative">
                      <div className="flex items-center gap-2 text-sky-300 mb-3">
                        <UserSearch className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-widest">Admin Intelligence Tool</span>
                      </div>
                      <h2 className="text-3xl font-black mb-1">Investigate a User</h2>
                      <p className="text-slate-300/70 mb-6 max-w-xl">Search by username or email to pull up a complete dossier — call history, moderation flags, account creation, login details and more.</p>
                      <form onSubmit={handleInvestigationSearch} className="flex gap-3 max-w-xl">
                        <div className="relative flex-1">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input
                            value={investigationQuery}
                            onChange={e => setInvestigationQuery(e.target.value)}
                            placeholder="Enter username or email address…"
                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm text-white outline-none transition-all"
                            style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(125,211,252,0.25)' }}
                            onFocus={e => (e.target.style.borderColor = 'rgba(125,211,252,0.6)')}
                            onBlur={e => (e.target.style.borderColor = 'rgba(125,211,252,0.25)')}
                          />
                        </div>
                        <button type="submit" disabled={investigationLoading}
                          className="px-6 py-3.5 rounded-2xl text-sm font-black text-white disabled:opacity-60 transition-all"
                          style={{ background: 'linear-gradient(135deg,#0ea5e9,#7c3aed)', boxShadow: '0 4px 20px rgba(14,165,233,0.3)' }}>
                          {investigationLoading ? 'Searching…' : 'Investigate'}
                        </button>
                      </form>
                      {investigationError && <p className="mt-4 text-sm text-red-400 font-semibold">{investigationError}</p>}
                    </div>
                  </div>

                  {investigationResult && (() => {
                    const { user: u, calls: uCalls, incidents: uIncidents } = investigationResult;
                    const blockCount = uIncidents.filter(i => i.finalAction?.toLowerCase().includes('ban') || i.finalAction?.toLowerCase().includes('block')).length;
                    return (
                      <div className="space-y-5">
                        {/* Profile header card */}
                        <div className="rounded-3xl p-6 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(15,18,35,0.9), rgba(10,12,22,0.95))', border: '1px solid rgba(14,165,233,0.2)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)' }}>
                          <div className="absolute top-[-50px] right-[-50px] w-[300px] h-[300px] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />
                          <div className="relative z-10 flex flex-col sm:flex-row items-start gap-5">
                            {u.profileImage
                              ? <img src={u.profileImage} alt={u.name} className="w-20 h-20 rounded-2xl object-cover ring-2 ring-white/10 shrink-0" />
                              : <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-black text-2xl shrink-0" style={{ background: 'linear-gradient(135deg,#ec4899,#8b5cf6)' }}>{u.name?.charAt(0)?.toUpperCase()}</div>
                            }
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-3 mb-1">
                                <h3 className="text-2xl font-black">{u.name}</h3>
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wide ${u.accountStatus === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>{u.accountStatus}</span>
                                {u.isOnline && <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />ONLINE NOW</span>}
                              </div>
                              <p className="text-slate-400 text-sm">{u.username ? `@${u.username}` : ''} · {u.email}</p>
                              <p className="text-slate-500 text-xs mt-1">{u.gender || '—'} → {u.preferredGender || '—'} · Role: <span className="text-purple-400 font-bold">{u.role}</span></p>
                            </div>
                            <button onClick={handleDownloadReport}
                              className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black transition-all"
                              style={{ background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.3)', color: '#7dd3fc' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(14,165,233,0.22)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(14,165,233,0.12)')}>
                              <Download className="w-4 h-4" /> Download Report
                            </button>
                          </div>

                          {/* Metric pills */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                            {[
                              { label: 'Account Created', value: new Date(u.createdAt).toLocaleDateString(), sub: new Date(u.createdAt).toLocaleTimeString() },
                              { label: 'Last Login', value: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never', sub: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleTimeString() : '' },
                              { label: 'Total Calls', value: String(uCalls.length), sub: 'sessions recorded' },
                              { label: 'Times Blocked', value: String(blockCount), sub: `of ${uIncidents.length} incidents` },
                            ].map(m => (
                              <div key={m.label} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{m.label}</p>
                                <p className="text-xl font-black text-white">{m.value}</p>
                                {m.sub && <p className="text-[10px] text-slate-600 mt-0.5">{m.sub}</p>}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Call history */}
                        <div className="rounded-3xl overflow-hidden relative" style={{ background: 'linear-gradient(180deg, rgba(15,18,35,0.9), rgba(10,12,22,0.95))', border: '1px solid rgba(16,185,129,0.2)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)' }}>
                          <div className="p-5 border-b border-white/[0.07] flex items-center gap-3 relative z-10">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}><PhoneCall className="w-4 h-4 text-emerald-400" /></div>
                            <div><h4 className="font-black">Call History</h4><p className="text-[11px] text-slate-500">{uCalls.length} sessions found</p></div>
                          </div>
                          {uCalls.length === 0 ? (
                            <div className="py-12 text-center text-slate-500"><PhoneCall className="w-8 h-8 mx-auto mb-2 opacity-40" /><p>No call sessions recorded.</p></div>
                          ) : (
                            <div className="overflow-x-auto relative z-10">
                              <table className="w-full text-sm">
                                <thead><tr style={{ borderBottom: '1px solid rgba(16,185,129,0.15)', background: 'rgba(16,185,129,0.02)' }}>
                                  {['Date & Time', 'Partner Name', 'Partner Email', 'Status', 'Duration'].map((h, i) => (
                                    <th key={h} className={`px-5 py-3 text-[11px] font-black uppercase tracking-widest text-emerald-200/80 ${i === 0 ? 'text-left' : 'text-left'}`}>{h}</th>
                                  ))}
                                </tr></thead>
                                <tbody>
                                  {uCalls.map(c => {
                                    const partner = c.userA?._id === u._id ? c.userB : c.userA;
                                    const dur = c.startedAt && c.endedAt ? Math.round((new Date(c.endedAt).getTime() - new Date(c.startedAt).getTime()) / 1000) : null;
                                    return (
                                      <tr key={c._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                        <td className="px-5 py-3.5 text-xs text-slate-400">
                                          <p className="font-semibold text-white">{new Date(c.createdAt).toLocaleDateString()}</p>
                                          <p>{new Date(c.createdAt).toLocaleTimeString()}</p>
                                        </td>
                                        <td className="px-5 py-3.5 font-semibold">{partner?.name || <span className="text-slate-600 italic">Unknown</span>}</td>
                                        <td className="px-5 py-3.5 font-mono text-xs text-slate-400">{partner?.email || '—'}</td>
                                        <td className="px-5 py-3.5">
                                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${c.status === 'ACTIVE' ? 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25' : 'bg-white/5 text-slate-400 border-white/10'}`}>{c.status}</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-slate-400">{dur !== null ? `${dur}s` : '—'}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* Incident log */}
                        <div className="rounded-3xl overflow-hidden relative" style={{ background: 'linear-gradient(180deg, rgba(15,18,35,0.9), rgba(10,12,22,0.95))', border: '1px solid rgba(245,158,11,0.2)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)' }}>
                          <div className="p-5 border-b border-white/[0.07] flex items-center gap-3 relative z-10">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)' }}><AlertTriangle className="w-4 h-4 text-red-400" /></div>
                            <div><h4 className="font-black">Moderation & Flag History</h4><p className="text-[11px] text-slate-500">{uIncidents.length} incidents · {blockCount} resulted in block/ban</p></div>
                          </div>
                          {uIncidents.length === 0 ? (
                            <div className="py-12 text-center text-slate-500"><CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-600 opacity-60" /><p>No moderation incidents. Clean record.</p></div>
                          ) : (
                            <div className="overflow-x-auto relative z-10">
                              <table className="w-full text-sm">
                                <thead><tr style={{ borderBottom: '1px solid rgba(245,158,11,0.15)', background: 'rgba(245,158,11,0.02)' }}>
                                  {['Date', 'Source', 'Categories', 'Risk', 'Action', 'Status'].map(h => (
                                    <th key={h} className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-widest text-yellow-200/80">{h}</th>
                                  ))}
                                </tr></thead>
                                <tbody>
                                  {uIncidents.map(inc => (
                                    <tr key={inc._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                      <td className="px-5 py-3.5 text-xs text-slate-400">{new Date(inc.createdAt).toLocaleString()}</td>
                                      <td className="px-5 py-3.5 text-xs font-mono text-slate-300">{inc.source}</td>
                                      <td className="px-5 py-3.5"><div className="flex flex-wrap gap-1">{inc.categories.map(cat => <span key={cat} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">{cat}</span>)}</div></td>
                                      <td className="px-5 py-3.5"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${riskColors[inc.riskLevel] || ''}`}>{inc.riskLevel}</span></td>
                                      <td className="px-5 py-3.5 text-xs text-slate-300">{inc.finalAction}</td>
                                      <td className="px-5 py-3.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">{inc.status}</span></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ── TAB: OVERVIEW ── */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Recent Users */}
                  <div className="rounded-3xl p-6 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(15,18,35,0.9), rgba(10,12,22,0.95))', border: '1px solid rgba(236,72,153,0.2)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)' }}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-[80px] pointer-events-none" />
                    <div className="relative z-10 flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}>
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-black text-lg text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-white">Latest Members</h3>
                      </div>
                      <button onClick={() => setActiveTab('users')} className="text-xs font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1 bg-pink-500/10 px-3 py-1.5 rounded-full border border-pink-500/20 transition-all hover:bg-pink-500/20">
                        View all <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {recentUsers.length === 0 ? (
                      <div className="py-12 text-center">
                        <Users className="w-10 h-10 mx-auto text-pink-500/30 mb-3" />
                        <p className="text-slate-400 text-sm font-semibold">No users yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {recentUsers.map(u => (
                          <div key={u._id} className="flex items-center justify-between py-3 px-3 rounded-2xl hover:bg-white/[0.03] transition-colors">
                            <div className="flex items-center gap-3">
                              <Avatar name={u.name} img={u.profileImage} />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-semibold text-white">{u.name}</span>
                                  {u.role === 'ADMIN' && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase">Admin</span>
                                  )}
                                </div>
                                <span className="text-xs text-slate-500">{u.email}</span>
                              </div>
                            </div>
                            <StatusBadge status={u.accountStatus} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* System Health */}
                  <div className="rounded-3xl p-6 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(15,18,35,0.9), rgba(10,12,22,0.95))', border: '1px solid rgba(139,92,246,0.2)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)' }}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
                    <div className="relative z-10 flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-black text-lg text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-white">System Health</h3>
                    </div>

                    <div className="space-y-3">
                      {[
                        { icon: Database, label: 'MongoDB Database', sub: 'MongoDB Atlas Cluster (Production)', status: 'CONNECTED', color: '#10b981' },
                        { icon: Wifi, label: 'WebRTC Signaling', sub: 'Socket.IO Real-time Engine', status: 'ONLINE', color: '#10b981' },
                        { icon: Bot, label: 'AI Content Moderation', sub: 'Groq LLaMA 3.3 Safety Filter', status: 'ACTIVE', color: '#10b981' },
                        { icon: Mail, label: 'SMTP Email Dispatch', sub: 'smtp.gmail.com · logiterax@gmail.com', status: 'CONFIGURED', color: '#10b981' },
                      ].map(svc => (
                        <div key={svc.label} className="flex items-center justify-between p-4 rounded-2xl transition-transform hover:-translate-y-0.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 15px rgba(16,185,129,0.2)' }}>
                              <svc.icon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">{svc.label}</p>
                              <p className="text-[11px] text-slate-400">{svc.sub}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full shadow-inner" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>
                            {svc.status}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="relative z-10 mt-6 pt-5 border-t border-white/[0.1] flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span>Server <strong className="text-slate-300">:5000</strong> · Client <strong className="text-slate-300">:5175</strong></span>
                      <span className="font-mono px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20" style={{ color: '#f472b6' }}>VibeMeet Engine v2.0</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB: USER DIRECTORY ── */}
              {activeTab === 'users' && (
                <div className="rounded-3xl overflow-hidden relative" style={{ background: 'linear-gradient(180deg, rgba(15,18,35,0.9), rgba(10,12,22,0.95))', border: '1px solid rgba(236,72,153,0.2)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)' }}>
                  <div className="absolute top-[-50px] right-[-50px] w-[300px] h-[300px] bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />
                  <div className="p-6 border-b border-white/[0.07] flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search name, email, @username…"
                        className="w-full pl-10 pr-4 py-2.5 text-sm text-white rounded-xl focus:outline-none transition-all"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                        onFocus={e => (e.target.style.borderColor = 'rgba(236,72,153,0.5)')}
                        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      {(['ALL', 'ACTIVE', 'BANNED'] as const).map(f => (
                        <button
                          key={f}
                          onClick={() => setStatusFilter(f)}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                          style={statusFilter === f
                            ? { background: 'linear-gradient(135deg,#ec4899,#8b5cf6)', color: '#fff', boxShadow: '0 4px 12px rgba(236,72,153,0.3)' }
                            : { background: 'rgba(255,255,255,0.05)', color: 'rgba(148,163,184,0.8)', border: '1px solid rgba(255,255,255,0.08)' }
                          }
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                    <span className="text-xs text-slate-500 ml-auto whitespace-nowrap">{filteredMembers.length} results</span>
                  </div>

                  <div className="overflow-x-auto relative z-10">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(236,72,153,0.15)', background: 'rgba(236,72,153,0.02)' }}>
                          {['User', 'Email', 'Role', 'Gender', 'Status', 'Actions'].map((h, i) => (
                            <th key={h} className={`px-6 py-4 text-[11px] font-black uppercase tracking-widest text-pink-200/80 ${i === 5 ? 'text-right' : 'text-left'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMembers.length === 0 ? (
                          <tr><td colSpan={6} className="py-16 text-center text-slate-500">No members match your criteria.</td></tr>
                        ) : (
                          filteredMembers.map(m => (
                            <tr key={m._id} className="group transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <Avatar name={m.name} img={m.profileImage} size={8} />
                                  <div>
                                    <p className="font-semibold text-white text-sm">{m.name}</p>
                                    <p className="text-[11px] text-slate-500">{m.username ? `@${m.username}` : '—'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 font-mono text-xs text-slate-400">{m.email}</td>
                              <td className="px-6 py-4">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${m.role === 'ADMIN' ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
                                  {m.role}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-400">{m.gender || '—'} → {m.preferredGender || '—'}</td>
                              <td className="px-6 py-4"><StatusBadge status={m.accountStatus} /></td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => handleComposeToUser(m.email)}
                                    className="p-2 rounded-xl transition-all" title="Send email"
                                    style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.25)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.12)')}>
                                    <Mail size={13} />
                                  </button>
                                  {m._id !== user._id && (
                                    <>
                                      <button
                                        onClick={() => handleToggleBlock(m._id, m.accountStatus)}
                                        disabled={actionLoading === m._id}
                                        className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all disabled:opacity-50"
                                        style={m.accountStatus === 'ACTIVE'
                                          ? { background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }
                                          : { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }
                                        }
                                      >
                                        {actionLoading === m._id ? '…' : m.accountStatus === 'ACTIVE' ? 'Block' : 'Unblock'}
                                      </button>
                                      <button onClick={() => handleDeleteUser(m._id, m.email)}
                                        disabled={actionLoading === m._id}
                                        className="p-2 rounded-xl transition-all disabled:opacity-50" title="Delete permanently"
                                        style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.2)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.10)')}>
                                        <Trash2 size={13} />
                                      </button>
                                    </>
                                  )}
                                  {m._id === user._id && <span className="text-[11px] text-slate-600 italic">You</span>}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── TAB: CALL SESSIONS ── */}
              {activeTab === 'calls' && (
                <div className="rounded-3xl overflow-hidden relative" style={{ background: 'linear-gradient(180deg, rgba(15,18,35,0.9), rgba(10,12,22,0.95))', border: '1px solid rgba(16,185,129,0.2)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)' }}>
                  <div className="absolute top-[-50px] right-[-50px] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
                  <div className="p-6 border-b border-white/[0.07] flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
                      <Video className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Call Sessions Log</h3>
                      <p className="text-xs text-slate-500">{calls.length} sessions recorded in database</p>
                    </div>
                  </div>

                  {calls.length === 0 ? (
                    <div className="py-20 text-center">
                      <PhoneCall className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                      <p className="text-slate-400 font-semibold">No call sessions yet</p>
                      <p className="text-slate-600 text-sm mt-1">Sessions will appear here once users start video calls.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto relative z-10">
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(16,185,129,0.15)', background: 'rgba(16,185,129,0.02)' }}>
                            {['Session ID', 'User A', 'User B', 'Status', 'Timestamp', 'Action'].map((h, i) => (
                              <th key={h} className={`px-6 py-4 text-[11px] font-black uppercase tracking-widest text-emerald-200/80 ${i === 5 ? 'text-right' : 'text-left'}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {calls.map(c => (
                            <tr key={c._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              <td className="px-6 py-4 font-mono text-xs text-slate-500">…{c._id.slice(-8)}</td>
                              <td className="px-6 py-4">
                                <p className="font-semibold text-white">{c.userA?.name || 'Unknown'}</p>
                                <p className="text-[11px] text-slate-500">{c.userA?.email}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-semibold text-white">{c.userB?.name || 'Unknown'}</p>
                                <p className="text-[11px] text-slate-500">{c.userB?.email}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${c.status === 'ACTIVE' ? 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25' : 'bg-white/5 text-slate-400 border-white/10'}`}>
                                  {c.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-400">{new Date(c.createdAt).toLocaleString()}</td>
                              <td className="px-6 py-4 text-right">
                                <button onClick={() => handleDeleteCall(c._id)}
                                  className="p-2 rounded-xl transition-all" title="Delete record"
                                  style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
                                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.2)')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.10)')}>
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB: INCIDENTS ── */}
              {activeTab === 'incidents' && (
                <div className="rounded-3xl overflow-hidden relative" style={{ background: 'linear-gradient(180deg, rgba(15,18,35,0.9), rgba(10,12,22,0.95))', border: '1px solid rgba(245,158,11,0.2)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)' }}>
                  <div className="absolute top-[-50px] right-[-50px] w-[300px] h-[300px] bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none" />
                  <div className="p-6 border-b border-white/[0.07] flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)' }}>
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">AI Moderation Incidents</h3>
                      <p className="text-xs text-slate-500">{incidents.length} incidents flagged · {stats?.criticalIncidents ?? 0} critical</p>
                    </div>
                  </div>

                  {incidents.length === 0 ? (
                    <div className="py-20 text-center">
                      <CheckCircle className="w-10 h-10 mx-auto text-emerald-500 mb-3" />
                      <p className="text-slate-300 font-semibold">Clean record</p>
                      <p className="text-slate-600 text-sm mt-1">No moderation incidents have been flagged.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                            {['User', 'Source', 'Risk Level', 'Action Taken', 'Date', 'Action'].map((h, i) => (
                              <th key={h} className={`px-6 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 ${i === 5 ? 'text-right' : 'text-left'}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {incidents.map(inc => (
                            <tr key={inc._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              <td className="px-6 py-4">
                                <p className="font-semibold text-white">{inc.userId?.name || 'Unknown'}</p>
                                <p className="text-[11px] text-slate-500">{inc.userId?.email}</p>
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-400">{inc.source}</td>
                              <td className="px-6 py-4">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${riskColors[inc.riskLevel] || 'bg-slate-500/20 text-slate-300'}`}>
                                  {inc.riskLevel}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-300 max-w-[200px] truncate">{inc.finalAction || inc.recommendedAction}</td>
                              <td className="px-6 py-4 text-xs text-slate-400">{new Date(inc.createdAt).toLocaleString()}</td>
                              <td className="px-6 py-4 text-right">
                                <button onClick={() => handleDeleteIncident(inc._id)}
                                  className="p-2 rounded-xl transition-all" title="Delete record"
                                  style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
                                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.2)')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.10)')}>
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB: BROADCASTS ── */}
              {activeTab === 'broadcasts' && (
                <div className="rounded-3xl p-6 sm:p-8 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(15,18,35,0.9), rgba(10,12,22,0.95))', border: '1px solid rgba(56,189,248,0.3)', backdropFilter: 'blur(20px)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                  <div className="absolute top-[-50px] right-[-50px] w-[300px] h-[300px] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />
                  <div className="relative z-10 flex items-center gap-4 mb-6 pb-5 border-b border-white/[0.07]">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{ background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', boxShadow: '0 4px 16px rgba(14,165,233,0.35)' }}>
                      <Megaphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Global Broadcast</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Send a major update to ALL active members via Email & In-App Notification.</p>
                    </div>
                  </div>

                  {broadcastSuccess && (
                    <div className="mb-5 p-4 rounded-2xl flex items-center gap-3 text-sm text-emerald-200"
                      style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                      {broadcastSuccess}
                    </div>
                  )}
                  {broadcastError && (
                    <div className="mb-5 p-4 rounded-2xl flex items-center gap-3 text-sm text-red-200"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <AlertCircle size={18} className="text-red-400 shrink-0" />
                      {broadcastError}
                    </div>
                  )}

                  <form onSubmit={handleSendBroadcast} className="space-y-4 relative z-10">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-sky-400 mb-2">Broadcast Subject</label>
                      <input type="text" value={broadcastSubject} onChange={e => setBroadcastSubject(e.target.value)}
                        placeholder="e.g. Major Platform Update: New Features!" required
                        className="w-full px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none transition-all"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                        onFocus={e => (e.target.style.borderColor = 'rgba(56,189,248,0.6)')}
                        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-sky-400 mb-2">Message Body</label>
                      <textarea rows={8} value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)}
                        placeholder="Type the full message to broadcast to all members…" required
                        className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none resize-none leading-relaxed transition-all"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                        onFocus={e => (e.target.style.borderColor = 'rgba(56,189,248,0.6)')}
                        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-3">
                      <span className="text-xs text-slate-500 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        Warning: This action cannot be undone.
                      </span>
                      <button type="submit" disabled={broadcasting}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl font-black text-sm text-white transition-all disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', boxShadow: '0 4px 20px rgba(14,165,233,0.4)' }}>
                        {broadcasting ? 'Broadcasting…' : <><Megaphone size={16} /> Broadcast to All Users</>}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ── TAB: EMAIL & SUPPORT ── */}
              {activeTab === 'email' && (
                <div className="space-y-6">

                  {/* Email Composer */}
                  <div className="rounded-3xl p-6 sm:p-8 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(15,18,35,0.9), rgba(10,12,22,0.95))', border: '1px solid rgba(139,92,246,0.3)', backdropFilter: 'blur(20px)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                    <div className="absolute top-[-50px] right-[-50px] w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
                    <div className="relative z-10 flex items-center justify-between mb-6 pb-5 border-b border-white/[0.07]">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
                          style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}>
                          <Send className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-base">Direct Email Composer</h3>
                          <p className="text-xs text-slate-500 mt-0.5">Dispatch an official branded email to any user</p>
                        </div>
                      </div>
                      {composerTicketId && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-pink-300"
                          style={{ background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.3)' }}>
                          <Reply size={13} /> Replying to ticket
                          <button onClick={() => setComposerTicketId(null)} className="ml-1 hover:text-white transition-colors"><X size={13} /></button>
                        </div>
                      )}
                    </div>

                    {emailSuccess && (
                      <div className="mb-5 p-4 rounded-2xl flex items-center gap-3 text-sm text-emerald-200"
                        style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                        {emailSuccess}
                      </div>
                    )}
                    {emailError && (
                      <div className="mb-5 p-4 rounded-2xl flex items-center gap-3 text-sm text-red-200"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <AlertCircle size={18} className="text-red-400 shrink-0" />
                        {emailError}
                      </div>
                    )}

                    <form onSubmit={handleSendAdminEmail} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Recipient Email</label>
                          <input type="email" value={composerTo} onChange={e => setComposerTo(e.target.value)}
                            placeholder="user@example.com" required
                            className="w-full px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none transition-all"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                            onFocus={e => (e.target.style.borderColor = 'rgba(139,92,246,0.6)')}
                            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Quick Fill — Registered Member</label>
                          <select onChange={e => { if (e.target.value) setComposerTo(e.target.value); }} defaultValue=""
                            className="w-full px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none transition-all"
                            style={{ background: 'rgba(20,18,35,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <option value="">Select a member…</option>
                            {members.map(m => <option key={m._id} value={m.email}>{m.name} ({m.email})</option>)}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Subject Line</label>
                        <input type="text" value={composerSubject} onChange={e => setComposerSubject(e.target.value)}
                          placeholder="e.g. Account notice from VibeMeet Operations" required
                          className="w-full px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none transition-all"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                          onFocus={e => (e.target.style.borderColor = 'rgba(139,92,246,0.6)')}
                          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Message</label>
                        <textarea rows={6} value={composerMessage} onChange={e => setComposerMessage(e.target.value)}
                          placeholder="Type your official message…" required
                          className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none resize-none leading-relaxed transition-all"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                          onFocus={e => (e.target.style.borderColor = 'rgba(139,92,246,0.6)')}
                          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-slate-500">Dispatched via <strong className="text-slate-400">logiterax@gmail.com</strong> with VibeMeet logo header</span>
                        <button type="submit" disabled={sendingEmail}
                          className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50"
                          style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}>
                          {sendingEmail ? 'Dispatching…' : <><Send size={14} /> Send Email</>}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Inbox */}
                  <div className="rounded-3xl overflow-hidden relative" style={{ background: 'linear-gradient(180deg, rgba(15,18,35,0.9), rgba(10,12,22,0.95))', border: '1px solid rgba(236,72,153,0.3)', backdropFilter: 'blur(20px)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                    <div className="absolute top-[-50px] right-[-50px] w-[300px] h-[300px] bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />
                    <div className="p-6 border-b border-white/[0.07] flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(236,72,153,0.15)' }}>
                          <MessageSquare className="w-4 h-4 text-pink-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white">Support Inbox</h3>
                          <p className="text-xs text-slate-500">{messages.length} tickets · {pendingMessagesCount} awaiting reply</p>
                        </div>
                      </div>
                      {pendingMessagesCount > 0 && (
                        <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ background: 'linear-gradient(135deg,#ec4899,#8b5cf6)' }}>
                          {pendingMessagesCount} New
                        </span>
                      )}
                    </div>

                    {messages.length === 0 ? (
                      <div className="py-20 text-center">
                        <Mail className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                        <p className="text-slate-400 font-semibold">Inbox is empty</p>
                        <p className="text-slate-600 text-sm mt-1">Messages from the Contact form will appear here.</p>
                      </div>
                    ) : (
                      <div className="p-4 space-y-3">
                        {messages.map(msg => (
                          <div key={msg._id} className="p-5 rounded-2xl transition-all"
                            style={{
                              background: msg.status === 'PENDING' ? 'rgba(236,72,153,0.05)' : 'rgba(255,255,255,0.02)',
                              border: msg.status === 'PENDING' ? '1px solid rgba(236,72,153,0.2)' : '1px solid rgba(255,255,255,0.06)',
                            }}>
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                              <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                                  style={{ background: 'linear-gradient(135deg,rgba(236,72,153,0.3),rgba(139,92,246,0.3))' }}>
                                  {msg.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-white text-sm">{msg.name}</span>
                                    <span className="text-xs text-slate-500 font-mono">{msg.email}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${msg.status === 'PENDING' ? 'bg-pink-500/15 text-pink-300 border-pink-500/30' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'}`}>
                                      {msg.status}
                                    </span>
                                    {msg.category && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10 uppercase">{msg.category}</span>}
                                  </div>
                                  <p className="text-sm font-semibold text-pink-300 mt-1">{msg.subject}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                  <Clock size={11} /> {new Date(msg.createdAt).toLocaleString()}
                                </span>
                                <button onClick={() => handleStartReply(msg)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all"
                                  style={{ background: 'linear-gradient(135deg,#ec4899,#8b5cf6)', boxShadow: '0 2px 10px rgba(236,72,153,0.25)' }}>
                                  <Reply size={12} /> Reply
                                </button>
                                <button onClick={() => handleDeleteMessage(msg._id)}
                                  className="p-1.5 rounded-xl transition-all text-slate-500 hover:text-red-400"
                                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap pl-12">{msg.message}</p>

                            {msg.replies && msg.replies.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-white/[0.06] pl-12 space-y-2">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Admin Replies ({msg.replies.length})</span>
                                {msg.replies.map((rep, idx) => (
                                  <div key={idx} className="p-4 rounded-xl"
                                    style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
                                    <div className="flex items-center justify-between text-[11px] text-purple-400 font-semibold mb-2">
                                      <span className="flex items-center gap-1.5"><AtSign size={11} /> {rep.senderName}</span>
                                      <span className="text-slate-500 font-normal">{new Date(rep.sentAt).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{rep.message}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      {showEventModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f1223] rounded-3xl p-6 max-w-lg w-full border border-white/10 shadow-2xl relative">
            <button onClick={() => setShowEventModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20} /></button>
            <h2 className="text-2xl font-black mb-1">Create New Event</h2>
            <p className="text-sm text-slate-400 mb-6">Enter the event details to update the landing page occasion.</p>

            <form onSubmit={handleCreateEventSubmit} className="space-y-4">
              <label className="block text-sm font-semibold">Event Title
                <input required value={eventFormData.title} onChange={e => setEventFormData({ ...eventFormData, title: e.target.value })} className="mt-1.5 w-full rounded-xl px-3 py-2 text-sm bg-black/30 border border-white/10 text-white focus:border-pink-400 outline-none" placeholder="e.g. Saturday Night Mixer" />
              </label>
              <label className="block text-sm font-semibold">Description
                <textarea required rows={2} value={eventFormData.description} onChange={e => setEventFormData({ ...eventFormData, description: e.target.value })} className="mt-1.5 w-full rounded-xl px-3 py-2 text-sm bg-black/30 border border-white/10 text-white focus:border-pink-400 outline-none resize-none" placeholder="What's happening?" />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block text-sm font-semibold">Badge Label
                  <input required value={eventFormData.badge} onChange={e => setEventFormData({ ...eventFormData, badge: e.target.value })} className="mt-1.5 w-full rounded-xl px-3 py-2 text-sm bg-black/30 border border-white/10 text-white focus:border-pink-400 outline-none" placeholder="LIVE EVENT" />
                </label>
                <label className="block text-sm font-semibold">Expires At
                  <input type="datetime-local" value={eventFormData.expiresAt} onChange={e => setEventFormData({ ...eventFormData, expiresAt: e.target.value })} className="mt-1.5 w-full rounded-xl px-3 py-2 text-sm bg-black/30 border border-white/10 text-white focus:border-pink-400 outline-none" />
                </label>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold">Image URL
                  <div className="relative mt-1.5">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input value={eventFormData.imageUrlInput} onChange={e => setEventFormData({ ...eventFormData, imageUrlInput: e.target.value, imageUrl: e.target.value })} className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-black/30 border border-white/10 text-white focus:border-pink-400 outline-none" placeholder="https://example.com/image.jpg" />
                  </div>
                </label>
                <p className="text-[11px] text-slate-500 text-center">— or upload from device —</p>
                <label className="block text-sm font-semibold">Upload Image
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => setEventFormData({ ...eventFormData, imageUrl: String(reader.result), imageUrlInput: '' });
                      reader.readAsDataURL(file);
                    }
                  }} className="mt-1.5 block w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-pink-500/15 file:px-3 file:py-2 file:text-pink-200" />
                </label>
              </div>
              {eventFormData.imageUrl && <img src={eventFormData.imageUrl} alt="Preview" className="h-24 w-full object-cover rounded-lg border border-white/10" />}

              <button type="submit" className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold tracking-wide hover:opacity-90">Set Event Data</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
