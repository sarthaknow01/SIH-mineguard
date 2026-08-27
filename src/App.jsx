import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import LoginPage from './components/auth/LoginPage';
import DemoQuickBar from './components/common/DemoQuickBar';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';

// Inspector Views
import InspectorDashboard from './components/inspector/InspectorDashboard';
import InspectionRunner from './components/inspector/InspectionRunner';
import ViolationsListView from './components/inspector/ViolationsListView';
import VerificationList from './components/inspector/VerificationList';
import CertificateVerifierModal from './components/inspector/CertificateVerifierModal';

// Officer Views
import OfficerDashboard from './components/officer/OfficerDashboard';
import WorkerRegistry from './components/officer/WorkerRegistry';
import CertificateManager from './components/officer/CertificateManager';
import CorrectiveActionManager from './components/officer/CorrectiveActionManager';

// Management Views
import ManagementDashboard from './components/management/ManagementDashboard';
import MineComparisonTable from './components/management/MineComparisonTable';
import ExecutiveReportView from './components/management/ExecutiveReportView';
import MineDetailModal from './components/management/MineDetailModal';

// Authority Views
import RegulatoryDashboard from './components/authority/RegulatoryDashboard';
import HighRiskMinesView from './components/authority/HighRiskMinesView';
import AuditTrailView from './components/authority/AuditTrailView';

function MainApp() {
  const { currentUser } = useAuth();
  const { mines } = useData();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [showQuickVerifier, setShowQuickVerifier] = useState(false);
  const [selectedAuditMine, setSelectedAuditMine] = useState(null);

  // Reset tab when user role changes
  useEffect(() => {
    setCurrentTab('dashboard');
  }, [currentUser?.role]);

  if (!currentUser) {
    return <LoginPage />;
  }

  const role = currentUser.role;

  // Render role-specific tab content
  const renderContent = () => {
    if (role === 'INSPECTOR') {
      switch (currentTab) {
        case 'dashboard':
          return <InspectorDashboard onNavigate={(tab) => setCurrentTab(tab)} />;
        case 'inspections':
          return <InspectionRunner onComplete={() => setCurrentTab('violations')} />;
        case 'verify-cert':
          return <CertificateVerifierModal isOpen={true} onClose={() => setCurrentTab('dashboard')} />;
        case 'violations':
          return <ViolationsListView />;
        case 'verifications':
          return <VerificationList />;
        default:
          return <InspectorDashboard onNavigate={(tab) => setCurrentTab(tab)} />;
      }
    }

    if (role === 'OFFICER') {
      switch (currentTab) {
        case 'dashboard':
          return <OfficerDashboard onNavigate={(tab) => setCurrentTab(tab)} />;
        case 'workers':
          return <WorkerRegistry />;
        case 'certificates':
          return <CertificateManager />;
        case 'actions':
          return <CorrectiveActionManager />;
        case 'violations':
          return <ViolationsListView />;
        case 'inspections-log':
          return <AuditTrailView />;
        default:
          return <OfficerDashboard onNavigate={(tab) => setCurrentTab(tab)} />;
      }
    }

    if (role === 'MANAGEMENT') {
      switch (currentTab) {
        case 'dashboard':
          return <ManagementDashboard onNavigate={(tab) => setCurrentTab(tab)} />;
        case 'mines-compare':
          return (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-800">
                <h2 className="text-xl font-bold text-white">Multi-Mine Compliance & Safety Benchmark</h2>
                <p className="text-xs text-slate-400 mt-1">Comparative performance evaluation across operational coalfields</p>
              </div>
              <MineComparisonTable mines={mines} onSelectMine={(m) => setSelectedAuditMine(m)} />
            </div>
          );
        case 'risk-analytics':
          return <ManagementDashboard onNavigate={(tab) => setCurrentTab(tab)} />;
        case 'compliance-reports':
          return <ExecutiveReportView />;
        case 'audit-log':
          return <AuditTrailView />;
        default:
          return <ManagementDashboard onNavigate={(tab) => setCurrentTab(tab)} />;
      }
    }

    if (role === 'AUTHORITY') {
      switch (currentTab) {
        case 'dashboard':
          return <RegulatoryDashboard onNavigate={(tab) => setCurrentTab(tab)} />;
        case 'high-risk':
          return <HighRiskMinesView onSelectMine={(m) => setSelectedAuditMine(m)} />;
        case 'directives':
          return <RegulatoryDashboard onNavigate={(tab) => setCurrentTab(tab)} />;
        case 'audit-log':
          return <AuditTrailView />;
        case 'compliance-reports':
          return <ExecutiveReportView />;
        default:
          return <RegulatoryDashboard onNavigate={(tab) => setCurrentTab(tab)} />;
      }
    }

    return <div className="p-8 text-center text-slate-400">Select a valid menu item from the sidebar.</div>;
  };

  return (
    <div className="min-h-screen bg-coal-950 flex flex-col font-sans text-slate-100 selection:bg-amber-500 selection:text-black">
      {/* 1. Quick Role Switcher Bar */}
      <DemoQuickBar />

      {/* 2. Top Header / Navbar */}
      <Navbar onNavigate={(tab) => setCurrentTab(tab)} />

      {/* 3. Main Body: Sidebar + Dynamic Dashboard Content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentTab={currentTab} onSelectTab={(tab) => setCurrentTab(tab)} />

        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-110px)]">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Audit Mine Modal if triggered */}
      {selectedAuditMine && (
        <MineDetailModal
          isOpen={!!selectedAuditMine}
          onClose={() => setSelectedAuditMine(null)}
          mine={selectedAuditMine}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainApp />
      </DataProvider>
    </AuthProvider>
  );
}
