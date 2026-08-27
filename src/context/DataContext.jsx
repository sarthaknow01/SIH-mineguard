import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  DEMO_MINES,
  DEMO_WORKERS,
  DEMO_CERTIFICATES,
  DEMO_INSPECTIONS,
  DEMO_VIOLATIONS,
  DEMO_ALERTS,
  DEMO_CORRECTIVE_ACTIONS,
  DEMO_AUDIT_TRAIL
} from '../utils/seedData';
import { calculateCertificateStatus, getTodayDateString } from '../utils/dateHelpers';
import { evaluateRisk } from '../utils/aiRiskEngine';

const DataContext = createContext();

const STORAGE_KEY_PREFIX = 'mineguard_state_v1_';

export function DataProvider({ children }) {
  const [mines, setMines] = useState(() => loadFromStorage('mines', DEMO_MINES));
  const [workers, setWorkers] = useState(() => loadFromStorage('workers', DEMO_WORKERS));
  const [certificates, setCertificates] = useState(() => loadFromStorage('certificates', DEMO_CERTIFICATES));
  const [inspections, setInspections] = useState(() => loadFromStorage('inspections', DEMO_INSPECTIONS));
  const [violations, setViolations] = useState(() => loadFromStorage('violations', DEMO_VIOLATIONS));
  const [alerts, setAlerts] = useState(() => loadFromStorage('alerts', DEMO_ALERTS));
  const [correctiveActions, setCorrectiveActions] = useState(() => loadFromStorage('correctiveActions', DEMO_CORRECTIVE_ACTIONS));
  const [auditTrail, setAuditTrail] = useState(() => loadFromStorage('auditTrail', DEMO_AUDIT_TRAIL));

  function loadFromStorage(key, fallback) {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return fallback;
  }

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'mines', JSON.stringify(mines));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'workers', JSON.stringify(workers));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'certificates', JSON.stringify(certificates));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'inspections', JSON.stringify(inspections));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'violations', JSON.stringify(violations));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'alerts', JSON.stringify(alerts));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'correctiveActions', JSON.stringify(correctiveActions));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'auditTrail', JSON.stringify(auditTrail));
  }, [mines, workers, certificates, inspections, violations, alerts, correctiveActions, auditTrail]);

  // Recalculate Mine Scores dynamically based on a multi-factor weighted compliance model
  const recalculateMineScores = (vArr = violations, cArr = certificates, aArr = correctiveActions, wArr = workers) => {
    const BASELINE_SCORES = {
      'MINE-01': 88,
      'MINE-02': 82,
      'MINE-03': 61,
      'MINE-04': 91,
      'MINE-05': 73,
    };

    setMines(prevMines => {
      return prevMines.map(m => {
        const base = BASELINE_SCORES[m.mineId] ?? 80;
        const mineViolations = vArr.filter(v => v.mineId === m.mineId);
        const openViolations = mineViolations.filter(v => v.status !== 'RESOLVED');
        const resolvedViolations = mineViolations.filter(v => v.status === 'RESOLVED');
        const activeViolationsCount = openViolations.length;

        const mineActions = aArr.filter(ca => ca.mineId === m.mineId);
        const pendingActionsCount = mineActions.filter(ca => ca.status !== 'RESOLVED' && ca.status !== 'VERIFIED').length;
        const verifiedActionsCount = mineActions.filter(ca => ca.status === 'VERIFIED' || ca.status === 'RESOLVED').length;

        // 1. Violation severity impact
        let violationDeduction = 0;
        openViolations.forEach(v => {
          if (v.severity === 'CRITICAL') violationDeduction += 6;
          else if (v.severity === 'HIGH') violationDeduction += 4;
          else if (v.severity === 'MEDIUM') violationDeduction += 2;
          else violationDeduction += 1;
        });

        // 2. Certificate status impact for workers of this mine
        const mineWorkers = wArr.filter(w => w.mineId === m.mineId);
        const mineCerts = cArr.filter(c => c.mineId === m.mineId || mineWorkers.some(w => w.workerId === c.workerId));
        let certDeduction = 0;
        mineCerts.forEach(c => {
          const st = calculateCertificateStatus(c.expiryDate).status;
          if (st === 'EXPIRED') certDeduction += 3;
          else if (st === 'EXPIRING SOON') certDeduction += 1;
        });

        // 3. Remediation bonus (recovering points when issues are resolved)
        const remediationBonus = Math.min(6, (resolvedViolations.length * 2) + (verifiedActionsCount * 1));

        // Calculate final score constrained realistically
        let calculatedScore = base - violationDeduction - certDeduction + remediationBonus;
        let newScore = Math.max(45, Math.min(95, Math.round(calculatedScore)));

        let riskLevel = 'LOW';
        if (newScore < 70) riskLevel = 'HIGH';
        else if (newScore < 80) riskLevel = 'MEDIUM';

        return {
          ...m,
          complianceScore: newScore,
          riskLevel,
          activeViolations: activeViolationsCount,
          pendingActions: pendingActionsCount,
        };
      });
    });
  };

  // 1. Submit a New Inspection
  const createInspection = (inspectionData, actorName) => {
    const newId = `INSP-2026-${String(inspections.length + 1).padStart(3, '0')}`;
    const newInspection = {
      ...inspectionData,
      inspectionId: newId,
      date: getTodayDateString(),
      status: 'COMPLETED',
    };

    setInspections(prev => [newInspection, ...prev]);

    // Add audit log
    addAuditLog(actorName, 'INSPECTOR', 'INSPECTION_SUBMITTED', 
      `Conducted safety inspection ${newId} in ${inspectionData.mineName} (${inspectionData.area}). Result: ${inspectionData.overallResult}`, 
      inspectionData.mineId
    );

    recalculateMineScores(violations, certificates, correctiveActions, workers);
    return newInspection;
  };

  // 2. Report a Violation (with AI Risk calculation)
  const reportViolation = (violationData, actorName) => {
    const newId = `VIO-2026-${String(violations.length + 1).padStart(3, '0')}`;
    
    // Find worker if linked
    const worker = workers.find(w => w.workerId === violationData.workerId);
    let certStatus = 'VALID';
    if (violationData.certificateId) {
      const cert = certificates.find(c => c.certificateId === violationData.certificateId);
      if (cert) certStatus = calculateCertificateStatus(cert.expiryDate).status;
    }

    // Evaluate Risk with Explainable AI Engine
    const aiRisk = evaluateRisk({
      category: violationData.category,
      severity: violationData.severity,
      workerRole: worker?.role || '',
      certStatus: certStatus,
      area: violationData.area,
      repeatedCount: violations.filter(v => v.mineId === violationData.mineId && v.area === violationData.area).length
    });

    const newViolation = {
      ...violationData,
      violationId: newId,
      date: getTodayDateString(),
      status: 'OPEN',
      riskScore: aiRisk.score,
      riskLevel: aiRisk.level,
      aiExplanation: aiRisk.summary + ' — ' + aiRisk.reasons.join(' '),
      reportedBy: actorName || 'Inspector INS-001',
    };

    const updatedViolations = [newViolation, ...violations];
    setViolations(updatedViolations);

    // Automatically generate system Alert for Mine Officer and Management
    const newAlert = {
      alertId: `ALT-${Date.now().toString().slice(-4)}`,
      type: 'VIOLATION_REPORTED',
      severity: violationData.severity,
      title: `${violationData.severity} Severity Issue: ${violationData.category}`,
      description: `${actorName || 'Inspector'} reported ${newId} in ${violationData.area} (${violationData.mineName || violationData.mineId}): ${violationData.description}`,
      relatedEntity: newId,
      mineId: violationData.mineId,
      createdDate: new Date().toISOString(),
      status: 'UNREAD',
      targetRoles: ['officer', 'management', 'authority']
    };
    setAlerts(prev => [newAlert, ...prev]);

    // Audit trail
    addAuditLog(actorName, 'INSPECTOR', 'REPORT_VIOLATION', 
      `Reported Violation ${newId} for ${violationData.mineId} (${violationData.area}). AI-Assisted Risk Score: ${aiRisk.score}/100 (${aiRisk.level}).`,
      violationData.mineId
    );

    // Immediate score recalculation with updated violations array
    recalculateMineScores(updatedViolations, certificates, correctiveActions, workers);

    return newViolation;
  };

  // 3. Create a Corrective Action (Mine Officer)
  const createCorrectiveAction = (actionData, actorName) => {
    const newId = `CA-2026-${String(correctiveActions.length + 1).padStart(3, '0')}`;
    const newAction = {
      ...actionData,
      actionId: newId,
      createdDate: getTodayDateString(),
      status: 'IN PROGRESS', // Moves immediately to in-progress
      completionNotes: '',
      evidence: '',
      resolvedDate: null,
    };

    const updatedActions = [newAction, ...correctiveActions];
    setCorrectiveActions(updatedActions);

    // Update violation status
    const updatedViolations = violations.map(v => 
      v.violationId === actionData.violationId 
        ? { ...v, status: 'ACTION IN PROGRESS' } 
        : v
    );
    setViolations(updatedViolations);

    // Audit trail
    addAuditLog(actorName, 'OFFICER', 'CREATE_CORRECTIVE_ACTION', 
      `Assigned Corrective Action ${newId} for ${actionData.violationId} to ${actionData.assignedTo}. Due: ${actionData.dueDate}`,
      actionData.mineId
    );

    recalculateMineScores(updatedViolations, certificates, updatedActions, workers);
    return newAction;
  };

  // 3b. Update Corrective Action (e.g. submit remediation notes, moving to VERIFICATION REQUIRED)
  const updateCorrectiveAction = (actionId, updateData, actorName) => {
    let linkedViolationId = null;
    let targetMineId = 'MINE-01';

    const updatedActions = correctiveActions.map(ca => {
      if (ca.actionId === actionId) {
        linkedViolationId = ca.violationId;
        targetMineId = ca.mineId;
        return {
          ...ca,
          ...updateData,
        };
      }
      return ca;
    });
    setCorrectiveActions(updatedActions);

    let updatedViolations = violations;
    if (updateData.status === 'VERIFICATION REQUIRED' && linkedViolationId) {
      updatedViolations = violations.map(v => 
        v.violationId === linkedViolationId 
          ? { ...v, status: 'VERIFICATION REQUIRED' } 
          : v
      );
      setViolations(updatedViolations);

      // Alert Inspector for Verification Sign-Off
      const verifyAlert = {
        alertId: `ALT-${Date.now().toString().slice(-4)}`,
        type: 'VERIFICATION_REQUIRED',
        severity: 'MEDIUM',
        title: `Verification Sign-Off Required for Violation ${linkedViolationId}`,
        description: `Mine Officer submitted remediation for ${linkedViolationId}: ${updateData.completionNotes || 'Remediation completed, awaiting inspector verification.'}`,
        relatedEntity: linkedViolationId,
        mineId: targetMineId,
        createdDate: new Date().toISOString(),
        status: 'UNREAD',
        targetRoles: ['inspector']
      };
      setAlerts(prev => [verifyAlert, ...prev]);
    }

    addAuditLog(actorName, 'OFFICER', 'UPDATE_CORRECTIVE_ACTION', 
      `Updated Corrective Action ${actionId} status to ${updateData.status || 'UPDATED'}.`,
      targetMineId
    );

    recalculateMineScores(updatedViolations, certificates, updatedActions, workers);
  };

  // 4. Register / Upload Renewed Certificate (Mine Officer)
  // This updates certificate status and advances linked violation to VERIFICATION REQUIRED!
  const addOrUpdateCertificate = (certData, linkedViolationId, actorName) => {
    const isUpdate = certificates.some(c => c.certificateId === certData.certificateId);
    
    let updatedCerts;
    if (isUpdate) {
      updatedCerts = certificates.map(c => 
        c.certificateId === certData.certificateId 
          ? { ...c, ...certData } 
          : c
      );
    } else {
      updatedCerts = [{ ...certData }, ...certificates];
    }
    setCertificates(updatedCerts);

    let updatedViolations = violations;
    let updatedActions = correctiveActions;

    // If linked to a violation, move violation & corrective action to VERIFICATION REQUIRED
    if (linkedViolationId) {
      updatedViolations = violations.map(v => 
        v.violationId === linkedViolationId 
          ? { ...v, status: 'VERIFICATION REQUIRED' } 
          : v
      );
      setViolations(updatedViolations);

      updatedActions = correctiveActions.map(ca => 
        ca.violationId === linkedViolationId
          ? { 
              ...ca, 
              status: 'VERIFICATION REQUIRED', 
              completionNotes: `Renewed certificate ${certData.certificateId} registered by Mine Officer for ${certData.workerName}. Awaiting Inspector verification sign-off.`,
              evidence: certData.documentUrl || 'renewed_certificate_doc.pdf'
            }
          : ca
      );
      setCorrectiveActions(updatedActions);

      // Alert Inspector for Verification Sign-Off
      const verifyAlert = {
        alertId: `ALT-${Date.now().toString().slice(-4)}`,
        type: 'VERIFICATION_REQUIRED',
        severity: 'MEDIUM',
        title: `Verification Sign-Off Required for Violation ${linkedViolationId}`,
        description: `Mine Officer registered renewed certificate for ${certData.workerName}. Inspector sign-off required to close.`,
        relatedEntity: linkedViolationId,
        mineId: certData.mineId,
        createdDate: new Date().toISOString(),
        status: 'UNREAD',
        targetRoles: ['inspector']
      };
      setAlerts(prev => [verifyAlert, ...prev]);
    }

    addAuditLog(actorName, 'OFFICER', 'CERTIFICATE_UPLOADED', 
      `Registered renewed certificate ${certData.certificateId} for ${certData.workerName} (${certData.certificateType}). Expiry: ${certData.expiryDate}`,
      certData.mineId
    );

    recalculateMineScores(updatedViolations, updatedCerts, updatedActions, workers);
  };

  // 5. Inspector Verifies and Resolves Violation
  const verifyAndResolveViolation = (violationId, notes, actorName) => {
    const updatedViolations = violations.map(v => 
      v.violationId === violationId 
        ? { ...v, status: 'RESOLVED', resolvedDate: getTodayDateString(), verificationNotes: notes } 
        : v
    );
    setViolations(updatedViolations);

    const updatedActions = correctiveActions.map(ca => 
      ca.violationId === violationId 
        ? { ...ca, status: 'VERIFIED', resolvedDate: getTodayDateString() } 
        : ca
    );
    setCorrectiveActions(updatedActions);

    const targetViolation = violations.find(v => v.violationId === violationId);
    const targetMineId = targetViolation?.mineId || 'MINE-01';

    addAuditLog(actorName, 'INSPECTOR', 'VERIFIED_CORRECTIVE_ACTION', 
      `Inspector verified resolution for ${violationId}. Compliance issue formally marked RESOLVED.`,
      targetMineId
    );

    // Create resolved notification alert
    const resolvedAlert = {
      alertId: `ALT-${Date.now().toString().slice(-4)}`,
      type: 'ISSUE_RESOLVED',
      severity: 'LOW',
      title: `Violation ${violationId} Resolved & Verified`,
      description: `Inspector ${actorName || 'INS-001'} verified compliance remediation for ${targetViolation?.mineName || targetMineId}. Mine compliance score updated.`,
      relatedEntity: violationId,
      mineId: targetMineId,
      createdDate: new Date().toISOString(),
      status: 'UNREAD',
      targetRoles: ['officer', 'management', 'authority']
    };
    setAlerts(prev => [resolvedAlert, ...prev]);

    recalculateMineScores(updatedViolations, certificates, updatedActions, workers);
  };

  // 6. Issue Regulatory Directive Notice (Regulatory Authority)
  const issueDirective = (directiveData, actorName) => {
    const alertId = `ALT-${Date.now().toString().slice(-4)}`;
    const newAlert = {
      alertId,
      type: 'REGULATORY_DIRECTIVE',
      severity: directiveData.severity || 'CRITICAL',
      title: `Compliance Notice: ${directiveData.title}`,
      description: directiveData.description,
      relatedEntity: directiveData.mineId,
      mineId: directiveData.mineId,
      createdDate: new Date().toISOString(),
      status: 'UNREAD',
      targetRoles: ['officer', 'management']
    };

    setAlerts(prev => [newAlert, ...prev]);

    addAuditLog(actorName, 'AUTHORITY', 'ISSUE_DIRECTIVE', 
      `Issued Compliance Notice to ${directiveData.mineId}: "${directiveData.title}"`,
      directiveData.mineId
    );
  };

  // Audit Log Helper
  const addAuditLog = (actor, role, action, details, mineId) => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    const newEntry = {
      auditId: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: timeStr,
      actor: actor || 'System User',
      role,
      action,
      details,
      mineId: mineId || 'MINE-01',
    };

    setAuditTrail(prev => [newEntry, ...prev]);
  };

  // Mark Alert as Read
  const markAlertRead = (alertId) => {
    setAlerts(prev => prev.map(a => a.alertId === alertId ? { ...a, status: 'READ' } : a));
  };

  // Reset Demo Data to initial state
  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'mines');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'workers');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'certificates');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'inspections');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'violations');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'alerts');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'correctiveActions');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'auditTrail');

    setMines(DEMO_MINES);
    setWorkers(DEMO_WORKERS);
    setCertificates(DEMO_CERTIFICATES);
    setInspections(DEMO_INSPECTIONS);
    setViolations(DEMO_VIOLATIONS);
    setAlerts(DEMO_ALERTS);
    setCorrectiveActions(DEMO_CORRECTIVE_ACTIONS);
    setAuditTrail(DEMO_AUDIT_TRAIL);
  };

  return (
    <DataContext.Provider value={{
      mines,
      workers,
      certificates,
      inspections,
      violations,
      alerts,
      correctiveActions,
      auditTrail,
      equipment: [],
      createInspection,
      reportViolation,
      createCorrectiveAction,
      updateCorrectiveAction,
      addOrUpdateCertificate,
      verifyAndResolveViolation,
      issueDirective,
      markAlertRead,
      resetDemoData,
      recalculateMineScores
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
}

