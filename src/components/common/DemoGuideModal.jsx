import React from 'react';
import Modal from './Modal';
import { PlayCircle, CheckCircle2, ArrowRight, ShieldAlert, FileText, UserCheck } from 'lucide-react';

export default function DemoGuideModal({ isOpen, onClose }) {
  const steps = [
    {
      num: '1',
      role: '👷 INSPECTOR',
      title: 'Conduct Inspection & Detect Expired Certificate',
      desc: '1. Select "Demo Mine Alpha" -> "Substation Zone 3".\n2. Execute checklist: Mark PPE & Equipment as PASS.\n3. Mark "Worker Certificate" as FAIL for electrician Rahul Patil.\n4. Click "Report Violation" -> Select Severity HIGH -> Observe the explainable AI Risk Score (86/100) generated automatically.',
      highlight: 'Shows field inspection, AI risk scoring, and automated alert dispatch.'
    },
    {
      num: '2',
      role: '🧑‍💼 MINE OFFICER',
      title: 'Remediate Issue & Upload Renewed Certificate',
      desc: '1. Switch to Mine Officer role.\n2. View the new High-Severity Alert for Violation VIO-2026-001.\n3. Open Corrective Actions -> Create Action CA-2026-001 ("Obtain Renewed Certificate").\n4. Open Worker Registry -> Rahul Patil -> Click "+ Add / Renew Certificate".\n5. Upload renewed Certificate CERT-2026-009 (Valid till 2028). Worker status immediately switches to 🟢 VALID and issue moves to "VERIFICATION REQUIRED".',
      highlight: 'Shows compliance management, corrective action lifecycle, and worker certificate registry.'
    },
    {
      num: '3',
      role: '👷 INSPECTOR',
      title: 'Verify Resolution & Formal Sign-Off',
      desc: '1. Switch back to Inspector role.\n2. Open "Verification Sign-Off" tab.\n3. Review the uploaded renewed certificate document and remediation notes.\n4. Click "Verify & Resolve Issue" with 1 click.',
      highlight: 'Demonstrates dual-party verification and regulatory closure.'
    },
    {
      num: '4',
      role: '🏢 MANAGEMENT & 🏛️ REGULATORY',
      title: 'Live Executive Oversight & DGMS Governance',
      desc: '1. Switch to Management: Watch Mine Alpha compliance score rise live (74% -> 88%), risk drop to LOW, and trend charts update.\n2. Switch to DGMS Authority: Inspect cross-mine compliance benchmarks, high-risk flags (e.g. Mine Gamma at 61%), and review the tamper-evident Audit Trail.',
      highlight: 'Proves centralized connected governance across all organization levels.'
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🏆 SIH Judge Presentation Walkthrough Script" subtitle="Recommended step-by-step flow to demonstrate the complete compliance lifecycle" maxWidth="max-w-3xl">
      <div className="space-y-4">
        <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg text-xs text-amber-300">
          <strong>Core Presentation Message:</strong> "This prototype demonstrates an AI-assisted closed-loop compliance governance system for coal mines. When a hazard or expired certificate is detected, the AI evaluates its risk, alerts the mine officer, tracks corrective remediation, and requires inspector verification before updating executive compliance scores."
        </div>

        <div className="space-y-3 mt-4">
          {steps.map((s, idx) => (
            <div key={idx} className="bg-coal-950 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center font-mono">
                    {s.num}
                  </span>
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">{s.role}</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">Step {s.num} of 4</span>
              </div>

              <h4 className="text-sm font-bold text-white mt-2">{s.title}</h4>
              <p className="text-xs text-slate-300 whitespace-pre-line mt-1.5 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 font-mono">
                {s.desc}
              </p>

              <div className="mt-2 text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span><strong>Key Takeaway:</strong> {s.highlight}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Start Demonstration
          </button>
        </div>
      </div>
    </Modal>
  );
}
