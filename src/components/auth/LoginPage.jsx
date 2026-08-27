import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DEMO_ACCOUNTS } from '../../utils/seedData';
import { Flame, ShieldCheck, Lock, User, HardHat, Briefcase, Building2, Landmark, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [userId, setUserId] = useState('inspector01');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const res = login(userId, password);
    if (!res.success) {
      setError(res.message);
    }
  };

  const handleQuickLogin = (acc) => {
    setUserId(acc.userId);
    setPassword(acc.password);
    login(acc.userId, acc.password);
  };

  return (
    <div className="min-h-screen bg-coal-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-xl shadow-orange-500/20 mb-4">
            <Flame className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            MineGuard <span className="text-amber-400">AI</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            AI-Based Smart Governance & Compliance Monitoring System for Coal Mines (SIH PS26024)
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-coal-900/90 backdrop-blur-md border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Role-Based Portal Authentication
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-semibold">
              Demo Mode
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-lg text-xs text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">User ID</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors font-mono"
                  placeholder="e.g. inspector01"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors font-mono"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold text-xs rounded-lg shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <span>Authenticate & Enter Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              One-Click Seeded Demo Logins
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.userId}
                  type="button"
                  onClick={() => handleQuickLogin(acc)}
                  className="flex items-center gap-2 p-2 bg-coal-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-left transition-colors text-xs text-slate-300"
                >
                  <span className="text-base">{acc.avatar}</span>
                  <div className="truncate">
                    <p className="font-bold text-white text-[11px]">{acc.role}</p>
                    <p className="text-[10px] text-slate-400 truncate">{acc.userId}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-[11px] text-slate-400 text-center mt-6">
          Smart India Hackathon • Coal Mine Safety & Governance Prototype
        </p>
      </div>
    </div>
  );
}
