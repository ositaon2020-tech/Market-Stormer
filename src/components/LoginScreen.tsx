import React, { useState } from 'react';
import { useOnboarding } from '../state';
import { ShieldCheck, UserCircle, Users, Compass, Mail, Lock, Sparkles, ArrowRight, ArrowLeft, KeySquare } from 'lucide-react';
import { DEMO_USERS } from '../initialData';
import MamiHubLogo from './MamiHubLogo';

type PortalRole = 'field_personnel' | 'supervisor' | 'admin';

export default function LoginScreen() {
  const { login } = useOnboarding();
  const [selectedPortal, setSelectedPortal] = useState<PortalRole | null>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* FIELD OFFICER CARD */}
              <button 
                onClick={() => { setSelectedPortal('field_personnel'); setEmail(''); setError(''); }}
                className="group p-6 border border-sky-100 hover:border-sky-300 bg-sky-50/5 hover:bg-sky-50/20 rounded-xl transition-all text-left flex flex-col justify-between h-full relative overflow-hidden"
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
                onClick={() => { setSelectedPortal('supervisor'); setEmail(''); setError(''); }}
                className="group p-6 border border-emerald-100 hover:border-emerald-300 bg-emerald-50/5 hover:bg-emerald-50/20 rounded-xl transition-all text-left flex flex-col justify-between h-full relative overflow-hidden"
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
                onClick={() => { setSelectedPortal('admin'); setEmail(''); setError(''); }}
                className="group p-6 border border-rose-100 hover:border-rose-300 bg-rose-50/5 hover:bg-rose-50/20 rounded-xl transition-all text-left flex flex-col justify-between h-full relative overflow-hidden"
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
                onClick={() => setSelectedPortal(null)}
                className="flex items-center gap-1 text-xs font-bold text-neutral-400 hover:text-neutral-700 transition-colors"
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
                Authorized sandbox identity confirmation required
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="p_email" className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">
                  Coordinator Identity Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="p_email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-medium transition-all"
                    placeholder={
                      selectedPortal === 'admin' ? 'admin@mamihubs.com' :
                      selectedPortal === 'supervisor' ? 'sarah@mamihubs.com' :
                      'david@mamihubs.com'
                    }
                  />
                </div>
                {error && (
                  <p className="text-xs text-rose-500 font-semibold mt-2.5 leading-relaxed bg-rose-50 p-2 rounded border border-rose-100 flex items-start gap-1 p-2.5">
                    ⚠️ {error}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">
                  Decentralized Sandbox Token
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    disabled
                    value="••••••••••••••"
                    className="w-full pl-9 pr-4 py-2.5 bg-neutral-50/50 border border-neutral-100 rounded-xl text-sm text-neutral-400 select-none cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-neutral-400 mt-1.5 italic">
                  * Passwordless secure sandbox bypass active.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-75 focus:outline-hidden focus:ring-2 focus:ring-offset-2 ${
                  selectedPortal === 'admin' ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-400' :
                  selectedPortal === 'supervisor' ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-400' :
                  'bg-sky-600 hover:bg-sky-700 focus:ring-sky-400'
                }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Decrypt Console Entry
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-neutral-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Authorized Port profiles
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-brand-50 text-[9px] text-brand-700 font-bold border border-brand-100">
                  <Sparkles className="w-3 h-3 animate-pulse" /> Sandbox
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {activeDemoUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleQuickLogin(user.email)}
                    disabled={isLoading}
                    className="w-full text-left flex items-center justify-between p-2.5 rounded-xl border border-neutral-100 hover:border-brand-200 bg-neutral-50/50 hover:bg-white transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-full border border-neutral-200 object-cover"
                      />
                      <div>
                        <h4 className="text-xs font-semibold text-neutral-800 leading-tight group-hover:text-brand-600 transition-colors">
                          {user.name}
                        </h4>
                        <p className="text-[10px] text-neutral-400 font-mono">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-1.5 py-0.5 rounded-xs text-[9px] font-bold text-neutral-500 bg-neutral-100 border border-neutral-200 font-mono">
                        {user.region}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

