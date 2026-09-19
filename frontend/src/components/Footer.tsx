import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-6 mt-12">
      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
        <div className="text-sm mb-4 md:mb-0">
          © 2026 VibeMeet. All rights reserved.
        </div>
        <nav className="flex gap-4 text-sm">
          <Link to="/terms" className="hover:text-pink-400 transition-colors">
            Terms &amp; Conditions
          </Link>
          <Link to="/privacy" className="hover:text-pink-400 transition-colors">
            Privacy Policy
          </Link>
        </nav>
      </div>
    </footer>
  );
};
