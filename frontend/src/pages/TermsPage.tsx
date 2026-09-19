import React from "react";
import { Link } from "react-router-dom";
import { Logo3D } from "../components/Logo3D";
import { ArrowLeft } from "lucide-react";

const TermsPage: React.FC = () => (
  <div className="min-h-screen text-white" style={{ background: "#0a0f1e" }}>
    <div className="fixed inset-0 pointer-events-none z-0">
      <div className="aurora-1 absolute w-[50vw] h-[50vw] rounded-full opacity-20" style={{ top: "-15%", left: "-15%", background: "radial-gradient(circle, #ec489960 0%, transparent 70%)" }} />
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
      <h1 className="text-4xl font-black mb-2 gradient-text">Terms &amp; Conditions</h1>
      <p className="text-slate-500 text-sm mb-10">Last updated: September 2026</p>

      <div className="space-y-8 text-slate-300 leading-relaxed">
        {[
          { title: "1. Acceptance of Terms", body: "By creating an account or using VibeMeet, you confirm that you are at least 18 years old and agree to be bound by these Terms and Conditions. If you do not agree, please do not use the service." },
          { title: "2. Eligibility", body: "You must be at least 18 years of age to use VibeMeet. By using the service you represent and warrant that you are 18 or older. VibeMeet reserves the right to terminate accounts suspected of being minors." },
          { title: "3. User Conduct", body: "You agree not to use VibeMeet for any unlawful purpose or in any way that could harm others. Prohibited conduct includes (but is not limited to): harassment, hate speech, nudity, solicitation, impersonation, and sharing of another person's private information without consent." },
          { title: "4. AI Safety Monitoring", body: "VibeMeet uses real-time AI moderation to detect policy violations during video sessions. By using the service you consent to this monitoring. No video or audio is stored; only safety-relevant signals are analysed in memory." },
          { title: "5. Intellectual Property", body: "All content, trademarks, and other intellectual property on VibeMeet are owned by VibeMeet Inc. You may not reproduce, distribute, or create derivative works without explicit written permission." },
          { title: "6. Disclaimer of Warranties", body: "VibeMeet is provided on an 'as is' and 'as available' basis without warranties of any kind, either express or implied. We do not guarantee uninterrupted access or freedom from errors." },
          { title: "7. Limitation of Liability", body: "VibeMeet Inc. shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service." },
          { title: "8. Termination", body: "We may suspend or terminate your account at our discretion for violations of these terms or for any other reason, with or without notice." },
          { title: "9. Changes to Terms", body: "We may update these Terms at any time. Continued use of the service after changes constitutes acceptance of the new Terms. We will notify you of material changes via email or in-app notice." },
          { title: "10. Contact", body: "For questions about these Terms, contact us at logiterax@gmail.com" },
        ].map(s => (
          <section key={s.title}>
            <h2 className="text-xl font-bold text-white mb-2">{s.title}</h2>
            <p>{s.body}</p>
          </section>
        ))}
      </div>

      <div className="mt-14 pt-8 border-t border-white/10 flex justify-between items-center text-sm text-slate-500">
        <span>&copy; 2026 VibeMeet Inc.</span>
        <Link to="/privacy" className="hover:text-pink-400 transition-colors">Privacy Policy &rarr;</Link>
      </div>
    </div>
  </div>
);

export default TermsPage;
