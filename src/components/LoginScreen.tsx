import React, { useState } from 'react';
import { useOnboarding } from '../state';
import { 
  ShieldCheck, 
  UserCircle, 
  Users, 
  Compass, 
  Mail, 
  Lock, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  KeySquare, 
  KeyRound, 
  Globe, 
  Phone, 
  User as UserIcon, 
  Activity 
} from 'lucide-react';
import { DEMO_USERS } from '../initialData';
import MamiHubLogo from './MamiHubLogo';
import { supabase, getSupabaseConfig } from '../lib/supabase';

type PortalRole = 'field_personnel' | 'supervisor' | 'admin';

export default function LoginScreen() {
  const { login } = useOnboarding();
  const [selectedPortal, setSelectedPortal] = useState<PortalRole | null>(null);
  const [activeTab, setActiveTab] = useState<'supabase' | 'demo'>('supabase');
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Standard Auth form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [region, setRegion] = useState('East Region');
  const [phone, setPhone] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Read current Supabase status
  const isSupabaseConfigured = () => {
    const config = getSupabaseConfig();
    return config.enabled && config.url && !config.url.includes('placeholder-project-id');
  };

  const handleSandboxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    
    // Find the user first to make sure they belong to the selected login terminal
    const normalizedEmail = email.trim().toLowerCase();
    const matchedUser = DEMO_USERS.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!matchedUser) {
      setError('No profile detected matching this email in our sandbox registry.');
      return;
    }

    if (matchedUser.role !== selectedPortal) {
      const properPortalName = 
        matchedUser.role === 'admin' ? 'Global Admin Console' : 
        matchedUser.role === 'supervisor' ? 'Hub Supervisor CRM' : 
        'Field Officer Intake Terminal';
      setError(`Access Rejected: This profile carries "${matchedUser.role.replace('_', ' ').toUpperCase()}" authority. Use the ${properPortalName} instead.`);
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      const success = login(email);
      setIsLoading(false);
      if (!success) {
        setError('Login failed. Please retry.');
      } else {
        setError('');
      }
    }, 450);
  };

  const handleSupabaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    if (!isSupabaseConfigured()) {
      setError('Supabase credentials are not configured yet. Please set VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY in your .env file, or use the "Sandbox Bypass" tab.');
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        if (!name) {
          setError('Please provide your full name.');
          setIsLoading(false);
          return;
        }

        const { data, error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              role: selectedPortal,
              region,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
              phone
            }
          }
        });

        if (signUpErr) {
          setError(signUpErr.message);
          return;
        }

        if (data.user) {
          if (data.session) {
            login(email, {
              name,
              role: selectedPortal!,
              region,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`
            });
          } else {
            setSuccessMsg('Account registered successfully! Check your inbox for confirmation details, or sign in below.');
            setIsSignUp(false);
            setPassword('');
          }
        }
      } else {
        // Sign In
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInErr) {
          setError(signInErr.message);
          return;
        }

        if (data.user) {
          const meta = data.user.user_metadata || {};
          const userRole = meta.role || selectedPortal;
          const userName = meta.name || email.split('@')[0];
          const userRegion = meta.region || 'East Region';
          const userAvatar = meta.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`;

          if (userRole !== selectedPortal) {
            const properPortalName = 
              userRole === 'admin' ? 'Global Admin Console' : 
              userRole === 'supervisor' ? 'Hub Supervisor CRM' : 
              'Field Officer Intake Terminal';
            setError(`Access Rejected: This Supabase profile carries "${(userRole || '').replace('_', ' ').toUpperCase()}" authority. Use the ${properPortalName} instead.`);
            await supabase.auth.signOut();
            return;
          }

          login(email, {
            name: userName,
            role: userRole,
            region: userRegion,
            avatar: userAvatar
          });
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Verification or database sync failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setIsLoading(true);
    setTimeout(() => {
      login(demoEmail);
      setIsLoading(false);
    }, 200);
  };

  // Filter demo profiles for the active portal
  const activeDemoUsers = DEMO_USERS.filter(u => u.role === selectedPortal);

  return (
    <div className="min-h-screen bg-linear-to-br from-brand-50 via-neutral-50 to-brand-100 flex items-center justify-center p-4">
      {/* Background visual detail */}
      <div className="absolute inset-0 bg-[radial-gradient(#244F3B_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />
      
      <div className={`w-full transition-all duration-300 ${selectedPortal ? 'max-w-md' : 'max-w-5xl'} bg-white rounded-2xl shadow-xl border border-brand-100 p-8 relative overflow-hidden`}>
        {/* Soft decorative background glow circles */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-brand-100 rounded-full blur-2xl opacity-45 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary-100 rounded-full blur-2xl opacity-60 pointer-events-none" />

        {/* Global Hub Portal Header */}
        <div className="relative text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <MamiHubLogo size={selectedPortal ? 'md' : 'lg'} />
          </div>
          
          <h1 className="font-display text-2xl font-black tracking-tight text-neutral-900 uppercase">
            Onboarding Coordination Command
          </h1>
          <p className="text-xs text-neutral-500 mt-1.5 font-mono max-w-lg mx-auto">
            Decentralized multi-role coordinate orchestration ledger for Nigerian trade clusters
          </p>
        </div>

        {!selectedPortal ? (
          /* PORTAL CHOICE GATEWAY */
          <div className="relative animate-fade-in">
            <div className="text-center mb-8 border-y border-neutral-100 py-3">
              <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest bg-brand-50 px-2 py-1 rounded border border-brand-100">
                ⚡ Gateways Available
              </span>
              <h2 className="text-sm font-semibold text-neutral-700 mt-2">
                Select your secure portal access point below
              </h2>
            </div>             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* FIELD OFFICER CARD */}
              <button 
                onClick={() => { setSelectedPortal('field_personnel'); setEmail(''); setPassword(''); setName(''); setPhone(''); setError(''); setSuccessMsg(''); setActiveTab('supabase'); }}
                className="group p-6 border border-sky-100 hover:border-sky-300 bg-sky-50/5 hover:bg-sky-50/20 rounded-xl transition-all text-left flex flex-col justify-between h-full relative overflow-hidden cursor-pointer"
                id="portal-select-officer"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-sky-100/30 rounded-bl-full pointer-events-none" />
                <div>
                  <div className="p-3 bg-sky-100/70 text-sky-700 rounded-xl w-12 h-12 flex items-center justify-center mb-4 border border-sky-200">
                    <Compass className="w-6 h-6 animate-spin-slow" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 group-hover:text-sky-700 transition-colors">
                    Field Personnel
                  </h3>
                  <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                    Access real-time merchant registries, check intermediate on-site validation gates, and log daily performance sheets.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-sky-100/40 flex items-center justify-between w-full">
                  <span className="text-[10px] text-neutral-400 font-mono">3 Active Officers</span>
                  <span className="text-xs font-semibold text-sky-700 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Enter Terminal <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>

              {/* SUPERVISOR CARD */}
              <button 
                onClick={() => { setSelectedPortal('supervisor'); setEmail(''); setPassword(''); setName(''); setPhone(''); setError(''); setSuccessMsg(''); setActiveTab('supabase'); }}
                className="group p-6 border border-emerald-100 hover:border-emerald-300 bg-emerald-50/5 hover:bg-emerald-50/20 rounded-xl transition-all text-left flex flex-col justify-between h-full relative overflow-hidden cursor-pointer"
                id="portal-select-supervisor"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/30 rounded-bl-full pointer-events-none" />
                <div>
                  <div className="p-3 bg-emerald-100/70 text-emerald-700 rounded-xl w-12 h-12 flex items-center justify-center mb-4 border border-emerald-200">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors">
                    Hub Supervisor
                  </h3>
                  <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                    Inspect city-level commands, evaluate merchant quality standards, draft automated AI resolutions, and sign off on pending QA products.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-emerald-100/40 flex items-center justify-between w-full">
                  <span className="text-[10px] text-neutral-400 font-mono">2 Command Districts</span>
                  <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Access Board <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>

              {/* ADMIN CARD */}
              <button 
                onClick={() => { setSelectedPortal('admin'); setEmail(''); setPassword(''); setName(''); setPhone(''); setError(''); setSuccessMsg(''); setActiveTab('supabase'); }}
                className="group p-6 border border-rose-100 hover:border-rose-300 bg-rose-50/5 hover:bg-rose-50/20 rounded-xl transition-all text-left flex flex-col justify-between h-full relative overflow-hidden cursor-pointer"
                id="portal-select-admin"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-100/30 rounded-bl-full pointer-events-none" />
                <div>
                  <div className="p-3 bg-rose-100/70 text-rose-700 rounded-xl w-12 h-12 flex items-center justify-center mb-4 border border-rose-200">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 group-hover:text-rose-700 transition-colors">
                    Global Admin
                  </h3>
                  <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                    Deploy macro AI-driven strategies, inspect un-redacted activity audit streams, manage field coordinators, and govern global statistics.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-rose-100/40 flex items-center justify-between w-full">
                  <span className="text-[10px] text-neutral-400 font-mono">Command Override</span>
                  <span className="text-xs font-semibold text-rose-700 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Command Console <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE LOGIN PORTAL WITH CUSTOM CARDS AND ROLES */
          <div className="relative animate-fade-in">
            {/* Nav Back Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100">
              <button 
                type="button"
                onClick={() => setSelectedPortal(null)}
                className="flex items-center gap-1 text-xs font-bold text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                id="exit-portal-btn"
              >
                <ArrowLeft className="w-4 h-4" /> Exit Portal Gate
              </button>
              
              <span className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase tracking-widest border ${
                selectedPortal === 'admin' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                selectedPortal === 'supervisor' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                'bg-sky-50 text-sky-700 border-sky-200'
              }`}>
                {selectedPortal === 'field_personnel' ? 'Field personnel' : selectedPortal} SECURE
              </span>
            </div>

            <div className="mb-6 text-center">
              <h2 className="text-lg font-black text-neutral-800">
                {selectedPortal === 'admin' && '🔑 Global Administrative Console'}
                {selectedPortal === 'supervisor' && '🤝 Hub Supervisor Dashboard'}
                {selectedPortal === 'field_personnel' && '🗺️ Field Officer Intake Terminal'}
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Authorized credentials confirmation required
              </p>
            </div>

            {/* Only Supabase Auth is active and enforced */}

            {/* NOTIFICATORS */}
            {error && (
              <div className="text-xs text-rose-500 font-semibold mb-4 leading-relaxed bg-rose-50 p-3 rounded-xl border border-rose-100 flex items-start gap-2 animate-in fade-in duration-150">
                <span>⚠️</span>
                <p className="flex-1">{error}</p>
              </div>
            )}

            {successMsg && (
              <div className="text-xs text-emerald-700 font-semibold mb-4 leading-relaxed bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-start gap-2 animate-in fade-in duration-150">
                <span>✓</span>
                <p className="flex-1">{successMsg}</p>
              </div>
            )}

            {activeTab === 'supabase' ? (
              /* LIVE SUPABASE AUTH SYSTEM */
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                {!isSupabaseConfigured() && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] leading-relaxed text-amber-800 flex gap-1.5 mb-4">
                    <span>⚠️</span>
                    <p className="flex-1">
                      <strong>Supabase is currently unconfigured.</strong> Credentials metadata and secure keys are required. Please provide valid connection variables inside your system settings to initialize authentic database pipelines.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between px-1 mb-1.5">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase">
                    {isSignUp ? 'New Credential Generation' : 'Existing Credential Sign In'}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccessMsg(''); }}
                    className="text-xs font-bold text-brand-600 hover:text-brand-800 underline active:scale-95 transition-all"
                    id="toggle-auth-signup-signin"
                  >
                    {isSignUp ? 'Sign in with existing profile' : 'Deploy new live coordinator profile'}
                  </button>
                </div>

                <form onSubmit={handleSupabaseSubmit} className="space-y-3.5">
                  {isSignUp && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1">
                          Full Coordinator Name
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                            <UserIcon className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-medium transition-all"
                            placeholder="Olumide Benson"
                            id="supabase-signup-name"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1">
                            Trade District
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                              <Globe className="w-4 h-4" />
                            </div>
                            <select
                              value={region}
                              onChange={(e) => setRegion(e.target.value)}
                              className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-xs font-bold transition-all"
                              id="supabase-signup-region"
                            >
                              <option value="East Region">East Region</option>
                              <option value="West Region">West Region</option>
                              <option value="North Region">North Region</option>
                              <option value="South Region">South Region</option>
                              <option value="Lagos Central Hub">Lagos Central Hub</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1">
                            Contact Phone
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                              <Phone className="w-4 h-4" />
                            </div>
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-semibold transition-all"
                              placeholder="+234 803 123 4567"
                              id="supabase-signup-phone"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-medium transition-all"
                        placeholder="coordinator@mamihubs.com"
                        id="supabase-auth-email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1">
                      Live Password Code
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition-all"
                        placeholder="••••••••••••"
                        id="supabase-auth-password"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-75 focus:outline-hidden focus:ring-2 focus:ring-offset-2 ${
                      selectedPortal === 'admin' ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-400' :
                      selectedPortal === 'supervisor' ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-400' :
                      'bg-sky-600 hover:bg-sky-700 focus:ring-sky-400'
                    }`}
                    id="supabase-auth-submit-btn"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {isSignUp ? 'Generate District Profile Credentials' : 'Secure Supabase Auth Decrypt'}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
