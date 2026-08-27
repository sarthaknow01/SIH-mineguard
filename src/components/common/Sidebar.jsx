import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ClipboardCheck,
  AlertTriangle,
  FileCheck,
  Users,
  ShieldAlert,
  BarChart3,
  Layers,
  FileText,
  Activity,
  History,
  Scale
} from 'lucide-react';

export default function Sidebar({ currentTab, onSelectTab }) {
  const { currentUser } = useAuth();
  const role = currentUser?.role || 'INSPECTOR';

  // Define navigation tabs per role
  const getNavItems = () => {
    switch (role) {
      case 'INSPECTOR':
        return [
          { id: 'dashboard', label: 'Inspector Dashboard', icon: LayoutDashboard },
          { id: 'inspections', label: 'Conduct Inspection', icon: ClipboardCheck },
          { id: 'verify-cert', label: 'Verify Certificate', icon: FileCheck },
          { id: 'violations', label: 'Violations & Reports', icon: AlertTriangle },
          { id: 'verifications', label: 'Verification Sign-Off', icon: ShieldAlert },
        ];
      case 'OFFICER':
        return [
          { id: 'dashboard', label: 'Mine Overview', icon: LayoutDashboard },
          { id: 'workers', label: 'Worker Registry', icon: Users },
          { id: 'certificates', label: 'Certificate Manager', icon: FileCheck },
          { id: 'actions', label: 'Corrective Actions', icon: ShieldAlert },
          { id: 'violations', label: 'Violations Inbox', icon: AlertTriangle },
          { id: 'inspections-log', label: 'Inspection History', icon: History },
        ];
      case 'MANAGEMENT':
        return [
          { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
          { id: 'mines-compare', label: 'Mines Benchmark', icon: Layers },
          { id: 'risk-analytics', label: 'AI Risk Analytics', icon: Activity },
          { id: 'compliance-reports', label: 'Compliance Reports', icon: BarChart3 },
          { id: 'audit-log', label: 'Governance Audit Trail', icon: History },
        ];
      case 'AUTHORITY':
        return [
          { id: 'dashboard', label: 'National Overview', icon: LayoutDashboard },
          { id: 'high-risk', label: 'High-Risk Mines', icon: AlertTriangle },
          { id: 'directives', label: 'Regulatory Notices', icon: Scale },
          { id: 'audit-log', label: 'Compliance Audit Trail', icon: History },
          { id: 'compliance-reports', label: 'Safety Reports', icon: BarChart3 },
        ];
      default:
        return [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-coal-900/95 border-r border-slate-800 flex flex-col justify-between p-4 shrink-0 min-h-[calc(100vh-60px)]">
      <div className="space-y-6">
        {/* Active Role Indicator */}
        <div className="p-3 bg-coal-950 rounded-xl border border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Role</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-base">{currentUser?.avatar}</span>
            <div>
              <p className="text-xs font-bold text-white">{currentUser?.role}</p>
              <p className="text-[10px] text-amber-400 font-mono">{currentUser?.designation?.split('(')[0]}</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-2">Main Navigation</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 font-bold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Compliance Status Footer */}
      <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
        <div className="flex justify-between items-center text-[10px]">
          <span>System Status:</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Operational
          </span>
        </div>
        <p className="text-[10px] text-slate-400 text-center pt-2">
          SIH Prototype • PS26024 • Compliance Monitoring
        </p>
      </div>
    </aside>
  );
}
