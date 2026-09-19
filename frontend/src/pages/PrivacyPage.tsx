import React from "react";
import { Link } from "react-router-dom";
import { Logo3D } from "../components/Logo3D";
import { ArrowLeft } from "lucide-react";

const PrivacyPage: React.FC = () => (
  <div className="min-h-screen text-white" style={{ background: "#0a0f1e" }}>
    <div className="fixed inset-0 pointer-events-none z-0">
      <div className="aurora-2 absolute w-[50vw] h-[50vw] rounded-full opacity-20" style={{ bottom: "-15%", right: "-15%", background: "radial-gradient(circle, #3b82f660 0%, transparent 70%)" }} />
    </div>
    <div className="relative z-10 container mx-auto px-6 py-10 max-w-3xl">
      <div className="flex items-center gap-4 mb-10">
        <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-pink-400 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex items-center gap-2 ml-auto">
          <Logo3D size={32} animate={false} />
          <span className="gradient-text font-bold">VibeMeet</span>
        </div>
      </div>
      <h1 className="text-4xl font-black mb-2 gradient-text">Privacy Policy</h1>
      <p className="text-slate-500 text-sm mb-10">Last updated: September 2026</p>

      <div className="space-y-8 text-slate-300 leading-relaxed">
        {[
          { title: "1. Information We Collect", body: "We collect information you provide during registration (name and email), profile preferences (gender, match preferences, username), and technical data (IP address, device type, browser) for security and analytics purposes." },
          { title: "2. How We Use Your Information", body: "We use your information to: provide and improve the VibeMeet service; match you with compatible users; enforce our community safety guidelines; send transactional emails (e.g., account notifications); and comply with legal obligations." },
          { title: "3. Video & Audio", body: "VibeMeet does not record or store your video or audio streams. All peer-to-peer connections are established via WebRTC and the media stream travels directly between participants. Only safety-related signals are analysed in real-time memory and are not stored." },
          { title: "4. Data Sharing", body: "We do not sell, trade, or rent your personal information to third parties. We may share data with service providers (e.g., cloud hosting) who assist us in operating the platform, subject to strict confidentiality agreements." },
          { title: "5. Cookies & Tracking", body: "We use essential cookies to maintain your session and authentication state. We do not use advertising cookies or third-party tracking pixels. You can disable cookies in your browser settings, though some features may not function correctly." },
          { title: "6. Data Retention", body: "We retain your account data for as long as your account is active. You may request deletion of your account and associated data at any time by contacting logiterax@gmail.com. Deleted data is purged within 30 days." },
          { title: "7. Security", body: "We implement industry-standard security measures including HTTPS encryption, JWT authentication, and regular security audits. However, no method of transmission over the Internet is 100% secure." },
          { title: "8. Children's Privacy", body: "VibeMeet is not intended for users under 18. We do not knowingly collect personal information from minors. If we discover that a minor has created an account, we will immediately delete it." },
          { title: "9. Your Rights", body: "Depending on your jurisdiction, you may have the right to access, correct, or delete your personal data. To exercise these rights, contact us at logiterax@gmail.com." },
          { title: "10. Changes to This Policy", body: "We may update this Privacy Policy from time to time. We will notify you of significant changes via in-app notice or email. Continued use of the service after changes means you accept the updated policy." },
          { title: "11. Contact", body: "For any privacy-related questions, contact our Data Protection Officer at logiterax@gmail.com" },
        ].map(s => (
          <section key={s.title}>
            <h2 className="text-xl font-bold text-white mb-2">{s.title}</h2>
            <p>{s.body}</p>
          </section>
        ))}
      </div>

      <div className="mt-14 pt-8 border-t border-white/10 flex justify-between items-center text-sm text-slate-500">
        <span>&copy; 2026 VibeMeet Inc.</span>
        <Link to="/terms" className="hover:text-pink-400 transition-colors">Terms &amp; Conditions &rarr;</Link>
      </div>
    </div>
  </div>
);

export default PrivacyPage;
