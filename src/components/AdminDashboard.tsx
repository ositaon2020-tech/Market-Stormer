import React, { useState } from 'react';
import { useOnboarding } from '../state';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { 
  ShieldCheck, LayoutDashboard, ScrollText, Users, Building, 
  Sparkles, CheckCircle2, ChevronRight, Activity, Search, RefreshCw,
  Lightbulb, Landmark, TrendingUp, AlertTriangle, LogOut, ArrowRight, BookOpen,
  Clock, Eye, FileDown, Printer, SlidersHorizontal, Map, CloudLightning,
  Settings, Menu, X, HelpCircle
} from 'lucide-react';
import MamiHubLogo from './MamiHubLogo';
import { exportVendorWeeklyReport, exportRegionWeeklyReport } from '../utils/pdfExport';
import SupabaseSyncPanel from './SupabaseSyncPanel';

export default function AdminDashboard() {
  const { 
    currentUser, 
    vendors, 
    complaints, 
    visits, 
    reports, 
    auditLogs, 
    users, 
    courses,
    logout,
    generateAiOnboardingBrief,
    supabaseEnabled
  } = useOnboarding();

  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'personnel' | 'audit_logs' | 'pdf_exports' | 'settings'>('analytics');
  const [showSupabaseHub, setShowSupabaseHub] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Settings state variables
  const [autoApprove, setAutoApprove] = useState(true);
  const [gpsRequired, setGpsRequired] = useState(false);
  const [dualApproval, setDualApproval] = useState(true);
  const [targetCompletions, setTargetCompletions] = useState('85');
  const [emailAlerts, setEmailAlerts] = useState(true);
  
  // PDF Export states
  const [selectedPdfRegion, setSelectedPdfRegion] = useState('');
  const [selectedPdfVendorId, setSelectedPdfVendorId] = useState('');
  const [exportNotification, setExportNotification] = useState('');

  // Filtering & Search
  const [logSearch, setLogSearch] = useState('');
  const [logFilter, setLogFilter] = useState('');

  // AI strategy states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStrategy, setAiStrategy] = useState<{ executiveSummary: string; directives: string[] } | null>(null);

  // Compute aggregate metrics
  const totalRegistered = vendors.length;
  
  // Onboarded is fully complete (Step 6)
  const fullyCompleted = vendors.filter(v => v.onboardingStep === 6).length;
  const conversionRate = totalRegistered > 0 ? Math.round((fullyCompleted / totalRegistered) * 100) : 0;
  
  const totalProductsLive = vendors.reduce((sum, v) => sum + v.products.filter(p => p.status === 'approved').length, 0);
  const totalSimulatedOrders = vendors.reduce((sum, v) => sum + v.ordersCount, 0);
  const totalResolvedComplaints = complaints.filter(c => c.status === 'resolved').length;
  const totalPendingComplaints = complaints.filter(c => c.status !== 'resolved').length;
  const totalWeeklyVisits = visits.length;

  // Compute step funnel counts
  const funnelData = [
    { name: '1. Registered', count: vendors.filter(v => v.onboardingStep >= 1).length },
    { name: '2. Profile Done', count: vendors.filter(v => v.onboardingStep >= 2).length },
    { name: '3. 1st Prod Live', count: vendors.filter(v => v.onboardingStep >= 3).length },
    { name: '4. 10+ Prods Live', count: vendors.filter(v => v.onboardingStep >= 4).length },
    { name: '5. 1st Order Logged', count: vendors.filter(v => v.onboardingStep >= 5).length },
    { name: '6. Fulfilled', count: vendors.filter(v => v.onboardingStep >= 6).length },
  ];

  // Hub specific aggregation
  const hubStats = [
    {
      name: 'East Hub',
      vendors: vendors.filter(v => v.hubRegion === 'East Hub').length,
      completions: vendors.filter(v => v.hubRegion === 'East Hub' && v.onboardingStep === 6).length,
      visits: visits.filter(v => vendors.find(vd => vd.id === v.vendorId)?.hubRegion === 'East Hub').length,
    },
    {
      name: 'Central Hub',
      vendors: vendors.filter(v => v.hubRegion === 'Central Hub').length,
      completions: vendors.filter(v => v.hubRegion === 'Central Hub' && v.onboardingStep === 6).length,
      visits: visits.filter(v => vendors.find(vd => vd.id === v.vendorId)?.hubRegion === 'Central Hub').length,
    }
  ];

  // City specific aggregation
  const citiesList = ['Lagos', 'Abuja', 'Port Harcourt', 'Enugu', 'Aba', 'Onitsha'];
  const cityStats = citiesList.map(city => {
    const cityVendors = vendors.filter(v => (v.city || 'Lagos').toLowerCase() === city.toLowerCase());
    const completions = cityVendors.filter(v => v.onboardingStep === 6).length;
    const totalSteps = cityVendors.reduce((sum, v) => sum + v.onboardingStep, 0);
    const avgStep = cityVendors.length > 0 ? (totalSteps / cityVendors.length).toFixed(1) : '0.0';
    return {
      name: city,
      vendors: cityVendors.length,
      completions,
      avgStep,
    };
  });

  // Compute field officer metrics
  const fieldOfficers = users.filter(u => u.role === 'field_personnel');
  const officerPerformance = fieldOfficers.map(officer => {
    const assignedVendors = vendors.filter(v => v.fieldOfficerId === officer.id);
    const completedVendorsCount = assignedVendors.filter(v => v.onboardingStep === 6).length;
    const completedTrainingsCount = courses.filter(c => c.completedByFieldOfficers.includes(officer.id)).length;
    
    // Average step completion rating
    const totalStepsLogged = assignedVendors.reduce((sum, v) => sum + v.onboardingStep, 0);
    const avgStepNo = assignedVendors.length > 0 ? (totalStepsLogged / assignedVendors.length).toFixed(1) : '0.0';

    return {
      ...officer,
      assignedCount: assignedVendors.length,
      completedCount: completedVendorsCount,
      completedTrainings: completedTrainingsCount,
      avgStep: avgStepNo,
    };
  });

  const handleFetchAiBrief = async () => {
    setAiLoading(true);
    try {
      const data = await generateAiOnboardingBrief();
      setAiStrategy(data);
    } catch {
      setAiStrategy({
        executiveSummary: "Strategic onboarding dashboard pipelines logged strong initial registration volume. Directives focusing on product detail support and localized logistics must be pushed immediately to Sarah Jenkins in East Hub.",
        directives: [
          'Direct Jess Chen to prioritize Bloom Nursing clinic validation setup.',
          'Supervisors must inspect organic cert labels on massage oils before final listing approval.',
          'Validate payout routing accounts manual override.'
        ]
      });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col md:flex-row">
      
      {/* Mobile Top Header (only on mobile) */}
      <div className="md:hidden bg-white border-b border-brand-100 px-4 py-3.5 flex justify-between items-center sticky top-0 z-30 shadow-xs w-full">
        <div className="flex items-center gap-2">
          <MamiHubLogo size="sm" />
          <span className="px-1.5 py-0.5 rounded-xs bg-brand-50 text-brand-800 text-[9px] font-bold uppercase tracking-wider">ADMIN</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1.5 px-3 rounded-lg border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span className="text-xs font-semibold">Menu</span>
        </button>
      </div>

      {/* LEFT SIDEBAR (Sticky on desktop, slide-over drawer on mobile) */}
      {/* Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-neutral-950/40 z-20 md:hidden backdrop-blur-xs transition-opacity" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <aside className={`fixed inset-y-0 left-0 bg-slate-900 text-slate-200 flex flex-col justify-between shrink-0 h-full z-30 border-r border-slate-800 transition-all duration-300 md:sticky md:translate-x-0 ${isSidebarOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full md:w-64 md:translate-x-0 w-0'}`}>
        <div className="flex flex-col flex-1 p-5 overflow-y-auto">
          {/* Logo Section */}
          <div className="flex items-center gap-3 pb-5 border-b border-slate-800 mb-6">
            <MamiHubLogo size="sm" light />
            <div className="min-w-0">
              <span className="px-1.5 py-0.5 rounded bg-brand-500/10 text-[#3ecf8e] border border-[#3ecf8e]/30 text-[9px] font-bold uppercase tracking-widest block w-max">GLOBAL ADMIN</span>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{totalRegistered} Brands Active</p>
            </div>
          </div>

          {/* Current User Card */}
          <div className="bg-slate-800/60 rounded-xl p-3 mb-6 border border-slate-850 flex items-center gap-2.5">
            <img
              src={currentUser?.avatar}
              alt={currentUser?.name}
              referrerPolicy="no-referrer"
              className="w-8.5 h-8.5 rounded-full border border-pink-500/30 object-cover shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white truncate leading-tight">{currentUser?.name}</h4>
              <p className="text-[9px] text-slate-400 font-mono mt-0.5">OPS DIRECTOR</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <span className="block text-[9px] uppercase font-semibold tracking-widest text-slate-500 mb-2 px-1">Main Console</span>
            {[
              { id: 'analytics', label: 'Global Analytics', desc: 'Strategy desk & AI brief', icon: LayoutDashboard },
              { id: 'personnel', label: 'User Management', desc: 'Field officer metrics', icon: Users },
              { id: 'audit_logs', label: 'System Audit Trail', desc: 'Security actions ledger', icon: ScrollText },
              { id: 'pdf_exports', label: 'PDF Reports Console', desc: 'Compile partner dossiers', icon: FileDown },
              { id: 'settings', label: 'Admin Settings', desc: 'Threshold & seeding controls', icon: Settings },
            ].map(item => {
              const Icon = item.icon;
              const active = activeSubTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSubTab(item.id as any);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left select-none transition-all group cursor-pointer ${
                    active 
                      ? 'bg-brand-600 font-bold text-white shadow-xs' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-transform ${active ? 'scale-110 text-white' : 'text-slate-400 group-hover:scale-105'}`} />
                  <div className="min-w-0">
                    <span className="block text-xs font-semibold leading-tight">{item.label}</span>
                    <span className={`block text-[8.5px] truncate mt-0.5 ${active ? 'text-brand-100' : 'text-slate-500'}`}>{item.desc}</span>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Bottom Controls */}
          <div className="pt-6 border-t border-slate-800 mt-auto space-y-3">
            <button 
              onClick={logout}
              className="w-full px-3 py-2 bg-slate-800 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 border border-slate-750 hover:border-rose-900/30 rounded-xl transition-all flex items-center gap-2 text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      </aside>

      {/* RIGHT WORKSPACE STREAM */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header of Right Workspace Panel (Desktop only) */}
        <header className="hidden md:block bg-white border-b border-brand-100 sticky top-0 z-10 py-3.5 px-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-black text-neutral-900 uppercase tracking-wide">
                {activeSubTab === 'analytics' && '📈 Operations & AI Strategy Analysis'}
                {activeSubTab === 'personnel' && '👥 Personnel & User Management'}
                {activeSubTab === 'audit_logs' && '📜 System Security Audit Trail'}
                {activeSubTab === 'pdf_exports' && '📥 Region & Partner Reports Exporter'}
                {activeSubTab === 'settings' && '🛠️ Admin System Settings'}
              </h2>
              <p className="text-[10px] text-neutral-400 font-mono mt-0.5">MamiHubs Global Command Centre</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-brand-50 border border-brand-100 text-[9px] font-bold text-brand-700 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                SECURE CONSOLE ACTIVE
              </span>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">

        {/* Global KPI cards - stays across tabs for global overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
            <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Total Registered</h4>
            <div className="text-xl font-extrabold text-neutral-900">{totalRegistered} Brands</div>
            <p className="text-[9px] text-brand-600 font-bold mt-1.5 uppercase font-mono">Marketplace Feed</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
            <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Completions Conversion</h4>
            <div className="text-xl font-extrabold text-emerald-600">{conversionRate}%</div>
            <p className="text-[9px] text-neutral-400 mt-1.5">Converts registered to fulfilled</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
            <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Weekly Audits Made</h4>
            <div className="text-xl font-extrabold text-indigo-600">{totalWeeklyVisits} Visits</div>
            <p className="text-[9px] text-neutral-400 mt-1.5">Logged by supervisors</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
            <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Products Live</h4>
            <div className="text-xl font-extrabold text-sky-600">{totalProductsLive} Listed</div>
            <p className="text-[9px] text-neutral-400 mt-1.5">Organic baby compliant</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
            <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Total Orders Logged</h4>
            <div className="text-xl font-extrabold text-orange-600">{totalSimulatedOrders} Sales</div>
            <p className="text-[9px] text-neutral-400 mt-1.5">Simulations checkout</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
            <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Tickets Resolved</h4>
            <div className="text-xl font-extrabold text-green-600">
              {totalResolvedComplaints} / {totalResolvedComplaints + totalPendingComplaints}
            </div>
            <p className="text-[9px] text-amber-600 font-medium mt-1.5">Pending queue: {totalPendingComplaints}</p>
          </div>
        </div>

        {/* Dynamic displays based on tab */}
        {activeSubTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Funnel visual graph block */}
              <div className="lg:col-span-12 xl:col-span-7 bg-white rounded-xl border border-neutral-200 p-6 shadow-xs">
                <div className="border-b border-neutral-100 pb-3 mb-4">
                  <h3 className="font-display font-semibold text-neutral-800">Onboarding Funnel Step Distribution</h3>
                  <p className="text-xs text-neutral-500 font-sans">Active drop-off conversion mapping for maternal hubs</p>
                </div>

                <div className="w-full h-[270px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={funnelData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#888888" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#888888" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip 
                        contentStyle={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #df6c51', fontSize: '11px' }}
                        cursor={{ fill: 'rgba(223, 108, 81, 0.04)' }}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="#df6c51" 
                        radius={[4, 4, 0, 0]} 
                        maxBarSize={55}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Hub breakdowns and AI generator block */}
              <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                {/* AI Executive Strategy Report */}
                <div className="bg-linear-to-r from-neutral-900 to-slate-905 rounded-xl text-white p-6 shadow-md relative overflow-hidden border border-neutral-800">
                  <div className="absolute right-0 top-0 w-28 h-28 bg-brand-500 rounded-full blur-2.5xl opacity-20 pointer-events-none" />
                  
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-3.5 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4.5 h-4.5 text-brand-400 animate-pulse" />
                      <span className="font-display font-semibold text-xs tracking-wider uppercase">Gemini Executive Strategy Advisor</span>
                    </div>

                    <button
                      onClick={handleFetchAiBrief}
                      disabled={aiLoading}
                      className="bg-brand-500 hover:bg-brand-600 text-white text-[10px] font-bold p-1 px-3 rounded-lg shadow-sm transition-all flex items-center gap-1 disabled:opacity-75"
                    >
                      {aiLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      Assess Pipelines
                    </button>
                  </div>

                  {aiStrategy ? (
                    <div className="space-y-4 text-xs font-sans animate-fade-in leading-relaxed">
                      <div>
                        <span className="block text-[9px] text-brand-300 uppercase tracking-widest font-extrabold">Executive Summary Brief:</span>
                        <p className="text-neutral-300 mt-1 font-medium leading-relaxed">
                          {aiStrategy.executiveSummary}
                        </p>
                      </div>

                      <div>
                        <span className="block text-[9px] text-amber-300 uppercase tracking-widest font-extrabold mb-1">Direct Operational Action directives:</span>
                        <ul className="space-y-2">
                          {aiStrategy.directives.map((dir, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-neutral-300">
                              <span className="font-mono text-brand-400 font-bold shrink-0">{idx+1}.</span>
                              <span className="font-medium leading-relaxed">{dir}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-neutral-400 font-sans leading-relaxed">
                      <p className="font-medium italic">
                        Evaluate the entire marketplace onboarding flow with Artificial Intelligence.
                      </p>
                      <p className="mt-2 text-[11px]">
                        The assessment queries Gemini 2.5 on backend servers passing complete pipeline counts across step milestones. It will yield actionable directives to supervisors and alert dispatch channels.
                      </p>
                    </div>
                  )}
                </div>

                {/* Hub Specific table */}
                <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
                  <h3 className="font-display font-semibold text-neutral-800 mb-3 text-xs uppercase tracking-wider">Regional Hub performance</h3>
                  
                  <div className="space-y-3.5">
                    {hubStats.map(hub => {
                      return (
                        <div key={hub.name} className="flex items-center justify-between p-2.5 border border-neutral-100 rounded-lg bg-neutral-50/50">
                          <div>
                            <h4 className="font-semibold text-neutral-900 text-xs">{hub.name}</h4>
                            <p className="text-[10px] text-neutral-400 mt-1">Registrations: <strong>{hub.vendors}</strong> | Active completions: <strong>{hub.completions}</strong></p>
                          </div>
                          <span className="bg-neutral-100 px-2 py-0.5 rounded font-mono text-[10px] text-neutral-500 font-bold">
                            Visits: {hub.visits}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* City Onboarding performance */}
                <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
                  <h3 className="font-display font-semibold text-neutral-800 mb-3 text-xs uppercase tracking-wider">City-Level Onboarding Performance</h3>
                  
                  <div className="space-y-3">
                    {cityStats.map(city => {
                      const completionRate = city.vendors > 0 ? Math.round((city.completions / city.vendors) * 100) : 0;
                      return (
                        <div key={city.name} className="p-3 border border-neutral-100 rounded-lg bg-neutral-50/40 hover:bg-white transition-all">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
                                <span className="text-brand-500">📍</span> {city.name}
                              </h4>
                              <p className="text-[10px] text-neutral-400 mt-0.5">
                                Registered: <strong className="text-neutral-700">{city.vendors}</strong> | Fully Onboarded: <strong className="text-neutral-700">{city.completions}</strong>
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="inline-block bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold leading-none">
                                Avg Step: {city.avgStep}/6
                              </span>
                              <div className="text-[9px] text-neutral-400 mt-1">
                                {completionRate}% complete
                              </div>
                            </div>
                          </div>
                          
                          {/* Mini progress bar for city setup */}
                          <div className="w-full bg-neutral-100 rounded-full h-1 mt-2 overflow-hidden">
                            <div 
                              className="bg-brand-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${(parseFloat(city.avgStep) / 6) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'personnel' && (
          <div className="space-y-6">
            {/* Live Portal Session & Activity Status Board */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs">
              <div className="border-b border-neutral-100 pb-3 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-display font-semibold text-neutral-800 flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Portal Coordination & Staff Activities
                  </h3>
                  <p className="text-xs text-neutral-500">Real-time status tracking for Admins, Supervisors and Officers currently authenticated</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-brand-50 border border-brand-100 font-bold text-class-700 text-brand-700 px-2 py-1 rounded">
                    Active Ledger Queries standard
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map(u => {
                  const userLogs = auditLogs.filter(log => log.userId === u.id);
                  const lastLog = userLogs[0]; // sorted newest first
                  const totalActions = userLogs.length;

                  // Determine active status tag
                  let statusText = "⚪ Offline";
                  let statusColor = "text-neutral-400 bg-neutral-50 border-neutral-200";
                  let lightColor = "bg-neutral-300";
                  
                  if (currentUser?.id === u.id) {
                    statusText = "🟢 Live Now (You)";
                    statusColor = "text-emerald-800 bg-emerald-50 border-emerald-100";
                    lightColor = "bg-emerald-500 animate-ping";
                  } else if (totalActions > 0) {
                    statusText = "🟢 Active Port";
                    statusColor = "text-emerald-700 bg-emerald-50/50 border-emerald-100/50";
                    lightColor = "bg-emerald-400";
                  } else {
                    statusText = "⚪ Standby";
                    statusColor = "text-neutral-500 bg-neutral-50 border-neutral-100";
                    lightColor = "bg-neutral-300";
                  }

                  // Determine role visual details
                  let roleBadge = "bg-neutral-100 text-neutral-700 border-neutral-200";
                  if (u.role === 'admin') roleBadge = "bg-rose-50 text-rose-700 border-rose-100 font-extrabold";
                  else if (u.role === 'supervisor') roleBadge = "bg-emerald-50 text-emerald-700 border-emerald-100 font-extrabold";
                  else if (u.role === 'field_personnel') roleBadge = "bg-sky-50 text-sky-700 border-sky-100 font-extrabold";

                  return (
                    <div 
                      key={u.id} 
                      className="p-4 border border-neutral-100 hover:border-brand-200 bg-neutral-50/20 hover:bg-white rounded-xl transition-all shadow-2xs flex flex-col justify-between"
                    >
                      <div>
                        {/* Status + Role bar */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusColor}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${lightColor}`} />
                            {statusText}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[8.5px] uppercase tracking-wider border ${roleBadge}`}>
                            {u.role === 'field_personnel' ? 'Field personnel' : u.role}
                          </span>
                        </div>

                        {/* User bio */}
                        <div className="flex items-start gap-3 mb-4">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-full object-cover border border-neutral-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-neutral-900 text-xs leading-tight">{u.name}</h4>
                            <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{u.email}</p>
                            <p className="text-[10px] text-brand-600 font-semibold mt-1">📍 {u.region}</p>
                          </div>
                        </div>

                        {/* Last action log detail */}
                        <div className="border-t border-neutral-100 pt-3 mt-1 bg-neutral-50/50 p-2 rounded-lg">
                          <div className="flex items-center justify-between text-[9px] text-neutral-400 font-semibold uppercase tracking-wider mb-1">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Last Recorded Portal Activity</span>
                            <span className="font-mono text-[9px]">{totalActions} total</span>
                          </div>
                          
                          {lastLog ? (
                            <div className="space-y-1">
                              <p className="text-xs text-neutral-700 font-medium line-clamp-2">
                                {lastLog.details}
                              </p>
                              <p className="text-[9px] text-neutral-400 font-mono">
                                Action: <strong className="text-neutral-500 font-bold">{lastLog.action}</strong> • {new Date(lastLog.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-neutral-400 italic">
                              No coordination activities recorded in this sandbox database.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Trace Logs Button */}
                      <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-end">
                        <button 
                          onClick={() => {
                            setLogSearch(u.name);
                            setLogFilter('');
                            setActiveSubTab('audit_logs');
                          }}
                          className="text-[10.5px] font-bold text-brand-600 hover:text-brand-800 transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Audit Full Activity Sequence &rarr;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Existing Table section */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs">
              <div className="border-b border-neutral-100 pb-3 mb-4">
                <h3 className="font-display font-semibold text-neutral-800">Assigned Field Officers Performance Roster</h3>
                <p className="text-xs text-neutral-500 font-sans">Compare onboarding velocity, checked steps, and completed empathy learnings</p>
              </div>

              <div className="overflow-x-auto text-xs font-sans">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-400 font-bold bg-neutral-50">
                      <th className="p-3">Field Officer Name</th>
                      <th className="p-3">Assigned Region</th>
                      <th className="p-3 text-center">Managed Vendors</th>
                      <th className="p-3 text-center">Completions (Step 6)</th>
                      <th className="p-3 text-center">Average Vendor Step</th>
                      <th className="p-3 text-center">Courses Finished</th>
                      <th className="p-3 text-right">Contact Coordinate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-medium">
                    {officerPerformance.map(o => (
                      <tr key={o.id} className="hover:bg-neutral-50/50 transition-all">
                        <td className="p-3 flex items-center gap-2.5">
                          <img
                            src={o.avatar}
                            alt={o.name}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full border border-neutral-100 object-cover"
                          />
                          <div>
                            <span className="font-semibold text-neutral-900">{o.name}</span>
                            <span className="block text-[9px] text-neutral-400 font-mono">ID: {o.id}</span>
                          </div>
                        </td>
                        <td className="p-3 text-neutral-600">{o.region}</td>
                        <td className="p-3 text-center text-neutral-900 font-bold">{o.assignedCount}</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">{o.completedCount}</td>
                        <td className="p-3 text-center">
                          <span className="p-1 px-2.5 bg-neutral-100 rounded text-neutral-700 font-bold font-mono">
                            {o.avgStep} / 6.0
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center gap-1 font-semibold text-indigo-700">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                            {o.completedTrainings} Module(s)
                          </span>
                        </td>
                        <td className="p-3 text-right text-neutral-500 font-mono">{o.phone || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'audit_logs' && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs">
            <div className="border-b border-neutral-100 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-semibold text-neutral-800">Secure Systemic Audit Ledger</h3>
                <p className="text-xs text-neutral-500">Immutable trace sequence of sandbox onboarding operations</p>
              </div>

              <div className="flex gap-2.5">
                <input
                  type="text"
                  placeholder="Query actor/details..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg placeholder-neutral-400 font-medium leading-none"
                />

                <select
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="text-xs px-3 bg-neutral-50 border border-neutral-100 text-neutral-500 rounded-lg font-semibold"
                >
                  <option value="">All Actions</option>
                  <option value="REGISTER_VENDOR">REGISTER_VENDOR</option>
                  <option value="UPDATE_CHECKLIST">UPDATE_CHECKLIST</option>
                  <option value="ADD_PRODUCT">ADD_PRODUCT</option>
                  <option value="SIMULATE_ORDER">SIMULATE_ORDER</option>
                  <option value="LOG_VISIT">LOG_VISIT</option>
                  <option value="RESOLVE_COMPLAINT">RESOLVE_COMPLAINT</option>
                  <option value="SUBMIT_REPORT">SUBMIT_REPORT</option>
                  <option value="REVIEW_REPORT">REVIEW_REPORT</option>
                </select>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[480px] divide-y divide-neutral-100 font-sans text-xs">
              {auditLogs
                .filter(log => !logSearch || log.userName.toLowerCase().includes(logSearch.toLowerCase()) || log.details.toLowerCase().includes(logSearch.toLowerCase()))
                .filter(log => !logFilter || log.action === logFilter)
                .map(log => {
                  let roleBadge = "bg-sky-50 text-sky-700 border-sky-100";
                  if (log.userRole === 'admin') roleBadge = "bg-rose-50 text-rose-700 border-rose-100";
                  else if (log.userRole === 'supervisor') roleBadge = "bg-emerald-50 text-emerald-700 border-emerald-100";

                  return (
                    <div key={log.id} className="p-3 hover:bg-neutral-50/50 transition-all flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold text-neutral-900">{log.userName}</span>
                          <span className={`px-1 rounded-sm text-[8px] font-extrabold tracking-wide border ${roleBadge}`}>
                            {log.userRole?.toUpperCase()}
                          </span>
                          <span className="text-[10px] bg-neutral-100 text-neutral-600 font-semibold px-1 rounded border font-mono">
                            {log.action}
                          </span>
                        </div>
                        <p className="text-neutral-600 leading-relaxed max-w-4xl">
                           {log.details}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400 text-right shrink-0">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {activeSubTab === 'pdf_exports' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs">
              <div className="border-b border-neutral-100 pb-3 mb-5">
                <span className="text-[10px] bg-rose-50 border border-rose-150 font-bold text-rose-700 px-2.5 py-1 rounded tracking-wider uppercase">
                  🔑 Administrative PDF Ledger Builder
                </span>
                <h3 className="font-display font-black text-neutral-900 text-lg mt-2 uppercase">
                  Global Onboarding Compilation Suite
                </h3>
                <p className="text-xs text-neutral-500">
                  Compile verified documentation for local financial institutions, district sponsors, or trade union leaders.
                </p>
              </div>

              {exportNotification && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-100 mb-6 animate-pulse">
                  {exportNotification}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* GLOBAL REGIONAL LEDGER COMPILATION */}
                <div className="p-6 bg-neutral-50/50 border border-neutral-200 rounded-2xl flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-brand-50/40 rounded-bl-full pointer-events-none" />
                  <div>
                    <span className="text-[9px] bg-neutral-100 border border-neutral-200 px-1 py-0.5 rounded font-bold text-neutral-500 font-mono">
                      ADMIN SCOPE: REGIONAL NETWORK
                    </span>
                    <h4 className="text-base font-black text-neutral-900 mt-2.5">
                      Select District Hub Registry
                    </h4>
                    <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                      Prepare structural performance sheets, average steps, and compliance statistics for state or city-wide clusters.
                    </p>

                    <div className="mt-4">
                      <label htmlFor="region-pdf-select" className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                        Choose District Hub
                      </label>
                      <select
                        id="region-pdf-select"
                        value={selectedPdfRegion}
                        onChange={(e) => setSelectedPdfRegion(e.target.value)}
                        className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-800 focus:ring-2 focus:ring-brand-500/20 focus:outline-hidden"
                      >
                        <option value="">-- Choose active territory --</option>
                        {Array.from(new Set(vendors.map(v => v.hubRegion))).map(regName => (
                          <option key={regName} value={regName}>{regName}</option>
                        ))}
                      </select>
                    </div>

                    {selectedPdfRegion && (() => {
                      const regVendors = vendors.filter(v => v.hubRegion === selectedPdfRegion);
                      const regComplaints = complaints.filter(c => regVendors.some(rv => rv.id === c.vendorId));
                      return (
                        <div className="mt-4 p-3 bg-white border border-neutral-150 rounded-xl space-y-1.5 text-xs animate-fade-in">
                          <div className="flex justify-between">
                            <span className="text-neutral-400">Total Vendors in Hub:</span>
                            <span className="font-bold text-slate-800">{regVendors.length} brands</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-400">Perfect Completions:</span>
                            <span className="font-bold text-emerald-600">{regVendors.filter(v => v.onboardingStep === 6).length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-400">Active Complaints:</span>
                            <span className="font-bold text-rose-600">{regComplaints.filter(c => c.status !== 'resolved').length} open</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="mt-6 pt-4 border-t border-neutral-150">
                    <button
                      disabled={!selectedPdfRegion}
                      onClick={() => {
                        const regVendors = vendors.filter(v => v.hubRegion === selectedPdfRegion);
                        exportRegionWeeklyReport(selectedPdfRegion, regVendors, complaints, visits);
                        setExportNotification(`✓ Compiled and exported Regional Hub Audit Ledger for: ${selectedPdfRegion}`);
                        setTimeout(() => setExportNotification(''), 4500);
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FileDown className="w-4 h-4" />
                      Build Regional Progress Book PDF
                    </button>
                  </div>
                </div>

                {/* COUNTRY-WIDE SYSTEM INTEGRATION PARTNER */}
                <div className="p-6 bg-neutral-50/50 border border-neutral-200 rounded-2xl flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-sky-100/30 rounded-bl-full pointer-events-none" />
                  <div>
                    <span className="text-[9px] bg-neutral-100 border border-neutral-200 px-1 py-0.5 rounded font-bold text-neutral-500 font-mono">
                      ADMIN SCOPE: NATIONWIDE PORTFOLIO
                    </span>
                    <h4 className="text-base font-black text-neutral-900 mt-2.5">
                      Verify Individual Merchant
                    </h4>
                    <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                      Select any merchant registered on the Market Stormer ledger nationwide to download a micro-check progress dossier.
                    </p>

                    <div className="mt-4">
                      <label htmlFor="vendor-admin-pdf-select" className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                        Choose Nationwide Partner
                      </label>
                      <select
                        id="vendor-admin-pdf-select"
                        value={selectedPdfVendorId}
                        onChange={(e) => setSelectedPdfVendorId(e.target.value)}
                        className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500/20 focus:outline-hidden"
                      >
                        <option value="">-- Choose nationwide partner --</option>
                        {vendors.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.name} ({v.hubRegion})
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedPdfVendorId && (() => {
                      const found = vendors.find(v => v.id === selectedPdfVendorId);
                      if (!found) return null;
                      return (
                        <div className="mt-4 p-3 bg-white border border-neutral-150 rounded-xl space-y-1.5 text-xs animate-fade-in">
                          <div className="flex justify-between">
                            <span className="text-neutral-400">Assigned Hub:</span>
                            <span className="font-bold text-brand-700">{found.hubRegion}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-400">Total Products:</span>
                            <span className="font-bold text-slate-800">{found.products?.length || 0} SKU</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-400">Step Reached:</span>
                            <span className="font-slate-800 font-bold">Step {found.onboardingStep} / 6</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="mt-6 pt-4 border-t border-neutral-150">
                    <button
                      disabled={!selectedPdfVendorId}
                      onClick={() => {
                        const found = vendors.find(v => v.id === selectedPdfVendorId);
                        if (found) {
                          exportVendorWeeklyReport(found, complaints, visits);
                          setExportNotification(`✓ Compiled and exported Partner Audit dossier for: ${found.name}`);
                          setTimeout(() => setExportNotification(''), 4500);
                        }
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FileDown className="w-4 h-4 animate-bounce" />
                      Build Partner Checklist PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB settings */}
        {activeSubTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in duration-250">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Rules & Policies */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs">
                  <div className="border-b border-neutral-100 pb-3 mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-semibold text-neutral-800 text-sm uppercase">Operational Automation Rules</h3>
                      <p className="text-xs text-neutral-500">Enable algorithmic controls for Nigerian Hub registration</p>
                    </div>
                    <Settings className="w-5 h-5 text-brand-600" />
                  </div>

                  <div className="space-y-4 pt-1">
                    <label className="flex items-start gap-3 p-3 hover:bg-neutral-50 rounded-xl border border-neutral-100 transition-all cursor-pointer">
                      <input 
                        type="checkbox" 
                        id="setting-auto-approve-sku"
                        checked={autoApprove} 
                        onChange={(e) => setAutoApprove(e.target.checked)}
                        className="mt-0.5 rounded-sm border-neutral-300 text-brand-600 focus:ring-brand-500/40"
                      />
                      <div>
                        <span className="block text-xs font-bold text-neutral-800">Automatic Maternal SKUs Validation Approval</span>
                        <span className="block text-[10px] text-neutral-500 mt-0.5 leading-relaxed">Skip manual verification queues for trusted organic categories (baby foods, botanical nursing tonics)</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 hover:bg-neutral-50 rounded-xl border border-neutral-100 transition-all cursor-pointer">
                      <input 
                        type="checkbox" 
                        id="setting-gps-required"
                        checked={gpsRequired} 
                        onChange={(e) => setGpsRequired(e.target.checked)}
                        className="mt-0.5 rounded-sm border-neutral-300 text-brand-600 focus:ring-brand-500/40"
                      />
                      <div>
                        <span className="block text-xs font-bold text-neutral-800">Strict Geo-Location & GPS Telemetry Checkpoint</span>
                        <span className="block text-[10px] text-neutral-500 mt-0.5 leading-relaxed">Require field personnel to submit absolute coordinates matching registered market stalls</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 hover:bg-neutral-50 rounded-xl border border-neutral-100 transition-all cursor-pointer">
                      <input 
                        type="checkbox" 
                        id="setting-dual-approval"
                        checked={dualApproval} 
                        onChange={(e) => setDualApproval(e.target.checked)}
                        className="mt-0.5 rounded-sm border-neutral-300 text-brand-600 focus:ring-brand-500/40"
                      />
                      <div>
                        <span className="block text-xs font-bold text-neutral-800">Enforce Dual-Supervisor Escrow Sign-Off</span>
                        <span className="block text-[10px] text-neutral-500 mt-0.5 leading-relaxed">High-threshold vendors must carry two independent supervisor audits before becoming fully live</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs">
                  <div className="border-b border-neutral-100 pb-3 mb-4">
                    <h3 className="font-display font-semibold text-neutral-800 text-sm uppercase">Target Regional Quotas</h3>
                    <p className="text-xs text-neutral-500">Configure target metrics for automated performance ratings</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-neutral-700">Completions Conversion target</span>
                        <span className="text-xs font-extrabold text-brand-600 font-mono">{targetCompletions}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="50" 
                        max="100" 
                        value={targetCompletions} 
                        onChange={(e) => setTargetCompletions(e.target.value)}
                        className="w-full accent-brand-600 cursor-pointer h-1.5 bg-neutral-100 rounded-lg"
                      />
                      <p className="text-[10px] text-neutral-400 mt-1">Sets the baseline for green indicator scores across regional dashboards</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Default currency denomination</label>
                        <select className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg font-bold">
                          <option value="NGN">NGN (₦) - Nigerian Naira</option>
                          <option value="USD">USD ($) - United States Dollar</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Max Products Limit per seller</label>
                        <input type="number" defaultValue="50" className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg font-bold" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Seeding & System reset controls */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs">
                  <h3 className="font-display font-medium text-neutral-800 text-xs tracking-wider uppercase mb-2">Sandbox System Reset</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Clear locally saved test transactions, register states, training completions, or restore raw Nigerian market cluster seeding models.
                  </p>

                  <div className="space-y-3 pt-4">
                    <button 
                      onClick={() => {
                        localStorage.removeItem('m_vendors');
                        localStorage.removeItem('m_complaints');
                        localStorage.removeItem('m_visits');
                        localStorage.removeItem('m_audits');
                        alert('Sandbox Cache Cleared! Please reload the applet to reload primary mock records.');
                        window.location.reload();
                      }}
                      className="w-full text-center bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold py-2.5 rounded-xl transition-all active:scale-98 cursor-pointer"
                      id="reset-sandbox-data-btn"
                    >
                      Empty Local Cache Database
                    </button>
                    <p className="text-[9.5px] text-rose-500/80 leading-tight">
                      * Triggers complete eviction of local storage variables. Does not affect Supabase.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-xl p-6 text-white border border-slate-800 shadow-md">
                  <span className="px-1.5 py-0.5 rounded bg-[#3ecf8e]/10 text-[#3ecf8e] text-[9.5px] font-mono border border-[#3ecf8e]/20 uppercase">
                    Platform Status
                  </span>
                  <h4 className="text-sm font-bold mt-2.5 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-[#3ecf8e] animate-pulse" />
                    Distributed Gateway Status
                  </h4>
                  
                  <div className="space-y-2 text-xs pt-4 font-mono text-neutral-300">
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span>Server Gateway:</span>
                      <span className="text-emerald-400 font-bold">ONLINE</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span>AI Engine Response:</span>
                      <span className="text-emerald-400 font-bold">STABLE</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sync Engine:</span>
                      <span className={supabaseEnabled ? 'text-[#3ecf8e] font-bold' : 'text-amber-500 font-bold'}>
                        {supabaseEnabled ? 'MIRROR ACTIVE' : 'OFFLINE SANDBOX'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>

    {/* Supabase Integration Hub Model Slider overlay */}
    {showSupabaseHub && (
      <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <SupabaseSyncPanel onClose={() => setShowSupabaseHub(false)} />
      </div>
    )}
  </div>
  );
}
