import React, { useState } from 'react';
import { useOnboarding } from '../state';
import { Vendor, Complaint, DailyReport, Product } from '../types';
import { 
  Building2, MapPin, Phone, Mail, FileText, CheckCircle, AlertOctagon, 
  Sparkles, ShieldCheck, CheckSquare, Trash2, ShieldAlert, ArrowRight, 
  Lightbulb, Compass, Star, Calendar, Clock, Smile, Trash, Map, RefreshCw,
  FileDown, Printer, SlidersHorizontal, CloudLightning
} from 'lucide-react';
import MamiHubLogo from './MamiHubLogo';
import { exportVendorWeeklyReport, exportRegionWeeklyReport } from '../utils/pdfExport';
import SupabaseSyncPanel from './SupabaseSyncPanel';

export default function SupervisorDashboard() {
  const { 
    currentUser, 
    vendors, 
    reports, 
    complaints, 
    visits, 
    courses, 
    users,
    logout,
    reviewDailyReport,
    logWeeklyVisit,
    resolveComplaint,
    updateVendorQuality,
    toggleFieldOfficerTraining,
    generateAiResolutionDraft
  } = useOnboarding();

  const [showSupabaseHub, setShowSupabaseHub] = useState(false);

  // Tab views
  const [activeTab, setActiveTab] = useState<'reports' | 'visits' | 'complaints' | 'quality' | 'inactive' | 'training' | 'pdf_exports'>('reports');
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  
  // PDF Export states
  const [selectedPdfVendorId, setSelectedPdfVendorId] = useState('');
  const [exportNotification, setExportNotification] = useState('');

  // Weekly Visit state
  const [visitVendorId, setVisitVendorId] = useState('');
  const [visitNotes, setVisitNotes] = useState('');
  const [visitDuration, setVisitDuration] = useState('30');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [visitSuccess, setVisitSuccess] = useState('');

  // AI draft states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState<string>('');
  const [aiSteps, setAiSteps] = useState<string[]>([]);
  const [aiTraining, setAiTraining] = useState<string>('');

  // Custom QA filters
  const [qaSearch, setQaSearch] = useState('');

  // Filters corresponding to current supervisor hub
  const myHub = currentUser?.region || 'East Hub';
  const hubVendors = vendors.filter(v => v.hubRegion === myHub);
  const hubOfficers = users.filter(u => u.role === 'field_personnel' && u.region === myHub);
  const hubOfficerIds = hubOfficers.map(o => o.id);
  
  // Daily reports belonging to supervisor officers
  const hubReports = reports.filter(r => hubOfficerIds.includes(r.fieldOfficerId));
  // Complaints raised from supervisor hub vendors
  const hubComplaints = complaints.filter(c => hubVendors.map(v => v.id).includes(c.vendorId));

  // Products from hub vendors that require review
  const pendingQaProducts = hubVendors.flatMap(v => 
    v.products.filter(p => p.status === 'pending_review' || p.status === 'rejected').map(p => ({
      ...p,
      vendorId: v.id,
      vendorName: v.name
    }))
  );

  // Inactive vendors in supervisor hub (>10 days)
  const inactiveVendors = hubVendors.filter(v => v.inactiveDays >= 10 || v.onboardingStep < 3 && v.inactiveDays > 4);

  // City specific aggregation for supervisor's hub command
  const citiesList = ['Lagos', 'Abuja', 'Port Harcourt', 'Enugu', 'Aba', 'Onitsha'];
  const supervisorCityStats = citiesList.map(city => {
    const cityVendors = hubVendors.filter(v => (v.city || 'Lagos').toLowerCase() === city.toLowerCase());
    const completions = cityVendors.filter(v => v.onboardingStep === 6).length;
    const totalSteps = cityVendors.reduce((sum, v) => sum + v.onboardingStep, 0);
    const avgStep = cityVendors.length > 0 ? (totalSteps / cityVendors.length).toFixed(1) : '0.0';
    
    // Check if there are any open complaints or pending QA products for this city
    const hasIssues = hubComplaints.some(c => c.status !== 'resolved' && cityVendors.some(v => v.id === c.vendorId));
    const hasPendingQa = pendingQaProducts.some(p => cityVendors.some(v => v.id === p.vendorId));

    return {
      name: city,
      vendors: cityVendors.length,
      completions,
      avgStep,
      hasIssues,
      hasPendingQa
    };
  });

  const handleReviewReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    reviewDailyReport(selectedReport.id, feedbackNotes || 'Checked. Keep up the high standard of hub assistance!');
    setFeedbackNotes('');
    setSelectedReport(null);
  };

  const handleFetchGpsCoordinates = () => {
    setGpsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsCoords({
            lat: Number(position.coords.latitude.toFixed(4)),
            lng: Number(position.coords.longitude.toFixed(4)),
            address: `Hub Coordinate Match (Lat: ${position.coords.latitude.toFixed(3)}, Lng: ${position.coords.longitude.toFixed(3)})`,
          });
          setGpsLoading(false);
        },
        () => {
          // fallback geolocation mock
          setGpsCoords({
            lat: 40.7306,
            lng: -73.9352,
            address: 'Market Stormer Primary Hub Stall - Brook avenue, NY',
          });
          setGpsLoading(false);
        }
      );
    } else {
      setGpsCoords({
        lat: 40.7306,
        lng: -73.9352,
        address: 'Market Stormer Mocked Outlet Physical Terminal',
      });
      setGpsLoading(false);
    }
  };

  const handleLogVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitVendorId || !visitNotes) return;

    const vendorObj = hubVendors.find(v => v.id === visitVendorId);
    if (!vendorObj) return;

    const finalLat = gpsCoords?.lat || 40.7128;
    const finalLng = gpsCoords?.lng || -74.0060;
    const finalAddr = gpsCoords?.address || 'Standard Hub Physical Verification Location';

    logWeeklyVisit({
      vendorId: visitVendorId,
      vendorName: vendorObj.name,
      supervisorId: currentUser?.id || 'u-2',
      supervisorName: currentUser?.name || 'Sarah Jenkins',
      durationMinutes: Number(visitDuration),
      notes: visitNotes,
      address: finalAddr,
      lat: finalLat,
      lng: finalLng,
    });

    setVisitVendorId('');
    setVisitNotes('');
    setGpsCoords(null);
    setVisitSuccess(`Weekly visit to "${vendorObj.name}" successfully committed.`);
    setTimeout(() => setVisitSuccess(''), 4000);
  };

  const handleResolveComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !aiDraft) return;

    resolveComplaint(selectedComplaint.id, aiDraft);
    setAiDraft('');
    setAiSteps([]);
    setAiTraining('');
    setSelectedComplaint(null);
  };

  const handleGenerateAiResolution = async (complaintId: string) => {
    const comp = complaints.find(c => c.id === complaintId);
    if (!comp) return;

    setAiLoading(true);
    setAiDraft('Connecting securely with Gemini model on Cloud Run server...');
    
    try {
      const data = await generateAiResolutionDraft(comp);
      setAiDraft(data.resolution || 'Resolution details compiled.');
      setAiSteps(data.steps || []);
      setAiTraining(data.recommendedTraining || '');
    } catch {
      setAiDraft('Failed to contact services. Check connection.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleToggleQaStatus = (vendorId: string, productId: string, action: 'approve' | 'flag_action') => {
    const statusVal = action === 'approve' ? 'approved' : 'action_required';
    updateVendorQuality(vendorId, statusVal);

    // If flagging action, we keep audit state, but updates quality status
    if (action === 'flag_action') {
      const { addAudit } = useOnboarding();
      addAudit('QUALITY_FLAG', `Flagged product QA discrepancy inside hub: ${vendorId}`);
    }
  };

  const nudgeVendorByOfficer = (vName: string, officerName: string) => {
    const { addAudit } = useOnboarding();
    addAudit('NUDGE_OFFICER', `Dispatched follow-up alert to ${officerName} to conduct immediate physical audit for inactive merchant "${vName}"`);
    alert(`Follow-up alert sent. ${officerName} has been assigned a high-priority check-in visit for ${vName}.`);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800">
      {/* Supervisor Navigation bar */}
      <header className="bg-white border-b border-brand-100 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3.5">
              <MamiHubLogo size="md" />
              <div className="hidden sm:block h-6 w-px bg-neutral-200" />
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded-sm bg-emerald-50 text-emerald-800 border border-emerald-100 text-[9px] font-bold uppercase tracking-wider">SUPERVISOR</span>
                </div>
                <p className="text-[10px] text-neutral-400 font-mono mt-0.5">HUB COMMAND: {myHub} ({hubVendors.length} active brands)</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                <img
                  src={currentUser?.avatar}
                  alt={currentUser?.name}
                  referrerPolicy="no-referrer"
                  className="w-8.5 h-8.5 rounded-full border border-pink-200 object-cover shadow-inner"
                />
                <div className="hidden sm:block text-right">
                  <h4 className="text-xs font-semibold text-neutral-800 leading-tight">{currentUser?.name}</h4>
                  <p className="text-[10px] text-neutral-400 font-mono">Hub Operations Manager</p>
                </div>
              </div>

              <button 
                onClick={() => setShowSupabaseHub(true)}
                className="px-3 py-1 text-xs font-semibold rounded-lg border border-[#3ecf8e]/30 bg-[#3ecf8e]/10 hover:bg-[#3ecf8e]/20 text-neutral-800 hover:text-black transition-all flex items-center gap-1 shadow-xs"
                id="header-open-supabase-btn-supervisor"
              >
                <CloudLightning className="w-3.5 h-3.5 text-[#3ecf8e] animate-pulse" />
                <span>Supabase Secure Hub</span>
              </button>

              <button 
                onClick={logout}
                className="p-1 px-3 text-xs font-medium text-neutral-500 hover:text-rose-600 border border-neutral-200 hover:border-rose-100 rounded-lg transition-all flex items-center gap-1.5 bg-neutral-50 hover:bg-rose-50/20"
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clock out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content hub */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* City-Level Hub Footprint Overview */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
              <Map className="w-3.5 h-3.5 text-brand-500 animate-pulse" />
              City-Level Hub Command Footprint
            </h2>
            <span className="text-[10px] text-neutral-400 font-mono">
              Aggregating live setups in {myHub}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {supervisorCityStats.map(city => {
              const completeRate = city.vendors > 0 ? Math.round((city.completions / city.vendors) * 100) : 0;
              return (
                <div 
                  key={city.name} 
                  className={`bg-white border text-left p-3.5 rounded-xl transition-all shadow-2xs hover:shadow-xs relative overflow-hidden ${
                    city.vendors > 0 ? 'border-neutral-200/80 bg-white' : 'border-neutral-100 bg-neutral-50/25 opacity-70'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-extrabold text-xs text-neutral-900 truncate">
                      📍 {city.name}
                    </span>
                    {city.hasIssues && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute right-2.5 top-2.5" title="Has pending issues" />
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-neutral-400 font-medium">
                      <span>Merchants:</span>
                      <strong className="text-neutral-700 font-bold">{city.vendors}</strong>
                    </div>
                    <div className="flex justify-between text-[10px] text-neutral-400 font-medium">
                      <span>Avg Onboarding:</span>
                      <strong className={`font-mono text-neutral-700 ${city.vendors > 0 ? 'text-brand-600 font-extrabold' : ''}`}>
                        {city.avgStep}/6
                      </strong>
                    </div>
                  </div>

                  {city.vendors > 0 && (
                    <div className="mt-2.5">
                      <div className="w-full bg-neutral-100 rounded-full h-1 overflow-hidden" title={`${completeRate}% complete`}>
                        <div 
                          className="bg-brand-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${(parseFloat(city.avgStep) / 6) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Indicators / Alerts */}
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {city.hasIssues && (
                      <span className="px-1.5 py-0.5 rounded-xs bg-rose-50 text-[7.5px] font-extrabold text-rose-800 border border-rose-100 uppercase tracking-tight leading-none">
                        Complaints
                      </span>
                    )}
                    {city.hasPendingQa && (
                      <span className="px-1.5 py-0.5 rounded-xs bg-amber-50 text-[7.5px] font-extrabold text-amber-800 border border-amber-100 uppercase tracking-tight leading-none">
                        QA Review
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation row for supervisor functions */}
        <div className="flex border-b border-neutral-200 mb-6 gap-6 overflow-x-auto whitespace-nowrap scrollbar-none pb-0.5">
          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-3 text-sm font-semibold tracking-wide transition-all border-b-2 ${
              activeTab === 'reports' ? 'border-brand-500 text-brand-600 font-bold' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Review Daily Reports ({hubReports.length})
            </div>
          </button>

          <button
            onClick={() => setActiveTab('visits')}
            className={`pb-3 text-sm font-semibold tracking-wide transition-all border-b-2 ${
              activeTab === 'visits' ? 'border-brand-500 text-brand-600 font-bold' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Log Weekly Visit
            </div>
          </button>

          <button
            onClick={() => setActiveTab('complaints')}
            className={`pb-3 text-sm font-semibold tracking-wide transition-all border-b-2 ${
              activeTab === 'complaints' ? 'border-brand-500 text-brand-600 font-bold' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 animate-bounce" />
              Resolve Complaints ({hubComplaints.filter(c => c.status !== 'resolved').length})
            </div>
          </button>

          <button
            onClick={() => setActiveTab('quality')}
            className={`pb-3 text-sm font-semibold tracking-wide transition-all border-b-2 ${
              activeTab === 'quality' ? 'border-brand-500 text-brand-600 font-bold' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Quality Inspection ({pendingQaProducts.length})
            </div>
          </button>

          <button
            onClick={() => setActiveTab('inactive')}
            className={`pb-3 text-sm font-semibold tracking-wide transition-all border-b-2 ${
              activeTab === 'inactive' ? 'border-brand-500 text-brand-600 font-bold' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-500" />
              Inactive Vendors Alarm ({inactiveVendors.length})
            </div>
          </button>

          <button
            onClick={() => setActiveTab('training')}
            className={`pb-3 text-sm font-semibold tracking-wide transition-all border-b-2 ${
              activeTab === 'training' ? 'border-brand-500 text-brand-600 font-bold' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Train Officers ({hubOfficers.length})
            </div>
          </button>

          <button
            onClick={() => { setActiveTab('pdf_exports'); setSelectedPdfVendorId(''); setExportNotification(''); }}
            className={`pb-3 text-sm font-semibold tracking-wide transition-all border-b-2 ${
              activeTab === 'pdf_exports' ? 'border-brand-500 text-brand-600 font-bold' : 'border-transparent text-neutral-400 hover:text-neutral-850'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileDown className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>PDF Export Center</span>
            </div>
          </button>
        </div>

        {/* Content displays */}
        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Reports listing */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
              <div className="p-4 bg-linear-to-r from-neutral-50 to-neutral-100 border-b border-neutral-200">
                <h3 className="font-display font-semibold text-neutral-800">Field Logs Review Queue</h3>
                <p className="text-[11px] text-neutral-500">Submitted daily summaries from {myHub} squad</p>
              </div>

              {hubReports.length === 0 ? (
                <div className="p-8 text-center text-neutral-400">
                  <FileText className="w-12 h-12 stroke-1.25 text-neutral-300 mx-auto mb-2" />
                  <p className="text-xs">No reports submitted by officers in your hub yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 max-h-[500px] overflow-y-auto">
                  {hubReports.map(rep => {
                    const officer = users.find(u => u.id === rep.fieldOfficerId);
                    const isSelected = selectedReport?.id === rep.id;
                    return (
                      <button
                        key={rep.id}
                        onClick={() => setSelectedReport(rep)}
                        className={`w-full text-left p-4 hover:bg-neutral-50/60 transition-all flex items-start gap-4 ${
                          isSelected ? 'bg-brand-50/20 border-l-4 border-brand-500' : ''
                        }`}
                      >
                        <img
                          src={officer?.avatar}
                          alt={rep.fieldOfficerName}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full border border-neutral-200 object-cover shadow-2xs mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-xs leading-none text-neutral-900 truncate">
                              {rep.fieldOfficerName}
                            </h4>
                            <span className="text-[10px] text-neutral-400 font-mono">{rep.date}</span>
                          </div>
                          
                          <p className="text-[11px] text-neutral-500 line-clamp-2 mt-1.5 font-sans leading-relaxed">
                            {rep.summary}
                          </p>

                          <div className="mt-2.5 flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 text-[10px] text-neutral-500 font-semibold bg-neutral-100 border border-neutral-200/60 px-1.5 py-0.5 rounded">
                              Onboarded: {rep.vendorsOnboardedCount} • Steps: {rep.stepsCompletedCount}
                            </span>
                            <span className={`inline-block px-1.5 py-0.5 text-[8px] font-bold rounded-sm tracking-wide border ${
                              rep.status === 'reviewed' 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                                : 'bg-yellow-50 text-yellow-800 border-yellow-100'
                            }`}>
                              {rep.status === 'reviewed' ? 'REVIEWED' : 'PENDING'}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Detailed view & Comment Form */}
            <div className="lg:col-span-7">
              {selectedReport ? (
                <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs">
                  <div className="flex justify-between items-start border-b border-neutral-100 pb-4 mb-4">
                    <div>
                      <h4 className="font-display font-semibold text-neutral-900 text-sm">
                        Shift Activity Logs - {selectedReport.fieldOfficerName}
                      </h4>
                      <p className="text-xs text-neutral-400 mt-1">Date: {selectedReport.date} | Region: {myHub}</p>
                    </div>

                    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                      selectedReport.status === 'reviewed' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-yellow-100 text-yellow-800 animate-pulse'
                    }`}>
                      {selectedReport.status?.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-4 text-xs font-sans">
                    <div className="grid grid-cols-2 gap-4 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                      <div>
                        <span className="block text-[9px] text-neutral-500 uppercase tracking-wide font-bold">New Registrations Logged</span>
                        <span className="text-sm font-bold text-neutral-800">{selectedReport.vendorsOnboardedCount} Merchants</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-neutral-500 uppercase tracking-wide font-bold">Completed checklist points</span>
                        <span className="text-sm font-bold text-neutral-800">{selectedReport.stepsCompletedCount} Milestones</span>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-bold text-neutral-800 uppercase tracking-wider text-[10px] mb-1 text-neutral-600">Activities Description:</h5>
                      <div className="bg-white border rounded-lg p-3.5 leading-relaxed text-slate-700 max-h-[180px] overflow-y-auto">
                        {selectedReport.summary}
                      </div>
                    </div>

                    {selectedReport.challenges && (
                      <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg">
                        <h5 className="font-bold text-rose-950 uppercase tracking-wider text-[10px] mb-1">Field Hurdles Encountered:</h5>
                        <p className="text-rose-800 font-medium leading-relaxed italic">"{selectedReport.challenges}"</p>
                      </div>
                    )}

                    {selectedReport.status === 'reviewed' && selectedReport.supervisorNotes && (
                      <div className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-lg">
                        <h5 className="font-bold text-emerald-900 uppercase tracking-wider text-[10px] mb-1">My Released Review Statement:</h5>
                        <p className="text-emerald-800 mt-1 italic">"{selectedReport.supervisorNotes}"</p>
                      </div>
                    )}

                    {selectedReport.status === 'pending_review' && (
                      <form onSubmit={handleReviewReport} className="pt-4 border-t border-neutral-100 space-y-3.5">
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                            Supervisor Feedback & Directives
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={feedbackNotes}
                            onChange={(e) => setFeedbackNotes(e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-500 focus:bg-white"
                            placeholder="Provide supportive feedback or instructions (e.g., 'Ensure Nest & Nap schedules physical photography help tomorrow! Excellent registrations.')"
                          />
                        </div>

                        <div className="flex justify-end gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setSelectedReport(null)}
                            className="px-4 py-2 border border-neutral-200 text-neutral-500 hover:text-neutral-700 rounded-lg animate-pulse"
                          >
                            Postpone
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Sign-off & Dispatch Feedback
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center bg-white rounded-xl border border-neutral-200">
                  <FileText className="w-16 h-16 stroke-1.25 text-neutral-300 mx-auto mb-3 animate-spin-slow" />
                  <h3 className="font-display font-semibold text-neutral-800">Select a Shift Report</h3>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 leading-relaxed">
                    Choose an active report dispatch item from the left queue to audit work quality, record supervisory feedback, and sign off shift checklists.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'visits' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Log weekly Visit form */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-neutral-200 p-6 shadow-xs">
              <div className="border-b border-neutral-100 pb-3 mb-4">
                <h3 className="font-display font-semibold text-neutral-800 flex items-center gap-1.5">
                  <MapPin className="w-5 h-5 text-brand-500" />
                  Record Physical Vendor Audit
                </h3>
                <p className="text-xs text-neutral-500">Log physical site inspections and milestone verification</p>
              </div>

              {visitSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold">
                  {visitSuccess}
                </div>
              )}

              <form onSubmit={handleLogVisit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                    Target Hub Vendor
                  </label>
                  <select
                    required
                    value={visitVendorId}
                    onChange={(e) => setVisitVendorId(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden"
                  >
                    <option value="">-- Address Hub Vendor --</option>
                    {hubVendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name} (Step {v.onboardingStep}/6)</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wide mb-1.5">
                      Session duration
                    </label>
                    <select
                      value={visitDuration}
                      onChange={(e) => setVisitDuration(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden"
                    >
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="45">45 Minutes</option>
                      <option value="60">1 Hour</option>
                      <option value="90">1.5 Hours</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wide mb-1">
                      GPS Geolocation Mapping
                    </label>
                    <button
                      type="button"
                      onClick={handleFetchGpsCoordinates}
                      disabled={gpsLoading}
                      className="w-full text-xs px-3 py-2.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border border-neutral-200 hover:border-neutral-300 rounded-lg transition-all font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Compass className={`w-3.5 h-3.5 text-neutral-500 ${gpsLoading ? 'animate-spin' : ''}`} />
                      {gpsCoords ? '✓ Match Secured' : 'Lock GPS Location'}
                    </button>
                  </div>
                </div>

                {gpsCoords && (
                  <div className="p-2 bg-neutral-100 rounded-md border border-neutral-200 font-mono text-[10px] text-neutral-500">
                    <p className="font-bold text-neutral-700">GPS MATCH:</p>
                    <p>{gpsCoords.address}</p>
                    <p className="mt-0.5">LAT/LNG: {gpsCoords.lat}, {gpsCoords.lng}</p>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                    Inspection Remarks & Audit Notes
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={visitNotes}
                    onChange={(e) => setVisitNotes(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-500"
                    placeholder="E.g., Inspected packaging inventory, verified organic raw cosmetics certificates, verified nursery equipment compliance..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <MapPin className="w-4 h-4" />
                  Commit Weekly Audit Logs
                </button>
              </form>
            </div>

            {/* Visit logs list */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-neutral-200 p-6 shadow-xs">
              <h3 className="font-display font-semibold text-neutral-800 mb-2">Visits Log Registry</h3>
              <p className="text-xs text-neutral-400 mb-4 font-sans">Verified weekly check-ins made by supervisor squad</p>

              {visits.length === 0 ? (
                <div className="p-8 text-center text-neutral-400">
                  <MapPin className="w-12 h-12 stroke-1.25 text-neutral-300 mx-auto -mt-2 mb-1" />
                  <p className="text-xs">No visit logs on record for this sandbox setup.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {visits.map(visit => (
                    <div key={visit.id} className="p-4 border border-neutral-100 rounded-xl bg-neutral-50/30">
                      <div className="flex justify-between items-start border-b border-dashed border-neutral-100 pb-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-neutral-800 text-xs">{visit.vendorName}</span>
                          <span className="px-1.5 py-0.5 bg-neutral-100 font-mono text-[9px] text-neutral-400 rounded">
                            CHKP_OK
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-neutral-400 font-semibold">{visit.date}</span>
                      </div>

                      <p className="text-xs text-neutral-600 bg-white p-2.5 rounded-sm border border-neutral-100/60 leading-relaxed font-sans shadow-2xs">
                        {visit.notes}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-neutral-500 leading-none">
                        <span className="bg-neutral-100 px-2 py-1 rounded">Duration: <strong>{visit.durationMinutes}m</strong></span>
                        <span className="bg-neutral-100 px-2 py-1 rounded flex items-center gap-0.5 leading-none">
                          <Compass className="w-3 h-3 text-neutral-400" />
                          Lat: <strong>{visit.gpsLocation.lat}</strong>
                        </span>
                        <span className="bg-neutral-100 px-2 py-1 rounded flex items-center gap-0.5 leading-none">
                          Lng: <strong>{visit.gpsLocation.lng}</strong>
                        </span>
                        <span className="bg-neutral-100 px-2 py-1 rounded truncate max-w-[210px]">
                          Address: <strong>{visit.gpsLocation.address}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'complaints' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Complaints list */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
              <div className="p-4 bg-linear-to-r from-neutral-50 to-neutral-100 border-b border-neutral-200">
                <h3 className="font-display font-semibold text-neutral-800">Assigned Customer / Vendor Complaints</h3>
                <p className="text-[11px] text-neutral-500">Escalated merchant hurdles for {myHub}</p>
              </div>

              {hubComplaints.length === 0 ? (
                <div className="p-8 text-center text-neutral-400">
                  <Smile className="w-12 h-12 stroke-1.25 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm font-medium">Clear board! No active vendor complaints.</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 max-h-[500px] overflow-y-auto">
                  {hubComplaints.map(c => {
                    const isSelected = selectedComplaint?.id === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedComplaint(c);
                          setAiDraft('');
                          setAiSteps([]);
                          setAiTraining('');
                        }}
                        className={`w-full text-left p-4 hover:bg-neutral-50/60 transition-all flex items-start gap-4.5 ${
                          isSelected ? 'bg-brand-50/20 border-l-4 border-brand-500' : ''
                        }`}
                      >
                        <div className={`p-2 rounded-lg mt-0.5 ${
                          c.status === 'resolved' 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : c.severity === 'high' 
                              ? 'bg-rose-50 text-rose-600 animate-pulse' 
                              : 'bg-amber-50 text-amber-600'
                        }`}>
                          <AlertOctagon className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">{c.category.replace('_', ' ')}</span>
                            <span className={`text-[8px] font-bold px-1 rounded ${
                              c.severity === 'high' ? 'bg-rose-100 text-rose-700' : c.severity === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {c.severity.toUpperCase()}
                            </span>
                          </div>

                          <h4 className="font-semibold text-xs leading-none text-neutral-900 truncate">
                            {c.title}
                          </h4>
                          <h5 className="text-[10px] text-neutral-500 font-medium truncate mt-1">
                            Vendor: <span className="text-neutral-700">{c.vendorName}</span>
                          </h5>

                          <div className="mt-3 flex justify-between items-center">
                            <span className="text-[9px] font-mono text-neutral-400">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                            <span className={`inline-block px-1.5 py-0.5 text-[8.5px] font-bold rounded-sm border ${
                              c.status === 'resolved' 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                                : 'bg-amber-50 text-amber-800 border-amber-100'
                            }`}>
                              {c.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Complaint Detailed view and Gemini assistant */}
            <div className="lg:col-span-7">
              {selectedComplaint ? (
                <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs space-y-5">
                  <div className="flex justify-between items-start border-b border-neutral-100 pb-4 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                          selectedComplaint.severity === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-neutral-100 text-neutral-500'
                        }`}>
                          {selectedComplaint.severity.toUpperCase()} URGENCY
                        </span>
                        <span className="text-xs text-neutral-400">Raised count: {new Date(selectedComplaint.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-display font-bold text-neutral-900 text-sm mt-1">
                        {selectedComplaint.title}
                      </h4>
                      <p className="text-xs text-neutral-500 mt-0.5">Author merchant: <strong>{selectedComplaint.vendorName}</strong></p>
                    </div>

                    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                      selectedComplaint.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 animate-pulse'
                    }`}>
                      {selectedComplaint.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-4 text-xs font-sans">
                    <div className="bg-neutral-50/50 p-4 border border-neutral-100 rounded-xl leading-relaxed text-slate-700">
                      <p className="font-bold text-neutral-800 text-[10px] uppercase tracking-wider mb-1.5 text-slate-500">Incident report:</p>
                      {selectedComplaint.description}
                    </div>

                    {selectedComplaint.status === 'resolved' ? (
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-2">
                        <h5 className="font-bold text-emerald-950 uppercase tracking-wider text-[10px] flex items-center gap-1">
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                          Resolved audit report:
                        </h5>
                        <p className="text-emerald-800 font-sans leading-relaxed text-xs">
                          {selectedComplaint.resolutionText}
                        </p>
                        <p className="text-[9px] text-emerald-600 mt-1 font-mono">
                          RESOLVED AT: {new Date(selectedComplaint.resolvedAt || '').toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="border border-brand-100 rounded-xl p-4 bg-linear-to-r from-brand-50/20 to-neutral-50">
                          <div className="flex items-center justify-between mb-3.5">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-4.5 h-4.5 text-brand-500" />
                              <span className="font-display font-bold text-neutral-900 text-xs">Gemini Onboarding Resolution Copilot</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleGenerateAiResolution(selectedComplaint.id)}
                              disabled={aiLoading}
                              className="bg-brand-500 hover:bg-brand-600 text-white text-[10px] font-bold p-1 px-3.5 rounded-lg shadow-sm transition-all flex items-center gap-1 disabled:opacity-75"
                            >
                              {aiLoading ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Sparkles className="w-3 h-3" />
                              )}
                              Draft Resolution
                            </button>
                          </div>

                          {aiDraft ? (
                            <div className="space-y-3 mt-2 animate-fade-in">
                              <div className="bg-white p-3 rounded-lg border border-brand-100 shadow-2xs font-sans">
                                <p className="font-bold text-[10px] text-neutral-600 uppercase tracking-wide mb-1">Empathetic Response draft (editable):</p>
                                <textarea
                                  value={aiDraft}
                                  onChange={(e) => setAiDraft(e.target.value)}
                                  rows={5}
                                  className="w-full text-xs font-semibold focus:outline-hidden leading-relaxed text-slate-700 bg-transparent resize-y"
                                />
                              </div>

                              {aiSteps.length > 0 && (
                                <div className="p-3 bg-white rounded-lg border border-neutral-100 font-sans">
                                  <p className="font-bold text-[10px] text-neutral-500 uppercase tracking-wide mb-1">Milestone Action steps:</p>
                                  <ul className="list-decimal list-inside space-y-1 text-slate-600 text-xs font-medium">
                                    {aiSteps.map((step, idx) => (
                                      <li key={idx}>{step}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {aiTraining && (
                                <div className="p-2.5 bg-yellow-50/50 rounded-lg border border-yellow-100 text-[11px] leading-snug font-medium text-amber-800 flex items-start gap-1.5">
                                  <Lightbulb className="w-3.5 h-3.5 mt-0.5 text-amber-600 shrink-0" />
                                  <span>
                                    Recommended Officer Training: <strong>{aiTraining}</strong> (You can check officers progress in <em>Training</em> tab).
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-[11px] text-neutral-500 italic mt-1 leading-normal font-sans">
                              Tap "Draft Resolution" to query Gemini with details from this ticket, automatically forming an empathetic community letter draft, operational roadmaps, and training diagnostics.
                            </p>
                          )}
                        </div>

                        {aiDraft && (
                          <form onSubmit={handleResolveComplaint} className="flex justify-end gap-2 text-xs pt-4 border-t border-neutral-100">
                            <button
                              type="button"
                              onClick={() => {
                                setAiDraft('');
                                setAiSteps([]);
                                setAiTraining('');
                              }}
                              className="px-4 py-2 border border-neutral-200 text-neutral-500 hover:text-neutral-700 rounded-lg"
                            >
                              Discard Draft
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Send Resolution & Close Ticket
                            </button>
                          </form>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center bg-white rounded-xl border border-neutral-200">
                  <ShieldCheck className="w-16 h-16 stroke-1.25 text-neutral-300 mx-auto mb-3" />
                  <h3 className="font-display font-semibold text-neutral-800">Select an Escalated Ticket</h3>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 leading-relaxed">
                    Identify an open vendor complaint ticket on the left panel to execute rapid resolutions, review technical logs, and deploy AI empathy tools.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'quality' && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs">
            <div className="border-b border-slate-100 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-semibold text-neutral-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-5 h-5 text-brand-500" />
                  Quality Assurance Compliance Portal
                </h3>
                <p className="text-xs text-neutral-500">Inspect newborn catalog additions to ensure eco-standards compliance</p>
              </div>

              <input
                type="text"
                placeholder="Search products by title..."
                value={qaSearch}
                onChange={(e) => setQaSearch(e.target.value)}
                className="text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg font-medium focus:bg-white"
              />
            </div>

            {pendingQaProducts.length === 0 ? (
              <div className="p-8 text-center text-neutral-400">
                <Smile className="w-12 h-12 stroke-1.25 text-neutral-300 mx-auto mb-2" />
                <p className="text-xs">No pending newborn listings await review. All catalog channels are clear.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingQaProducts
                  .filter(p => !qaSearch || p.name.toLowerCase().includes(qaSearch.toLowerCase()))
                  .map(prod => (
                    <div key={prod.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col justify-between hover:border-brand-100 transition-all">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[9px] font-bold bg-neutral-100 text-neutral-500 border rounded-sm px-1.5 uppercase font-mono tracking-wider">
                            {prod.vendorName}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400 font-bold">
                            Price: ${prod.price}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-neutral-950">
                          {prod.name}
                        </h4>
                        <p className="text-[10px] text-neutral-500 mt-1 font-semibold">
                          Category: {prod.category}
                        </p>

                        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                          {prod.isOrganicOrFamilyCertified ? (
                            <span className="inline-block px-1.5 py-0.5 rounded-sm text-[8px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-100">
                              ✓ EXCLUSIVE ORGANIC MATCH (toxic-free)
                            </span>
                          ) : (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 text-[8px] font-bold">
                              No organic seal
                            </span>
                          )}

                          <span className={`px-1.5 py-0.5 text-[8px] font-semibold rounded ${
                            prod.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-yellow-50 text-yellow-800 border'
                          }`}>
                            {prod.status === 'rejected' ? 'FAILED PREV_REVIEW' : 'QA AUDIT PENDING'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-neutral-100/60 flex justify-end gap-2 text-xs font-sans">
                        <button
                          onClick={() => handleToggleQaStatus(prod.vendorId, prod.id, 'flag_action')}
                          className="px-3 py-1.5 border border-rose-100 hover:border-rose-300 text-rose-700 hover:bg-rose-50/30 font-semibold rounded-lg transition-all"
                        >
                          Reject Listing
                        </button>
                        <button
                          onClick={() => handleToggleQaStatus(prod.vendorId, prod.id, 'approve')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve Profile Life
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'inactive' && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs">
            <div className="border-b border-neutral-100 pb-3 mb-4">
              <h3 className="font-display font-semibold text-neutral-800 flex items-center gap-1.5">
                <AlertOctagon className="w-5 h-5 text-rose-500 animate-pulse" />
                Inactive Vendors Alarm System
              </h3>
              <p className="text-xs text-neutral-500">Merchants with delayed listings or zero transaction history requiring priority visits</p>
            </div>

            {inactiveVendors.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 bg-neutral-50 rounded-xl">
                <Smile className="w-12 h-12 stroke-1.25 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm font-medium">Clear diagnostics! All merchants in {myHub} are active in setup.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {inactiveVendors.map(v => {
                  const officer = users.find(u => u.id === v.fieldOfficerId);
                  const stepPrc = Math.round((v.onboardingStep / 6) * 100);
                  return (
                    <div key={v.id} className="p-4 border border-rose-100 hover:border-rose-300 bg-rose-50/5 hover:bg-white rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-neutral-900 text-sm">{v.name}</h4>
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 text-[8px] font-bold font-mono uppercase leading-none">
                            Idle: {v.inactiveDays} Days
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">Specialty: <strong>{v.category}</strong> | Step completed: {v.onboardingStep}/6 ({stepPrc}%)</p>
                        <p className="text-[11px] text-neutral-400 mt-0.5">Assigned Officer: <span className="text-neutral-700 font-semibold">{officer?.name || 'Unassigned'}</span></p>
                      </div>

                      <div className="flex gap-2 text-xs">
                        <button
                          onClick={() => nudgeVendorByOfficer(v.name, officer?.name || 'Unassigned')}
                          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-all shadow-xs"
                        >
                          Dispatch Officer Nudge
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'training' && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs max-w-4xl mx-auto">
            <div className="border-b border-neutral-100 pb-3 mb-5">
              <h3 className="font-display font-semibold text-neutral-800">Regional Officers Educational Records</h3>
              <p className="text-xs text-neutral-500">Train field officers under your command and monitor compliance completion rates.</p>
            </div>

            <div className="space-y-6">
              {hubOfficers.map(officer => {
                return (
                  <div key={officer.id} className="p-4 border border-neutral-100 bg-neutral-50/40 rounded-xl">
                    <div className="flex items-center gap-3 border-b border-neutral-100 pb-3 mb-4">
                      <img
                        src={officer.avatar}
                        alt={officer.name}
                        className="w-10 h-10 rounded-full border border-neutral-200 object-cover"
                      />
                      <div>
                        <h4 className="font-semibold text-neutral-950 text-xs leading-none">
                          {officer.name}
                        </h4>
                        <p className="text-[10px] text-neutral-400 mt-1 font-mono">{officer.email} | Hub: {officer.region}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
                      {courses.map(course => {
                        const isCompleted = course.completedByFieldOfficers.includes(officer.id);
                        return (
                          <div key={course.id} className="flex items-center justify-between p-2.5 border border-white rounded-lg bg-white shadow-2xs">
                            <div className="min-w-0 pr-3">
                              <p className="font-semibold text-neutral-800 truncate leading-none">
                                {course.title}
                              </p>
                              <p className="text-[10px] text-neutral-400 font-medium mt-1">🕒 Duration: {course.durationMinutes} minutes</p>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleFieldOfficerTraining(course.id, officer.id)}
                              className={`text-[10px] font-bold px-2 py-1 border rounded-lg transition-colors shrink-0 ${
                                isCompleted 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-neutral-100 hover:text-neutral-600' 
                                  : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-500 border-neutral-200'
                              }`}
                            >
                              {isCompleted ? '✓ Passed' : 'Not Done'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'pdf_exports' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs">
              <div className="border-b border-neutral-100 pb-3 mb-5">
                <span className="text-[10px] bg-brand-50 border border-brand-100 font-bold text-brand-700 px-2.5 py-1 rounded tracking-wider uppercase">
                  📁 Document Generator System
                </span>
                <h3 className="font-display font-black text-neutral-900 text-lg mt-2 uppercase">
                  Market Stormer Weekly Onboarding Reports Compiler
                </h3>
                <p className="text-xs text-neutral-500">
                  Export high-fidelity, printable PDF audit books for corporate stakeholders or on-site hub regulators.
                </p>
              </div>

              {exportNotification && (
                <div className="p-3 bg-emerald-55 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-100 animate-pulse mb-6">
                  {exportNotification}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* REGIONAL LEDGER GENERATION */}
                <div className="p-6 bg-neutral-50/50 border border-neutral-200 rounded-2xl flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-brand-100/30 rounded-bl-full pointer-events-none" />
                  <div>
                    <span className="text-[9px] bg-neutral-100 border border-neutral-200 px-1 py-0.5 rounded font-bold text-neutral-500 font-mono">
                      REPORT SCOPE: REGION
                    </span>
                    <h4 className="text-base font-bold text-neutral-900 mt-2.5">
                      {myHub} Hub Progress Summary
                    </h4>
                    <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                      Compiles complete metadata matrices of all active vendors operating within the <strong>{myHub}</strong> district boundaries.
                    </p>

                    <div className="mt-4 p-3 bg-white border border-neutral-150 rounded-xl space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Total Partners:</span>
                        <span className="font-bold text-slate-800">{hubVendors.length} vendors</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Hub Region:</span>
                        <span className="font-bold text-brand-700">{myHub}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Open Incidents:</span>
                        <span className="font-bold text-rose-600">{hubComplaints.filter(c => c.status !== 'resolved').length} tickets</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-neutral-100">
                    <button
                      onClick={() => {
                        exportRegionWeeklyReport(myHub, hubVendors, complaints, visits);
                        setExportNotification(`✓ Successfully compiled and downloaded Regional Hub Audit Report for: ${myHub}`);
                        setTimeout(() => setExportNotification(''), 4500);
                      }}
                      className="w-full bg-brand-600 hover:bg-brand-750 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <FileDown className="w-4 h-4 animate-bounce" />
                      Generate Regional Progress Book PDF
                    </button>
                  </div>
                </div>

                {/* INDIVIDUAL PARTNER DOSSIER */}
                <div className="p-6 bg-neutral-50/50 border border-neutral-200 rounded-2xl flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-sky-100/30 rounded-bl-full pointer-events-none" />
                  <div>
                    <span className="text-[9px] bg-neutral-100 border border-neutral-200 px-1 py-0.5 rounded font-bold text-neutral-500 font-mono">
                      REPORT SCOPE: INDIVIDUAL MERCHANT
                    </span>
                    <h4 className="text-base font-bold text-neutral-900 mt-2.5">
                      Verify Single Merchant Checklist
                    </h4>
                    <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                      Select any registered trader in your assigned hub district to compile their step-by-step validation status book.
                    </p>

                    <div className="mt-4">
                      <label htmlFor="vendor-pdf-select" className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                        Choose Hub Merchant
                      </label>
                      <select
                        id="vendor-pdf-select"
                        value={selectedPdfVendorId}
                        onChange={(e) => setSelectedPdfVendorId(e.target.value)}
                        className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
                      >
                        <option value="">-- Choose registered partner --</option>
                        {hubVendors.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.name} (Step {v.onboardingStep}/6 completed)
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedPdfVendorId && (() => {
                      const found = hubVendors.find(v => v.id === selectedPdfVendorId);
                      if (!found) return null;
                      return (
                        <div className="mt-4 p-3 bg-white border border-neutral-150 rounded-xl space-y-1.5 text-xs animate-fade-in">
                          <div className="flex justify-between">
                            <span className="text-neutral-400">Owner Name:</span>
                            <span className="font-bold text-slate-800">{found.ownerName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-400">Registered Phone:</span>
                            <span className="font-bold text-slate-800">{found.phone}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-400">Onboarding Stage:</span>
                            <span className="font-bold text-brand-600">Step {found.onboardingStep}/6</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="mt-6 pt-4 border-t border-neutral-100">
                    <button
                      disabled={!selectedPdfVendorId}
                      onClick={() => {
                        const found = hubVendors.find(v => v.id === selectedPdfVendorId);
                        if (found) {
                          exportVendorWeeklyReport(found, complaints, visits);
                          setExportNotification(`✓ Successfully compiled and downloaded Merchant checklist dossier for: ${found.name}`);
                          setTimeout(() => setExportNotification(''), 4500);
                        }
                      }}
                      className="w-full bg-brand-600 hover:bg-brand-750 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FileDown className="w-4 h-4" />
                      Compile Partner Onboarding PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Supabase Integration Hub Model Slider overlay */}
      {showSupabaseHub && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <SupabaseSyncPanel onClose={() => setShowSupabaseHub(false)} />
        </div>
      )}
    </div>
  );
}
