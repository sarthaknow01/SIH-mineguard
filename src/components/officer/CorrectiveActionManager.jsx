import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { formatDate } from '../../utils/dateHelpers';
import Badge from '../common/Badge';
import { ShieldAlert, CheckCircle2, Clock, Plus, ArrowRight, UserCheck } from 'lucide-react';
import CreateActionModal from './CreateActionModal';
import AddCertificateModal from './AddCertificateModal';

export default function CorrectiveActionManager() {
  const { correctiveActions, violations, mines } = useData();
  const [selectedViolationForAction, setSelectedViolationForAction] = useState(null);
  const [showAddCertModal, setShowAddCertModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span>Corrective & Preventive Action (CAPA) Lifecycle</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track statutory remediation from initial assignment through worker document upload and inspector verification
          </p>
        </div>

        <button
          onClick={() => setShowAddCertModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>+ Upload Renewed Cert to Resolve Action</span>
        </button>
      </div>

      {/* Action Lifecycle Pipeline Visualizer */}
      <div className="bg-coal-900 border border-slate-800 p-4 rounded-xl shadow-lg">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Statutory Remediation Lifecycle Stages
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-lg bg-coal-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold block">STAGE 1</span>
            <span className="font-bold text-white mt-1 block">OPEN / ASSIGNED</span>
          </div>
          <div className="p-2.5 rounded-lg bg-coal-950 border border-amber-500/30 text-amber-400">
            <span className="text-[10px] text-amber-400 font-bold block">STAGE 2</span>
            <span className="font-bold mt-1 block">IN PROGRESS</span>
          </div>
          <div className="p-2.5 rounded-lg bg-coal-950 border border-blue-500/30 text-blue-400">
            <span className="text-[10px] text-blue-400 font-bold block">STAGE 3</span>
            <span className="font-bold mt-1 block">CERT UPLOADED</span>
          </div>
          <div className="p-2.5 rounded-lg bg-coal-950 border border-purple-500/30 text-purple-400">
            <span className="text-[10px] text-purple-400 font-bold block">STAGE 4</span>
            <span className="font-bold mt-1 block">VERIFY REQUIRED</span>
          </div>
          <div className="p-2.5 rounded-lg bg-coal-950 border border-emerald-500/30 text-emerald-400">
            <span className="text-[10px] text-emerald-400 font-bold block">STAGE 5</span>
            <span className="font-bold mt-1 block">RESOLVED</span>
          </div>
        </div>
      </div>

      {/* Corrective Actions Table */}
      <div className="space-y-3">
        {correctiveActions.map((ca) => {
          const linkedViolation = violations.find(v => v.violationId === ca.violationId);
          const linkedMine = mines.find(m => m.mineId === ca.mineId);

          return (
            <div key={ca.actionId} className="p-4 bg-coal-900 border border-slate-800 hover:border-slate-700 rounded-xl shadow-md space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white text-xs">{ca.actionId}</span>
                  <span className="text-xs text-slate-400 font-semibold">• For {ca.violationId} ({linkedMine?.mineName})</span>
                  <Badge size="sm">{ca.priority}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge size="sm">{ca.status}</Badge>
                  <span className="text-[11px] text-slate-400 font-mono">Due: {formatDate(ca.dueDate)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="md:col-span-2 space-y-1">
                  <h4 className="font-bold text-white">{ca.title}</h4>
                  <p className="text-slate-300 leading-relaxed">{ca.description}</p>
                  <p className="text-[11px] text-slate-400 pt-1">
                    <strong>Assigned To:</strong> {ca.assignedTo} • <strong>Created:</strong> {formatDate(ca.createdDate)}
                  </p>
                </div>

                <div className="p-3 bg-coal-950 rounded-lg border border-slate-800 text-[11px] space-y-1">
                  <p className="font-bold text-slate-300">Remediation Status:</p>
                  <p className="text-slate-400">
                    {ca.completionNotes || 'Pending worker certification renewal and documentary submission to safety desk.'}
                  </p>
                  {ca.status !== 'VERIFIED' && ca.status !== 'RESOLVED' && (
                    <button
                      onClick={() => setShowAddCertModal(true)}
                      className="mt-2 w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-[11px] transition-colors"
                    >
                      Upload Renewed Certificate
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <CreateActionModal
        isOpen={!!selectedViolationForAction}
        onClose={() => setSelectedViolationForAction(null)}
        violation={selectedViolationForAction}
      />
      <AddCertificateModal
        isOpen={showAddCertModal}
        onClose={() => setShowAddCertModal(false)}
        initialData={{
          workerId: 'W-10452',
          certificateType: 'Electrical Competency Certificate',
          linkedViolationId: 'VIO-2026-001'
        }}
      />
    </div>
  );
}
