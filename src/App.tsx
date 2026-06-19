/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { OnboardingProvider, useOnboarding } from './state';
import LoginScreen from './components/LoginScreen';
import FieldOfficerDashboard from './components/FieldOfficerDashboard';
import SupervisorDashboard from './components/SupervisorDashboard';
import AdminDashboard from './components/AdminDashboard';
import { Sparkles, HelpCircle } from 'lucide-react';

function DashboardSwitcher() {
  const { currentUser } = useOnboarding();

  if (!currentUser) {
    return <LoginScreen />;
  }

  switch (currentUser.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'supervisor':
      return <SupervisorDashboard />;
    case 'field_personnel':
      return <FieldOfficerDashboard />;
    default:
      return <LoginScreen />;
  }
}

export default function App() {
  return (
    <OnboardingProvider>
      <div className="min-h-screen flex flex-col justify-between">
        {/* Main interactive switcher */}
        <div className="flex-1">
          <DashboardSwitcher />
        </div>

        {/* Humid Sandbox footer banner */}
        <footer className="bg-neutral-900 text-neutral-400 py-3 border-t border-neutral-800 text-center text-xs font-sans">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="font-medium text-[11px] leading-relaxed">
              MamiHubs™ Vendor Onboarding Platform Sandbox • Cloud Run Full-Stack Environment
            </p>
            <div className="flex items-center justify-center gap-4 text-[10px] text-neutral-500 font-medium">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-brand-400" />
                Gemini 2.5 Flash suggestions active
              </span>
              <span>UTC Logs standard</span>
            </div>
          </div>
        </footer>
      </div>
    </OnboardingProvider>
  );
}
