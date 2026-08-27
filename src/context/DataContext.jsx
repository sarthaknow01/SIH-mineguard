import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  DEMO_MINES,
  DEMO_WORKERS,
  DEMO_CERTIFICATES,
  DEMO_INSPECTIONS,
  DEMO_VIOLATIONS,
  DEMO_ALERTS,
  DEMO_CORRECTIVE_ACTIONS,
  DEMO_AUDIT_TRAIL,
  DEMO_EQUIPMENT
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
  const [equipment] = useState(() => loadFromStorage('equipment', DEMO_EQUIPMENT));

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

  // Recalculate Mine Scores dynamically based on open violations
  const recalculateMineScores = () => {
    setMines(prevMines => {
      return prevMines.map(m => {
        const mineViolations = violations.filter(v => v.mineId === m.mineId && v.status !== 'RESOLVED');
        const activeViolationsCount = mineViolations.length;
        const pendingActionsCount = correctiveActions.filter(ca => ca.mineId === m.mineId && ca.status !== 'RESOLVED' && ca.status !== 'VERIFIED').length;
        
        // Base scoring logic
        let deductions = 0;
        mineViolations.forEach(v => {
          if (v.severity === 'CRITICAL') deductions += 15;
          else if (v.severity === 'HIGH') deductions += 8;
          else if (v.severity === 'MEDIUM') deductions += 4;
          else deductions += 2;
        });

        // Calculate score
        let newScore = Math.max(45, Math.min(98, 100 - deductions));
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
      `Conducted inspection ${newId} in ${inspectionData.mineName} (${inspectionData.area}). Result: ${inspectionData.overallResult}`, 
      inspectionData.mineId
    );

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

    // Evaluate Risk with AI Engine
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

    setViolations(prev => [newViolation, ...prev]);

    // Automatically generate system Alert for Mine Officer and Management
    const newAlert = {
      alertId: `ALT-${Date.now().toString().slice(-4)}`,
      type: 'VIOLATION_REPORTED',
      severity: violationData.severity,
      title: `${violationData.severity} Severity Violation: ${violationData.category}`,
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
      `Reported Violation ${newId} for ${violationData.mineId}. AI Risk Score: ${aiRisk.score}/100.`,
      violationData.mineId
    );

    // Recalculate scores
    setTimeout(recalculateMineScores, 100);

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

    setCorrectiveActions(prev => [newAction, ...prev]);

    // Update violation status
    setViolations(prev => prev.map(v => 
      v.violationId === actionData.violationId 
        ? { ...v, status: 'ACTION IN PROGRESS' } 
        : v
    ));

    // Audit trail
    addAuditLog(actorName, 'OFFICER', 'CREATE_CORRECTIVE_ACTION', 
      `Assigned Corrective Action ${newId} for ${actionData.violationId} to ${actionData.assignedTo}. Due: ${actionData.dueDate}`,
      actionData.mineId
    );

    return newAction;
  };

  // 4. Register / Upload Renewed Certificate (Mine Officer)
  // This automatically transitions worker certificate status to VALID and advances linked violation to VERIFICATION REQUIRED!
  const addOrUpdateCertificate = (certData, linkedViolationId, actorName) => {
    const isUpdate = certificates.some(c => c.certificateId === certData.certificateId);
    
    let updatedCerts;
    if (isUpdate) {
      updatedCerts = certificates.map(c => 
        c.certificateId === certData.certificateId 
          ? { ...c, ...certData, verificationStatus: 'VALID' } 
          : c
      );
    } else {
      updatedCerts = [{ ...certData, verificationStatus: 'VALID' }, ...certificates];
    }
    setCertificates(updatedCerts);

    // If linked to a violation, move violation & corrective action to VERIFICATION REQUIRED
    if (linkedViolationId) {
      setViolations(prev => prev.map(v => 
        v.violationId === linkedViolationId 
          ? { ...v, status: 'VERIFICATION REQUIRED' } 
          : v
      ));

      setCorrectiveActions(prev => prev.map(ca => 
        ca.violationId === linkedViolationId
          ? { 
              ...ca, 
              status: 'VERIFICATION REQUIRED', 
              completionNotes: `Renewed certificate ${certData.certificateId} uploaded and verified by Mine Officer. Awaiting Inspector verification sign-off.`,
              evidence: certData.documentUrl || 'renewed_certificate_doc.pdf'
            }
          : ca
      ));

      // Alert Inspector for Verification Sign-Off
      const verifyAlert = {
        alertId: `ALT-${Date.now().toString().slice(-4)}`,
        type: 'VERIFICATION_REQUIRED',
        severity: 'MEDIUM',
        title: `Verification Sign-Off Required for Violation ${linkedViolationId}`,
        description: `Mine Officer uploaded renewed certificate for ${certData.workerName}. Inspector sign-off required to close.`,
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

    setTimeout(recalculateMineScores, 100);
  };

  // 5. Inspector Verifies and Resolves Violation
  const verifyAndResolveViolation = (violationId, notes, actorName) => {
    setViolations(prev => prev.map(v => 
      v.violationId === violationId 
        ? { ...v, status: 'RESOLVED', resolvedDate: getTodayDateString(), verificationNotes: notes } 
        : v
    ));

    setCorrectiveActions(prev => prev.map(ca => 
      ca.violationId === violationId 
        ? { ...ca, status: 'VERIFIED', resolvedDate: getTodayDateString() } 
        : ca
    ));

    const targetViolation = violations.find(v => v.violationId === violationId);
    const targetMineId = targetViolation?.mineId || 'MINE-01';

    addAuditLog(actorName, 'INSPECTOR', 'VERIFIED_CORRECTIVE_ACTION', 
      `Inspector verified resolution for ${violationId}. Compliance issue formally marked RESOLVED.`,
      targetMineId
    );

    // Create celebratory alert
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

    setTimeout(recalculateMineScores, 100);
  };

  // 6. Issue Regulatory Directive (Regulatory Authority)
  const issueDirective = (directiveData, actorName) => {
    const alertId = `ALT-${Date.now().toString().slice(-4)}`;
    const newAlert = {
      alertId,
      type: 'REGULATORY_DIRECTIVE',
      severity: directiveData.severity || 'CRITICAL',
      title: `DGMS Official Directive: ${directiveData.title}`,
      description: directiveData.description,
      relatedEntity: directiveData.mineId,
      mineId: directiveData.mineId,
      createdDate: new Date().toISOString(),
      status: 'UNREAD',
      targetRoles: ['officer', 'management']
    };

    setAlerts(prev => [newAlert, ...prev]);

    addAuditLog(actorName, 'AUTHORITY', 'ISSUE_DIRECTIVE', 
      `Issued DGMS Directive to ${directiveData.mineId}: "${directiveData.title}"`,
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
      equipment,
      createInspection,
      reportViolation,
      createCorrectiveAction,
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
