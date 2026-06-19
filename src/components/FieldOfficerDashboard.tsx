import React, { useState } from 'react';
import { useOnboarding } from '../state';
import { Vendor, Product, Complaint } from '../types';
import { 
  Building2, Plus, Calendar, BookOpen, ScrollText, CheckSquare, 
  MapPin, Phone, Mail, ShoppingBag, FolderHeart, AlertCircle,
  TrendingUp, Compass, LogOut, Check, ArrowRight, Package, CircleDot, RefreshCw,
  Camera, Image, CloudLightning
} from 'lucide-react';
import MamiHubLogo from './MamiHubLogo';
import SupabaseSyncPanel from './SupabaseSyncPanel';

export default function FieldOfficerDashboard() {
  const { 
    currentUser, 
    vendors, 
    courses, 
    reports, 
    complaints,
    logout, 
    registerVendor, 
    updateVendorChecklist, 
    addVendorProduct, 
    simulateVendorOrder, 
    submitDailyReport,
    toggleFieldOfficerTraining
  } = useOnboarding();

  const [showSupabaseHub, setShowSupabaseHub] = useState(false);
  const [activeTab, setActiveTab] = useState<'vendors' | 'daily_report' | 'training'>('vendors');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  
  // Registration Form State
  const [showRegModal, setShowRegModal] = useState(false);
  const [regName, setRegName] = useState('');
  const [regOwner, setRegOwner] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regHub, setRegHub] = useState('');
  const [regCat, setRegCat] = useState('');
  const [regCity, setRegCity] = useState('');

  // Daily Report State
  const [repOnboarded, setRepOnboarded] = useState(0);
  const [repSteps, setRepSteps] = useState(0);
  const [repSummary, setRepSummary] = useState('');
  const [repChallenges, setRepChallenges] = useState('');
  const [repSuccessMessage, setRepSuccessMessage] = useState('');

  // Product Add State
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCat, setProdCat] = useState('');
  const [prodOrganic, setProdOrganic] = useState(true);

  // Complaint Raise State
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [compTitle, setCompTitle] = useState('');
  const [compDesc, setCompDesc] = useState('');
  const [compCat, setCompCat] = useState<'onboarding_speed' | 'portal_access' | 'product_listing' | 'payouts' | 'unresponsive_officer'>('portal_access');
  const [compSeverity, setCompSeverity] = useState<'low' | 'medium' | 'high'>('medium');

  // Filter vendors managed by this field officer
  const myVendors = vendors.filter(v => v.fieldOfficerId === currentUser?.id);
  const myReports = reports.filter(r => r.fieldOfficerId === currentUser?.id);
  const myCourses = courses; // courses are public, tracking completes

  const handleRegisterVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regOwner || !regCat || !regCity) return;

    const registered = registerVendor({
      name: regName,
      ownerName: regOwner,
      phone: regPhone || '+1 (555) 000-0000',
      email: regEmail || `${regOwner.toLowerCase().replace(/\s+/g, '')}@marketstormermail.com`,
      hubRegion: currentUser?.region || 'Global Hub',
      category: regCat,
      city: regCity,
      fieldOfficerId: currentUser?.id || 'u-4',
    });

    // Reset Form
    setRegName('');
    setRegOwner('');
    setRegPhone('');
    setRegEmail('');
    setRegHub('');
    setRegCat('');
    setRegCity('');
    setShowRegModal(false);
    setSelectedVendor(registered);
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor || !prodName || !prodPrice) return;

    addVendorProduct(selectedVendor.id, {
      name: prodName,
      price: parseFloat(prodPrice),
      category: prodCat || 'Home organic',
      isOrganic: prodOrganic,
    });

    // Reset Form
    setProdName('');
    setProdPrice('');
    setProdCat('');
    setProdOrganic(true);

    // Refresh selected vendor state
    const refreshed = vendors.find(v => v.id === selectedVendor.id);
    if (refreshed) {
      setSelectedVendor(refreshed);
    }
  };

  const handleSimulateOrder = (vendorId: string) => {
    simulateVendorOrder(vendorId);
    // Refresh selected vendor info in UI
    const refreshed = vendors.find(v => v.id === vendorId);
    if (refreshed) {
      setSelectedVendor(refreshed);
    }
  };

  const handleRaiseComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor || !compTitle || !compDesc) return;

    const { addComplaint } = useOnboarding(); // local reference
    addComplaint({
      vendorId: selectedVendor.id,
      vendorName: selectedVendor.name,
      title: compTitle,
      description: compDesc,
      category: compCat,
      severity: compSeverity,
    });

    setCompTitle('');
    setCompDesc('');
    setShowComplaintModal(false);
  };

  const handleChecklistChange = (vendorId: string, key: keyof Vendor['checklist'], currentVal: boolean) => {
    updateVendorChecklist(vendorId, key, !currentVal);
    // Refresh detailed panel
    setTimeout(() => {
      const refreshed = vendors.find(v => v.id === vendorId);
      if (refreshed) {
        setSelectedVendor(refreshed);
      }
    }, 50);
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repSummary) return;

    submitDailyReport({
      fieldOfficerId: currentUser?.id || 'u-4',
      fieldOfficerName: currentUser?.name || 'Default Officer',
      date: new Date().toISOString().split('T')[0],
      vendorsOnboardedCount: Number(repOnboarded),
      stepsCompletedCount: Number(repSteps),
      summary: repSummary,
      challenges: repChallenges,
    });

    setRepOnboarded(0);
    setRepSteps(0);
    setRepSummary('');
    setRepChallenges('');
    setRepSuccessMessage('Log report dispatched to hub supervisor successfully.');
    setTimeout(() => setRepSuccessMessage(''), 4000);
  };

  const stepsList = [
    { key: 'registered' as const, label: 'Vendor Registered', desc: 'Secure legal profile and contact coordinates' },
    { key: 'profileCompleted' as const, label: 'Store Profile Completed', desc: 'Cover, bio description, and banking setup' },
    { key: 'firstProductUploaded' as const, label: 'First Product Approved', desc: 'Sample product listed with compliance tag. Note: vendors must take clear images in a clean background, preferably white, with high-quality cameras.' },
    { key: 'min10ProductsUploaded' as const, label: '10+ Live Products', desc: 'Broad catalogue uploaded. Note: ensure vendors take clear images in a clean background, preferably white, with very good cameras.' },
    { key: 'firstOrderReceived' as const, label: 'First Hub Order Logged', desc: 'Initial marketplace transaction completed' },
    { key: 'firstOrderFulfilled' as const, label: 'First Package Dispatched', desc: 'Eco wrapping, packing, and courier delivery' },
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800">
      {/* Officer Header Portal */}
      <header className="bg-white border-b border-brand-100 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3.5">
              <MamiHubLogo size="md" />
              <div className="hidden sm:block h-6 w-px bg-neutral-200" />
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded-sm bg-sky-50 text-sky-800 border border-sky-100 text-[9px] font-bold uppercase tracking-wider">OFFICER</span>
                </div>
                <p className="text-[10px] text-neutral-400 font-mono mt-0.5">HUB: {currentUser?.region}</p>
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
                  <p className="text-[10px] text-neutral-400 font-mono">Assigned Partner</p>
                </div>
              </div>



              <button 
                onClick={logout}
                className="p-1 px-3 text-xs font-medium text-neutral-500 hover:text-rose-600 border border-neutral-200 hover:border-rose-100 rounded-lg transition-all flex items-center gap-1.5 bg-neutral-50 hover:bg-rose-50/20"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-200 mb-6 gap-6">
          <button
            onClick={() => { setActiveTab('vendors'); setSelectedVendor(null); }}
            className={`pb-3 text-sm font-semibold tracking-wide transition-all border-b-2 ${
              activeTab === 'vendors' ? 'border-brand-500 text-brand-600 font-bold' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              My Assigned Hub Vendors ({myVendors.length})
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('daily_report')}
            className={`pb-3 text-sm font-semibold tracking-wide transition-all border-b-2 ${
              activeTab === 'daily_report' ? 'border-brand-500 text-brand-600 font-bold' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <ScrollText className="w-4 h-4" />
              Daily Log Dispatch
            </div>
          </button>

          <button
            onClick={() => setActiveTab('training')}
            className={`pb-3 text-sm font-semibold tracking-wide transition-all border-b-2 ${
              activeTab === 'training' ? 'border-brand-500 text-brand-600 font-bold' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Empathy & Compliance Training
            </div>
          </button>
        </div>

        {/* Content Body */}
        {activeTab === 'vendors' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Vendors List Section */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
              <div className="p-4 bg-linear-to-r from-neutral-50 to-neutral-100 border-b border-neutral-200 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-semibold text-neutral-800">Market Stormer Merchants</h3>
                  <p className="text-[11px] text-neutral-500">Pipeline coordination index</p>
                </div>
                <button
                  onClick={() => setShowRegModal(true)}
                  className="bg-brand-500 hover:bg-brand-600 text-white p-1 px-3 text-xs font-semibold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 focus:outline-hidden focus:ring-2 focus:ring-brand-400"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Vendor
                </button>
              </div>

              {myVendors.length === 0 ? (
                <div className="p-8 text-center text-neutral-400">
                  <FolderHeart className="w-12 h-12 stroke-1.25 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm font-medium">No vendors registered yet under your account.</p>
                  <p className="text-xs text-neutral-400 mt-1">Register a marketplace merchant to begin checklists.</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 max-h-[580px] overflow-y-auto">
                  {myVendors.map((vendor) => {
                    const progressPrc = Math.round((vendor.onboardingStep / 6) * 100);
                    const isSelected = selectedVendor?.id === vendor.id;
                    return (
                      <button
                        key={vendor.id}
                        onClick={() => setSelectedVendor(vendor)}
                        className={`w-full text-left p-4 hover:bg-brand-50/10 transition-all flex items-start gap-3.5 ${
                          isSelected ? 'bg-brand-50/30 border-l-4 border-brand-500' : ''
                        }`}
                      >
                        <div className="p-2.5 bg-neutral-100 text-neutral-600 rounded-lg group-hover:bg-white border border-neutral-200">
                          <Building2 className="w-4 h-4 text-neutral-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-xs leading-none text-neutral-900 truncate">
                              {vendor.name}
                            </h4>
                            <span className="text-[10px] font-mono text-neutral-400">
                              Step {vendor.onboardingStep}/6
                            </span>
                          </div>
                          
                          <p className="text-[11px] font-sans text-neutral-500 truncate mt-1">
                            Owner: <span className="font-medium text-neutral-700">{vendor.ownerName}</span>
                          </p>

                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                  vendor.onboardingStep === 6 ? 'bg-emerald-500' : 'bg-brand-500'
                                }`}
                                style={{ width: `${progressPrc}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-neutral-500 font-mono">
                              {progressPrc}%
                            </span>
                          </div>

                          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                            <span className="inline-block px-1.5 py-0.5 rounded-sm text-[8px] font-extrabold bg-neutral-100 text-neutral-600 border border-neutral-200 tracking-wide">
                              {vendor.category}
                            </span>
                            <span className="inline-block px-1.5 py-0.5 rounded-sm text-[8px] font-extrabold bg-brand-50 text-brand-700 border border-brand-100 tracking-wide">
                              📍 {vendor.city || 'Lagos'}
                            </span>
                            {vendor.qualityStatus === 'approved' ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm text-[8px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-100">
                                <Check className="w-2.5 h-2.5" /> Q_AUDIT PASSED
                              </span>
                            ) : vendor.qualityStatus === 'action_required' ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm text-[8px] font-extrabold bg-amber-50 text-amber-800 border border-amber-100">
                                <AlertCircle className="w-2.5 h-2.5" /> ACTION_REQ
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm text-[8px] font-extrabold bg-slate-50 text-slate-500 border border-slate-100">
                                Q_PENDING
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Vendor Details & Checklist Progression */}
            <div className="lg:col-span-7 space-y-6">
              {selectedVendor ? (
                <>
                  {/* General vendor Info Card */}
                  <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-display font-bold text-lg text-neutral-900 leading-tight">
                            {selectedVendor.name}
                          </h2>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-brand-100 text-brand-800 border border-brand-200 font-mono uppercase">
                            ID: {selectedVendor.id}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-1">Registered: {selectedVendor.registeredDate}</p>
                      </div>

                      <div className="flex gap-2.5">
                        <button
                          onClick={() => handleSimulateOrder(selectedVendor.id)}
                          className="bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-100 hover:border-sky-300 p-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                          title="Trigger a test checkout which checks off the order receipt and dispatch checkpoints immediately."
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-sky-600" />
                          Simulate Order Checkout
                        </button>

                        <button
                          onClick={() => setShowComplaintModal(true)}
                          className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100 hover:border-rose-300 p-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          Log Issue
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-neutral-600">
                          <Phone className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Phone: <strong>{selectedVendor.phone}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-neutral-600">
                          <Mail className="w-3.5 h-3.5 text-neutral-400" />
                          <span className="truncate">Email: <strong>{selectedVendor.email}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-neutral-600">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Hub: <strong>{selectedVendor.hubRegion}</strong> | City: <strong>{selectedVendor.city || 'Lagos'}</strong></span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-neutral-600">
                          <Package className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Catalog Count: <strong>{selectedVendor.products.length} Products listed</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-neutral-600">
                          <ShoppingBag className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Orders Sim: <strong>{selectedVendor.ordersCount} successfully completed</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-neutral-600">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Last Supervisor Visit: <strong>{selectedVendor.lastVisitDate || 'No record yet'}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Checklist pipeline controls */}
                  <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-3">
                      <div>
                        <h4 className="font-display font-semibold text-sm text-neutral-900">Onboarding Checklist Milestones</h4>
                        <p className="text-[11px] text-neutral-500">Toggle or trigger checkpoints sequentially to complete validation</p>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-xs font-bold font-mono border border-emerald-100 rounded">
                        Onboarding Step {selectedVendor.onboardingStep} / 6
                      </span>
                    </div>

                    <div className="space-y-3">
                      {stepsList.map((step, idx) => {
                        const currentStepNo = idx + 1;
                        const isChecked = selectedVendor.checklist[step.key];
                        const isPast = selectedVendor.onboardingStep >= currentStepNo;
                        const isActive = selectedVendor.onboardingStep === currentStepNo - 1;

                        return (
                          <div 
                            key={step.key}
                            className={`p-3.5 rounded-xl border transition-all flex items-start gap-4 ${
                              isChecked 
                                ? 'bg-emerald-50/20 border-emerald-100' 
                                : isActive 
                                  ? 'bg-brand-50/5 border-brand-200 shadow-sm' 
                                  : 'bg-neutral-50/30 border-neutral-100 opacity-65'
                            }`}
                          >
                            <label className="flex items-center h-5 mt-0.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleChecklistChange(selectedVendor.id, step.key, isChecked)}
                                className="w-4.5 h-4.5 text-brand-600 bg-neutral-100 border-neutral-300 rounded-sm focus:ring-brand-500 accent-brand-500"
                              />
                            </label>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold font-mono text-neutral-400">
                                  CHKP_{currentStepNo}
                                </span>
                                <h5 className={`text-xs font-bold tracking-tight leading-none ${
                                  isChecked ? 'text-emerald-950 font-semibold line-through opacity-80' : 'text-neutral-800'
                                }`}>
                                  {step.label}
                                </h5>
                              </div>
                              <p className="text-[11px] text-neutral-500 mt-1 font-sans">
                                {step.desc}
                              </p>
                            </div>

                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
                              isChecked 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : isActive 
                                  ? 'bg-brand-100 text-brand-800 animate-pulse' 
                                  : 'bg-neutral-100 text-neutral-400'
                            }`}>
                              {isChecked ? 'Passed' : isActive ? 'Active Now' : 'Pending'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add Product Section for dynamic checklist trigger support */}
                  <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs">
                    <div className="border-b border-neutral-100 pb-3 mb-4">
                      <h4 className="font-display font-semibold text-sm text-neutral-900 flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-brand-500" />
                        Upload Product Profile (Market Stormer Compliance Check)
                      </h4>
                      <p className="text-[11px] text-neutral-500">
                        Listing products automatically satisfies <em>CHKP_3</em> (First product) and <em>CHKP_4</em> (Min 10 products: listed total: {selectedVendor.products.length})
                      </p>
                    </div>

                    {/* Product Quality and Photography Compliance Guidelines Banner */}
                    <div className="mb-5 p-3.5 bg-brand-50/40 border border-brand-100 rounded-xl flex items-start gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-2xs text-brand-600 shrink-0">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-neutral-805 uppercase tracking-wide flex items-center gap-1.5">
                          📸 Product Photography Guidelines
                        </h5>
                        <p className="text-[11px] text-neutral-600 leading-relaxed">
                          Field personnel must instruct vendors to take <strong>clear images</strong> in a <strong>clean background, preferably white</strong>, with <strong>very good cameras</strong>. Bright, high-resolution images are required for professional verification.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-semibold text-neutral-600 uppercase tracking-wider mb-1">
                          Product Name
                        </label>
                        <input
                          type="text"
                          required
                          value={prodName}
                          onChange={(e) => setProdName(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-500 focus:bg-white transition-all"
                          placeholder="Teething teething rusks"
                        />
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-neutral-600 uppercase tracking-wider mb-1">
                          Price ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={prodPrice}
                          onChange={(e) => setProdPrice(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-500 focus:bg-white transition-all"
                          placeholder="8.99"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-semibold text-neutral-600 uppercase tracking-wider mb-1">
                          Category
                        </label>
                        <input
                          type="text"
                          value={prodCat}
                          onChange={(e) => setProdCat(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-500 focus:bg-white transition-all"
                          placeholder="Cosmetics / Baby food"
                        />
                      </div>

                      <div className="sm:col-span-3 flex flex-col items-start space-y-2">
                        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-neutral-600">
                          <input
                            type="checkbox"
                            checked={prodOrganic}
                            onChange={(e) => setProdOrganic(e.target.checked)}
                            className="w-3.5 h-3.5 accent-brand-500 rounded"
                          />
                          Organic / Family Safe
                        </label>
                        
                        <button
                          type="submit"
                          className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs py-2 rounded-lg transition-all shadow-sm flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          List Product
                        </button>
                      </div>
                    </form>

                    {/* Display products dynamically under supervision */}
                    {selectedVendor.products.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-neutral-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">
                            Uploaded Catalog
                          </span>
                          <span className="text-[10px] font-mono text-neutral-500 font-semibold bg-neutral-100 px-1.5 py-0.5 rounded">
                            {selectedVendor.products.length} Products
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[140px] overflow-y-auto">
                          {selectedVendor.products.map(p => {
                            let badgeStyle = "bg-yellow-50 text-yellow-700 border-yellow-100";
                            let statusText = "AUDIT PENDING";
                            
                            if (p.status === 'approved') {
                              badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-100";
                              statusText = "LIVE";
                            } else if (p.status === 'rejected') {
                              badgeStyle = "bg-rose-50 text-rose-700 border-rose-100";
                              statusText = "REJECTED";
                            }

                            return (
                              <div key={p.id} className="p-2 border border-neutral-100 rounded-lg flex items-center justify-between bg-neutral-50/50">
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-neutral-800 truncate leading-none">
                                    {p.name}
                                  </p>
                                  <p className="text-[10px] font-mono text-neutral-500 mt-0.5">
                                    ${p.price} • {p.category}
                                  </p>
                                </div>
                                <div className="text-right flex flex-col items-end gap-0.5">
                                  {p.isOrganicOrFamilyCertified && (
                                    <span className="text-[8px] bg-emerald-100 text-emerald-950 font-bold px-1 rounded-sm leading-tight">
                                      ORGANIC
                                    </span>
                                  )}
                                  <span className={`text-[8px] font-semibold border px-1 rounded-sm ${badgeStyle}`}>
                                    {statusText}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-12 text-center bg-white rounded-xl border border-neutral-200">
                  <Compass className="w-16 h-16 stroke-1.25 text-neutral-300 mx-auto mb-3 animate-spin-slow" />
                  <h3 className="font-display font-semibold text-neutral-800">Select an Assigned Hub Vendor</h3>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 leading-relaxed">
                    Choose a micro-merchant on the left panel to update physical milestones, upload compliant catalogs, or simulate first hub checkouts.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'daily_report' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 bg-white rounded-xl border border-neutral-200 p-6 shadow-xs">
              <div className="border-b border-neutral-100 pb-3 mb-4">
                <h3 className="font-display font-semibold text-neutral-800 flex items-center gap-2">
                  <ScrollText className="w-5 h-5 text-brand-500" />
                  Submit Daily Onboarding Report
                </h3>
                <p className="text-xs text-neutral-500">Provide logs for supervisor review of your field shifts</p>
              </div>

              {repSuccessMessage && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold">
                  {repSuccessMessage}
                </div>
              )}

              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                      New Registered Vendors
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={repOnboarded}
                      onChange={(e) => setRepOnboarded(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-500 transition-all font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                      Checklist Steps Upgraded
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={repSteps}
                      onChange={(e) => setRepSteps(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-500 transition-all font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                    Shift Activities Summary
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={repSummary}
                    onChange={(e) => setRepSummary(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-500 transition-all"
                    placeholder="E.g., Met with Clara for catalog compliance checks, walked Nest & Nap through bank coordination setup..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                    Log Challenges & Feedback (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={repChallenges}
                    onChange={(e) => setRepChallenges(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-500 transition-all"
                    placeholder="E.g., Merchant was away, bad network alignment, lacking photography tools..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs py-2.5 rounded-lg shadow-md shadow-brand-500/10 hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <ScrollText className="w-4 h-4" />
                  Submit Log Report
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white rounded-xl border border-neutral-200 p-6 shadow-xs">
              <h3 className="font-display font-semibold text-neutral-800 mb-2">Daily Log History</h3>
              <p className="text-xs text-neutral-400 mb-4">Historical dispatches submitted to supervisor Sarah Jenkins</p>

              {myReports.length === 0 ? (
                <div className="p-8 text-center text-neutral-400">
                  <CheckSquare className="w-12 h-12 stroke-1.25 text-neutral-300 mx-auto -mt-2 mb-1" />
                  <p className="text-xs">No daily report records dispatched for this sandbox period.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myReports.map(rep => (
                    <div key={rep.id} className="p-4 border border-neutral-100 rounded-xl bg-neutral-50/40">
                      <div className="flex justify-between items-start border-b border-dashed border-neutral-100 pb-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-neutral-100 text-[10px] font-bold text-neutral-500 rounded border font-mono">
                            ID: {rep.id.substring(0, 8)}
                          </span>
                          <span className="text-xs font-semibold text-neutral-700">{rep.date}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          rep.status === 'reviewed' 
                            ? 'bg-emerald-50 text-emerald-800' 
                            : 'bg-yellow-50 text-yellow-800 border border-yellow-100'
                        }`}>
                          {rep.status === 'reviewed' ? 'REVIEWED' : 'PENDING REVIEW'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                        <div>Vendors Registered today: <strong>{rep.vendorsOnboardedCount}</strong></div>
                        <div>Step upgrades completed: <strong>{rep.stepsCompletedCount}</strong></div>
                      </div>

                      <p className="text-xs text-neutral-600 line-clamp-3 bg-white p-2 rounded-sm border border-neutral-100 leading-relaxed font-sans shadow-2xs">
                        {rep.summary}
                      </p>

                      {rep.challenges && (
                        <p className="text-[11px] text-rose-600 font-semibold italic mt-2">
                          Challenge: {rep.challenges}
                        </p>
                      )}

                      {rep.supervisorNotes && (
                        <div className="mt-3 p-2.5 bg-sky-50 border border-sky-100 rounded-lg text-xs">
                          <p className="font-bold text-sky-950">Sarah Jenkins Feedback:</p>
                          <p className="text-sky-800 italic mt-0.5">"{rep.supervisorNotes}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'training' && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs max-w-4xl mx-auto">
            <div className="border-b border-neutral-100 pb-3 mb-4 flex justify-between items-center">
              <div>
                <h3 className="font-display font-semibold text-neutral-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-brand-500" />
                  Market Stormer Officer Curriculum
                </h3>
                <p className="text-xs text-neutral-500">Ensure high-touch care standards and compliance thresholds</p>
              </div>
              <span className="bg-brand-50 text-brand-700 text-xs font-bold border border-brand-100 px-2.5 py-0.5 rounded-full">
                Officer: {currentUser?.name}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myCourses.map(course => {
                const isCompleted = course.completedByFieldOfficers.includes(currentUser?.id || '');
                return (
                  <div 
                    key={course.id} 
                    className={`p-4 border rounded-xl flex flex-col justify-between transition-all ${
                      isCompleted 
                        ? 'bg-emerald-50/15 border-emerald-200 shadow-2xs' 
                        : 'bg-neutral-50/40 border-neutral-100 hover:border-brand-200'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-extrabold bg-neutral-100 text-neutral-500 border rounded-sm px-1.5 uppercase font-mono tracking-wider">
                          {course.category}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400 font-bold">
                          {course.durationMinutes} min
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-neutral-900 leading-snug">
                        {course.title}
                      </h4>
                      <p className="text-[11px] text-neutral-500 mt-2 leading-relaxed font-sans">
                        {course.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-neutral-100/60 flex items-center justify-between">
                      <span className={`text-[10px] font-bold ${
                        isCompleted ? 'text-emerald-700' : 'text-slate-400'
                      }`}>
                        {isCompleted ? '✓ Training Finished' : 'Pending Enrollment'}
                      </span>
                      
                      <button
                        onClick={() => toggleFieldOfficerTraining(course.id, currentUser?.id || '')}
                        className={`text-xs font-semibold p-1 px-3 rounded-lg transition-all ${
                          isCompleted 
                            ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border border-neutral-200' 
                            : 'bg-brand-500 hover:bg-brand-600 text-white shadow-xs'
                        }`}
                      >
                        {isCompleted ? 'Mark Reset' : 'Enroll Complete'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Register Vendor Slide-over Modal */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-xl shadow-xl border border-neutral-200 max-w-md w-full p-6 animate-zoom-in relative">
            <div className="border-b border-neutral-100 pb-3 mb-4">
              <h3 className="font-display font-semibold text-neutral-900 text-base flex items-center gap-1.5">
                <Building2 className="w-5 h-5 text-brand-500" />
                Register Market Stormer Vendor
              </h3>
              <p className="text-xs text-neutral-500">Initiates <em>CHKP_1</em> onboarding milestone under your account</p>
            </div>

            <form onSubmit={handleRegisterVendor} className="space-y-3.5 text-xs font-sans">
              <div>
                <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                  Vendor / Brand Name
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-500 focus:bg-white transition-all font-medium"
                  placeholder="Organic Cotton Clothing"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                  Owner / Representative Full Name
                </label>
                <input
                  type="text"
                  required
                  value={regOwner}
                  onChange={(e) => setRegOwner(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-500 focus:bg-white transition-all font-medium"
                  placeholder="Martha Sterling"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="phone"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-500 focus:bg-white transition-all"
                    placeholder="+1 (555) 0192"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                    Contact Email Address
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-500 focus:bg-white transition-all"
                    placeholder="martha@sterling.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                  Product / Specialty Category
                </label>
                <select
                  required
                  value={regCat}
                  onChange={(e) => setRegCat(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-500 focus:bg-white transition-all font-semibold text-xs leading-none"
                >
                  <option value="">-- Choose Category --</option>
                  <option value="Fashion stores">Fashion stores</option>
                  <option value="Phone and electronics sellers">Phone and electronics sellers</option>
                  <option value="Supermarkets">Supermarkets</option>
                  <option value="Cosmetics stores">Cosmetics stores</option>
                  <option value="Furniture dealers">Furniture dealers</option>
                  <option value="Building materials suppliers">Building materials suppliers</option>
                  <option value="Pharmacies">Pharmacies</option>
                  <option value="Wholesalers">Wholesalers</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                  City Location
                </label>
                <select
                  required
                  value={regCity}
                  onChange={(e) => setRegCity(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-500 focus:bg-white transition-all font-semibold text-xs leading-none"
                >
                  <option value="">-- Choose City --</option>
                  <option value="Lagos">Lagos</option>
                  <option value="Abuja">Abuja</option>
                  <option value="Port Harcourt">Port Harcourt</option>
                  <option value="Enugu">Enugu</option>
                  <option value="Aba">Aba</option>
                  <option value="Onitsha">Onitsha</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-500 hover:text-neutral-700 bg-neutral-50 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Register Sandbox Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Raise Complaint Modal */}
      {showComplaintModal && selectedVendor && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-xl shadow-xl border border-neutral-200 max-w-md w-full p-6 animate-zoom-in relative">
            <div className="border-b border-neutral-100 pb-3 mb-4">
              <h3 className="font-display font-semibold text-neutral-900 text-sm flex items-center gap-1.5">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                Log Marketplace Bug / Issue
              </h3>
              <p className="text-xs text-neutral-500">Flags concern for Supervisor <strong>Sarah Jenkins</strong> attention</p>
            </div>

            <form onSubmit={handleRaiseComplaint} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                  Vendor Source
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedVendor.name}
                  className="w-full px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                  Issue Title / Subject
                </label>
                <input
                  type="text"
                  required
                  value={compTitle}
                  onChange={(e) => setCompTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-500 focus:bg-white transition-all font-semibold"
                  placeholder="E.g., Bank validation delay, product image compression error"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                    Problem Category
                  </label>
                  <select
                    value={compCat}
                    onChange={(e) => setCompCat(e.target.value as any)}
                    className="w-full px-3 py-2 bg-neutral-100 border border-neutral-100 rounded-lg text-xs"
                  >
                    <option value="onboarding_speed">Onboarding Speed</option>
                    <option value="portal_access">Portal Access</option>
                    <option value="product_listing">Product Listing</option>
                    <option value="payouts">Payout coordination</option>
                    <option value="unresponsive_officer">Validation Delay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                    Urgency Rating
                  </label>
                  <select
                    value={compSeverity}
                    onChange={(e) => setCompSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 bg-neutral-100 border border-neutral-100 rounded-lg text-xs"
                  >
                    <option value="low">Low - Standard queue</option>
                    <option value="medium">Medium - Resolve in 48h</option>
                    <option value="high">High - supervisor override req</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                  Friction Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={compDesc}
                  onChange={(e) => setCompDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-500 focus:bg-white transition-all"
                  placeholder="Provide precise details of what is blocking the onboarding sequence..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowComplaintModal(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-500 hover:text-neutral-700 bg-neutral-50 rounded-lg transition-all"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-1.5"
                >
                  <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
                  Raise Incident Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supabase Integration Hub Model Slider overlay */}
      {showSupabaseHub && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <SupabaseSyncPanel onClose={() => setShowSupabaseHub(false)} />
        </div>
      )}
    </div>
  );
}
