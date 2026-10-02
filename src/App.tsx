import React from 'react';
import { useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { NotificationToast } from './components/common/NotificationToast';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PosPage } from './pages/PosPage';
import { ShiftPage } from './pages/ShiftPage';
import { MenuHppPage } from './pages/MenuHppPage';
import { PettyCashPage } from './pages/PettyCashPage';
import { FactoryBillsPage } from './pages/FactoryBillsPage';
import { FixedExpensesPage } from './pages/FixedExpensesPage';
import { ProfitLossPage } from './pages/ProfitLossPage';

export const AppContent: React.FC = () => {
  const { currentView, isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <NotificationToast />
      </>
    );
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard-utama':
        return <DashboardPage />;
      case 'transaksi-kasir-pos':
        return <PosPage />;
      case 'sesi-shift-kasir':
        return <ShiftPage />;
      case 'master-menu-dimsum-hpp':
        return <MenuHppPage />;
      case 'kas-kecil-outlet':
        return <PettyCashPage />;
      case 'tagihan-suplai-pabrik':
        return <FactoryBillsPage />;
      case 'beban-operasional-tetap':
        return <FixedExpensesPage />;
      case 'laporan-laba-rugi-arus-kas':
        return <ProfitLossPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-surface-canvas text-on-surface antialiased flex">
      {/* Fixed Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 pl-0 lg:pl-72 flex flex-col min-h-screen w-full overflow-x-hidden">
        {/* Fixed Top Header */}
        <Header />

        {/* Dynamic Page Workspace */}
        <main className="flex-1 pt-20 px-3.5 sm:px-6 pb-24 lg:pb-12 w-full max-w-[1600px] mx-auto">
          {renderCurrentView()}
        </main>
      </div>

      {/* Floating System Toast Notifications */}
      <NotificationToast />
    </div>
  );
};

export default function App() {
  return <AppContent />;
}

