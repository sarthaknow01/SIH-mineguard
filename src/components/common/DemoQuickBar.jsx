import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ShieldCheck, HardHat, Briefcase, Building2, Landmark, RefreshCw, HelpCircle, Sparkles } from 'lucide-react';
import DemoGuideModal from './DemoGuideModal';

export default function DemoQuickBar() {
  const { currentUser, switchRole } = useAuth();
  const { resetDemoData } = useData();
  const [showGuide, setShowGuide] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const roles = [
    { key: 'INSPECTOR', label: 'Inspector', icon: HardHat, badge: 'Rajesh (INS-001)', color: 'border-amber-500 text-amber-400 bg-amber-500/10' },
    { key: 'OFFICER', label: 'Mine Officer', icon: Briefcase, badge: 'Sanjay (Mine Alpha)', color: 'border-blue-500 text-blue-400 bg-blue-500/10' },
    { key: 'MANAGEMENT', label: 'Management', icon: Building2, badge: 'Executive Board', color: 'border-purple-500 text-purple-400 bg-purple-500/10' },
    { key: 'AUTHORITY', label: 'DGMS Authority', icon: Landmark, badge: 'Regulatory Lead', color: 'border-emerald-500 text-emerald-400 bg-emerald-500/10' },
  ];

  const handleReset = () => {
    resetDemoData();
    setResetConfirm(true);
    setTimeout(() => setResetConfirm(false), 2500);
  };

  return (
    <>
      <div className="bg-coal-900 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40 shadow-md">
        {/* Left: Prototype Tag & Guide */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 rounded-md text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SIH Prototype • PS26024</span>
          </div>

          <button
            onClick={() => setShowGuide(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md text-xs font-medium transition-colors shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-blue-300">Live Presentation Script & Guide</span>
          </button>
        </div>

        {/* Center: Instant Role Switcher */}
        <div className="flex items-center gap-1.5 bg-coal-950 p-1 rounded-lg border border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400 px-2 tracking-wider">Switch Role:</span>
          {roles.map((r) => {
            const Icon = r.icon;
            const isActive = currentUser?.role === r.key;
            return (
              <button
                key={r.key}
                onClick={() => switchRole(r.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  isActive
                    ? `${r.color} shadow-inner font-bold`
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title={`Switch to ${r.label}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Reset Demo Data */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-700 rounded-md text-xs transition-colors"
            title="Reset dataset to initial demonstration state"
          >
            <RefreshCw className={`w-3 h-3 ${resetConfirm ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{resetConfirm ? 'Reset Complete!' : 'Reset Demo Data'}</span>
          </button>
        </div>
      </div>

      <DemoGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </>
  );
}
