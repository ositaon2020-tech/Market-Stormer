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
      </div>
    </OnboardingProvider>
  );
}
