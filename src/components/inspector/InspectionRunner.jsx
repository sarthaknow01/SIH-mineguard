import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ClipboardCheck, CheckCircle2, XCircle, MinusCircle, AlertTriangle, Send, Sparkles, UserCheck } from 'lucide-react';
import ReportViolationModal from './ReportViolationModal';

export default function InspectionRunner({ onComplete }) {
  const { mines, workers, createInspection } = useData();
  const { currentUser } = useAuth();

  const [mineId, setMineId] = useState('MINE-01');
  const [area, setArea] = useState('Substation Zone 3');
  const [inspectionType, setInspectionType] = useState('Electrical & Personnel Compliance Safety Inspection');
  const [generalNotes, setGeneralNotes] = useState('');
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [submittedInspection, setSubmittedInspection] = useState(null);

  // Pre-configured checklist items
  const [checklist, setChecklist] = useState([
    { id: 1, category: 'Safety & Signage', item: 'Danger High Voltage signage & isolation barriers in place', status: 'PASS', notes: 'Visible and illuminated' },
    { id: 2, category: 'Safety & Signage', item: 'Emergency fire extinguishers inspected and charged (CO2/Dry Powder)', status: 'PASS', notes: 'Pressure gauges nominal' },
    { id: 3, category: 'Equipment Safety', item: 'Transformer grounding & earth leakage circuit breakers tested', status: 'PASS', notes: 'Ground resistance 1.8 ohms' },
    { id: 4, category: 'Equipment Safety', item: '15kV grade insulated rubber floor matting in front of breaker panels', status: 'PASS', notes: 'Test stamp verified' },
    { id: 5, category: 'Worker Compliance', item: 'On-duty personnel possess valid Electrical Competency Certificate', status: 'FAIL', notes: 'Electrician Rahul Patil (W-10452) certificate CERT-2024-0012 expired on 15 Aug 2026' },
    { id: 6, category: 'Worker Compliance', item: 'Mandatory PPE (Arc-flash face shield, insulated safety gloves) worn', status: 'PASS', notes: 'PPE in proper use' },
  ]);

  const updateItemStatus = (id, newStatus) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
  };

  const updateItemNotes = (id, notes) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, notes } : item));
  };

  const hasFailures = checklist.some(item => item.status === 'FAIL');
  const selectedMine = mines.find(m => m.mineId === mineId);

  const handleSubmit = (e) => {
    e.preventDefault();
    const overallResult = hasFailures ? 'FAILED' : 'PASSED';
    const newInsp = createInspection({
      mineId,
      mineName: selectedMine?.mineName || 'Demo Mine Alpha',
      area,
      inspectionType,
      checklistResults: checklist,
      overallResult,
      notes: generalNotes || (hasFailures ? 'Inspection logged compliance failures requiring immediate rectification.' : 'All statutory safety parameters verified in nominal condition.'),
      evidence: 'evidence_field_inspection_01.jpg',
      inspectorId: currentUser?.userId || 'inspector01',
      inspectorName: currentUser?.name || 'Rajesh Kumar',
    }, currentUser?.name);

    setSubmittedInspection(newInsp);
    if (hasFailures) {
      setShowViolationModal(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-amber-400" />
            <span>Digital Field Safety Inspection Runner</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Standard Operating Procedure (SOP) statutory compliance evaluation checklist
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Inspection Header Selector */}
        <div className="bg-coal-900 border border-slate-800 p-4 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Assigned Coal Mine</label>
            <select
              value={mineId}
              onChange={(e) => setMineId(e.target.value)}
              className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
            >
              {mines.map(m => (
                <option key={m.mineId} value={m.mineId}>{m.mineName} — {m.location.split(',')[0]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Inspected Mine Zone / Face</label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
              placeholder="e.g. Substation Zone 3"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Audit Type</label>
            <select
              value={inspectionType}
              onChange={(e) => setInspectionType(e.target.value)}
              className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="Electrical & Personnel Compliance Safety Inspection">Electrical & Personnel Compliance</option>
              <option value="Ventilation & Gas Testing Audit">Ventilation & Gas Testing Audit</option>
              <option value="Roof Support & Strata Control Inspection">Roof Support & Strata Control</option>
              <option value="HEMM Machinery & Transport Safety Audit">HEMM Machinery & Transport Safety</option>
            </select>
          </div>
        </div>

        {/* Checklist Table */}
        <div className="bg-coal-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Statutory Evaluation Checklist ({checklist.length} Items)
            </span>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Pass
              </span>
              <span className="flex items-center gap-1 text-red-400">
                <XCircle className="w-3.5 h-3.5" /> Fail (Violation)
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <MinusCircle className="w-3.5 h-3.5" /> N/A
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-800">
            {checklist.map((item) => (
              <div key={item.id} className="p-4 hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white mt-1.5">{item.item}</p>
                  <input
                    type="text"
                    value={item.notes}
                    onChange={(e) => updateItemNotes(item.id, e.target.value)}
                    placeholder="Add inspector field observation notes..."
                    className="mt-2 w-full max-w-lg px-2.5 py-1 bg-coal-950 border border-slate-700/80 rounded text-[11px] text-slate-300 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                {/* PASS / FAIL / NA Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateItemStatus(item.id, 'PASS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      item.status === 'PASS'
                        ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                        : 'bg-coal-950 text-slate-400 hover:text-emerald-400 border border-slate-800'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>PASS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateItemStatus(item.id, 'FAIL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      item.status === 'FAIL'
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/20 animate-pulse'
                        : 'bg-coal-950 text-slate-400 hover:text-red-400 border border-slate-800'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>FAIL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateItemStatus(item.id, 'N/A')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      item.status === 'N/A'
                        ? 'bg-slate-700 text-white'
                        : 'bg-coal-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <MinusCircle className="w-3.5 h-3.5" />
                    <span>N/A</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Notes & Submit */}
        <div className="bg-coal-900 border border-slate-800 p-4 rounded-xl space-y-3">
          <label className="block text-xs font-semibold text-slate-300">Inspector Overall Concluding Remarks</label>
          <textarea
            rows="2"
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
            placeholder="Summarize key inspection findings, immediate hazard warnings, or verbal instructions given..."
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs">
              {hasFailures ? (
                <div className="flex items-center gap-1.5 text-red-400 font-semibold bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/30">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Compliance Failures Detected — Filing violation ticket will be required</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>All evaluated safety parameters PASS</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-extrabold text-xs rounded-lg shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Submit Statutory Inspection Report</span>
            </button>
          </div>
        </div>
      </form>

      {/* Auto Report Violation Modal upon failure */}
      <ReportViolationModal
        isOpen={showViolationModal}
        onClose={() => {
          setShowViolationModal(false);
          if (onComplete) onComplete();
        }}
        initialData={{
          mineId,
          area,
          category: 'Statutory Certification Breach',
          severity: 'HIGH',
          workerId: 'W-10452',
          certificateId: 'CERT-2024-0012',
          description: 'Electrician Rahul Patil (W-10452) found actively performing 33kV high-voltage substation duties with an expired Electrical Competency Certificate (Expired 15-Aug-2026).',
          inspectionId: submittedInspection?.inspectionId
        }}
      />
    </div>
  );
}
