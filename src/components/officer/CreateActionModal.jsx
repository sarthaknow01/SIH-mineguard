import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { getTodayDateString } from '../../utils/dateHelpers';
import { ShieldAlert, Send } from 'lucide-react';

export default function CreateActionModal({ isOpen, onClose, violation }) {
  const { createCorrectiveAction } = useData();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState(
    violation?.category?.includes('Cert') 
      ? 'Obtain & Submit Renewed Statutory Competency Certification' 
      : 'Immediate Equipment Maintenance & Safety Interlock Rectification'
  );
  const [description, setDescription] = useState(
    violation?.description 
      ? `Remediate violation ${violation.violationId}: Complete required statutory compliance evaluation and submit renewed documentation.`
      : ''
  );
  const [assignedTo, setAssignedTo] = useState(violation?.workerName ? `${violation.workerName} & Safety Desk` : 'Maintenance Engineering Team');
  const [dueDate, setDueDate] = useState('2026-08-30');
  const [priority, setPriority] = useState(violation?.severity || 'HIGH');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!violation) return;

    createCorrectiveAction({
      violationId: violation.violationId,
      mineId: violation.mineId,
      title,
      description,
      assignedTo,
      dueDate,
      priority,
    }, currentUser?.name);

    onClose();
  };

  if (!violation) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🛡️ Create Corrective Action Plan" subtitle={`Assign remediation action for ${violation.violationId}`} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-coal-950 rounded-xl border border-slate-800 text-xs space-y-1">
          <div className="flex justify-between items-center text-slate-400 font-mono">
            <span>Violation ID: <strong>{violation.violationId}</strong></span>
            <span>Mine: <strong>{violation.mineName}</strong></span>
          </div>
          <p className="text-white font-medium">{violation.description}</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Action Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Action Description & Remediation Directives</label>
          <textarea
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Responsible Entity</label>
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Target Resolution Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Action Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
            >
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-blue-600/20 flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>Create Action & Transition to In-Progress</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
