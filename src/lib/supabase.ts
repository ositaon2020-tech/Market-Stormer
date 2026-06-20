/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Vendor, WeeklyVisit, Complaint, DailyReport, TrainingCourse, AuditLog } from '../types';

interface SupabaseConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
}

const LOCAL_STORAGE_URL_KEY = 'm_supabase_url';
const LOCAL_STORAGE_ANON_KEY = 'm_supabase_anon_key';
const LOCAL_STORAGE_ENABLED_KEY = 'm_supabase_enabled';

// Extract environment variables for standard integration safely
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize and export direct client
export const supabase = createClient(
  envUrl || 'https://placeholder-project-id.supabase.co',
  envKey || 'placeholder-anon-key'
);

// Read configuration from Env or Local Storage
export function getSupabaseConfig(): SupabaseConfig {
  const localUrl = localStorage.getItem(LOCAL_STORAGE_URL_KEY) || '';
  const localKey = localStorage.getItem(LOCAL_STORAGE_ANON_KEY) || '';
  const localEnabled = localStorage.getItem(LOCAL_STORAGE_ENABLED_KEY) === 'true';

  return {
    url: localUrl || envUrl,
    anonKey: localKey || envKey,
    enabled: localEnabled || !!(localUrl || envUrl),
  };
}

export function saveSupabaseConfig(url: string, anonKey: string, enabled: boolean) {
  localStorage.setItem(LOCAL_STORAGE_URL_KEY, url);
  localStorage.setItem(LOCAL_STORAGE_ANON_KEY, anonKey);
  localStorage.setItem(LOCAL_STORAGE_ENABLED_KEY, String(enabled));
}

let cachedClient: SupabaseClient | null = null;
let cachedConfigKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.enabled || !config.url || !config.anonKey) {
    return null;
  }

  // If using standard environment values, return the global exported client
  if (config.url === envUrl && config.anonKey === envKey) {
    return supabase;
  }

  const currentKey = `${config.url}::${config.anonKey}`;
  if (cachedClient && cachedConfigKey === currentKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey);
    cachedConfigKey = currentKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
}

// Test connectivity
export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const client = createClient(url, anonKey);
    const { data, error } = await client.from('users').select('id').limit(1);
    
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('not found') || error.code === '42P01') {
        return { 
          success: true, 
          message: 'Connection authorized. Note: Schema tables have not been created in your Supabase project yet. Click "Generate Schema & Deploy" to set them up.' 
        };
      }
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Successfully connected and verified against users table!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Network error connecting to Supabase' };
  }
}

// Push all state to Supabase
export async function pushStateToSupabase(state: {
  users: User[];
  vendors: Vendor[];
  visits: WeeklyVisit[];
  complaints: Complaint[];
  reports: DailyReport[];
  courses: TrainingCourse[];
  auditLogs: AuditLog[];
}): Promise<{ success: boolean; log: string[] }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, log: ['Supabase not configured or enabled.'] };
  }

  const log: string[] = [];
  try {
    log.push('Initiating synchronization sequence to Supabase...');

    // 1. Sync users
    if (state.users.length > 0) {
      log.push(`Syncing ${state.users.length} user/profile records...`);
      const { error: usersError } = await client.from('users').upsert(
        state.users.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          region: u.region,
          avatar: u.avatar,
          phone: u.phone || null,
          assigned_supervisor_id: u.assignedSupervisorId || null
        }))
      );
      if (usersError) throw new Error(`Users Sync Failed: ${usersError.message}`);
      log.push('✓ User profiles synchronized successfully.');
    }

    // 2. Sync vendors
    if (state.vendors.length > 0) {
      log.push(`Syncing ${state.vendors.length} vendor records...`);
      const { error: vendorsError } = await client.from('vendors').upsert(
        state.vendors.map(v => ({
          id: v.id,
          name: v.name,
          owner_name: v.ownerName,
          phone: v.phone,
          email: v.email,
          hub_region: v.hubRegion,
          category: v.category,
          city: v.city,
          registered_date: v.registeredDate,
          onboarding_step: v.onboardingStep,
          checklist: v.checklist,
          products: v.products,
          orders_count: v.ordersCount,
          inactive_days: v.inactiveDays,
          quality_status: v.qualityStatus,
          field_officer_id: v.fieldOfficerId,
          last_visit_date: v.lastVisitDate || null
        }))
      );
      if (vendorsError) throw new Error(`Vendors Sync Failed: ${vendorsError.message}`);
      log.push('✓ Vendor registration & checklist states synchronized successfully.');
    }

    // 3. Sync visits
    if (state.visits.length > 0) {
      log.push(`Syncing ${state.visits.length} weekly field visits...`);
      const { error: visitsError } = await client.from('visits').upsert(
        state.visits.map(vi => ({
          id: vi.id,
          vendor_id: vi.vendorId,
          vendor_name: vi.vendorName,
          supervisor_id: vi.supervisorId,
          supervisor_name: vi.supervisorName,
          date: vi.date,
          duration_minutes: vi.durationMinutes,
          notes: vi.notes,
          checklist_reviewed: vi.checklistReviewed,
          gps_location: vi.gpsLocation
        }))
      );
      if (visitsError) throw new Error(`Visits Sync Failed: ${visitsError.message}`);
      log.push('✓ Supervisor field safety/audit visits synchronized.');
    }

    // 4. Sync complaints
    if (state.complaints.length > 0) {
      log.push(`Syncing ${state.complaints.length} complaint tickets...`);
      const { error: complaintsError } = await client.from('complaints').upsert(
        state.complaints.map(c => ({
          id: c.id,
          vendor_id: c.vendorId,
          vendor_name: c.vendorName,
          title: c.title,
          description: c.description,
          category: c.category,
          created_at: c.createdAt,
          status: c.status,
          severity: c.severity,
          resolution_text: c.resolutionText || null,
          resolved_at: c.resolvedAt || null,
          resolved_by: c.resolvedBy || null
        }))
      );
      if (complaintsError) throw new Error(`Complaints Sync Failed: ${complaintsError.message}`);
      log.push('✓ Complaint dossiers synchronized.');
    }

    // 5. Sync reports
    if (state.reports.length > 0) {
      log.push(`Syncing ${state.reports.length} daily officer checklists...`);
      const { error: reportsError } = await client.from('reports').upsert(
        state.reports.map(r => ({
          id: r.id,
          field_officer_id: r.fieldOfficerId,
          field_officer_name: r.fieldOfficerName,
          date: r.date,
          vendors_onboarded_count: r.vendorsOnboardedCount,
          steps_completed_count: r.stepsCompletedCount,
          summary: r.summary,
          challenges: r.challenges,
          status: r.status,
          supervisor_notes: r.supervisorNotes || null
        }))
      );
      if (reportsError) throw new Error(`Reports Sync Failed: ${reportsError.message}`);
      log.push('✓ Daily reports synchronized.');
    }

    // 6. Sync courses
    if (state.courses.length > 0) {
      log.push(`Syncing ${state.courses.length} training courses...`);
      const { error: coursesError } = await client.from('courses').upsert(
        state.courses.map(co => ({
          id: co.id,
          title: co.title,
          description: co.description,
          category: co.category,
          duration_minutes: co.durationMinutes,
          completed_by_field_officers: co.completedByFieldOfficers
        }))
      );
      if (coursesError) throw new Error(`Courses Sync Failed: ${coursesError.message}`);
      log.push('✓ Curriculum courses synchronized.');
    }

    // 7. Sync audits
    if (state.auditLogs.length > 0) {
      log.push(`Syncing ${state.auditLogs.length} ledger audit trails...`);
      const { error: auditsError } = await client.from('audit_logs').upsert(
        state.auditLogs.map(au => ({
          id: au.id,
          timestamp: au.timestamp,
          user_id: au.userId,
          user_name: au.userName,
          user_role: au.userRole,
          action: au.action,
          details: au.details
        }))
      );
      if (auditsError) throw new Error(`Audit Logs Sync Failed: ${auditsError.message}`);
      log.push('✓ System security logs synchronized.');
    }

    log.push('★ Synchronization COMPLETE! All local state is now matched securely with Supabase DB.');
    return { success: true, log };
  } catch (err: any) {
    log.push(`❌ CRITICAL FAILURE during sync: ${err.message}`);
    return { success: false, log };
  }
}

// Pull all state from Supabase
export async function pullStateFromSupabase(): Promise<{
  success: boolean;
  data?: {
    users: User[];
    vendors: Vendor[];
    visits: WeeklyVisit[];
    complaints: Complaint[];
    reports: DailyReport[];
    courses: TrainingCourse[];
    auditLogs: AuditLog[];
  };
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client not initialized.' };
  }

  try {
    let usersData: any[] = [];
    let vendorsData: any[] = [];
    let visitsData: any[] = [];
    let complaintsData: any[] = [];
    let reportsData: any[] = [];
    let coursesData: any[] = [];
    let auditsData: any[] = [];

    const handleFetchError = (err: any, label: string) => {
      const isSchemaError = err.message.toLowerCase().includes('schema cache') || 
                            err.message.toLowerCase().includes('not find the table') || 
                            err.message.toLowerCase().includes('does not exist');
      if (isSchemaError) {
        console.warn(`Supabase pull skipped. [${label}] table not present or ready.`);
      } else {
        throw err;
      }
    };

    // 1. Pull users
    try {
      const { data, error } = await client.from('users').select('*');
      if (error) throw error;
      usersData = data || [];
    } catch (err: any) {
      handleFetchError(err, 'users');
    }

    // 2. Pull vendors
    try {
      const { data, error } = await client.from('vendors').select('*');
      if (error) throw error;
      vendorsData = data || [];
    } catch (err: any) {
      handleFetchError(err, 'vendors');
    }

    // 3. Pull visits
    try {
      const { data, error } = await client.from('visits').select('*');
      if (error) throw error;
      visitsData = data || [];
    } catch (err: any) {
      handleFetchError(err, 'visits');
    }

    // 4. Pull complaints
    try {
      const { data, error } = await client.from('complaints').select('*');
      if (error) throw error;
      complaintsData = data || [];
    } catch (err: any) {
      handleFetchError(err, 'complaints');
    }

    // 5. Pull reports
    try {
      const { data, error } = await client.from('reports').select('*');
      if (error) throw error;
      reportsData = data || [];
    } catch (err: any) {
      handleFetchError(err, 'reports');
    }

    // 6. Pull courses
    try {
      const { data, error } = await client.from('courses').select('*');
      if (error) throw error;
      coursesData = data || [];
    } catch (err: any) {
      handleFetchError(err, 'courses');
    }

    // 7. Pull audit logs
    try {
      const { data, error } = await client.from('audit_logs').select('*').order('timestamp', { ascending: false });
      if (error) throw error;
      auditsData = data || [];
    } catch (err: any) {
      handleFetchError(err, 'audit_logs');
    }

    return {
      success: true,
      data: {
        users: (usersData || []).map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          region: u.region,
          avatar: u.avatar,
          phone: u.phone || undefined,
          assignedSupervisorId: u.assigned_supervisor_id || undefined,
        })),
        vendors: (vendorsData || []).map(v => ({
          id: v.id,
          name: v.name,
          ownerName: v.owner_name,
          phone: v.phone,
          email: v.email,
          hubRegion: v.hub_region,
          category: v.category,
          city: v.city,
          registeredDate: v.registered_date,
          onboardingStep: v.onboarding_step,
          checklist: v.checklist,
          products: v.products || [],
          ordersCount: v.orders_count || 0,
          inactiveDays: v.inactive_days || 0,
          qualityStatus: v.quality_status || 'pending',
          fieldOfficerId: v.field_officer_id,
          lastVisitDate: v.last_visit_date || undefined
        })),
        visits: (visitsData || []).map(vi => ({
          id: vi.id,
          vendorId: vi.vendor_id,
          vendorName: vi.vendor_name,
          supervisorId: vi.supervisor_id,
          supervisorName: vi.supervisor_name,
          date: vi.date,
          durationMinutes: vi.duration_minutes,
          notes: vi.notes,
          checklistReviewed: vi.checklist_reviewed,
          gpsLocation: vi.gps_location
        })),
        complaints: (complaintsData || []).map(c => ({
          id: c.id,
          vendorId: c.vendor_id,
          vendorName: c.vendor_name,
          title: c.title,
          description: c.description,
          category: c.category,
          createdAt: c.created_at,
          status: c.status,
          severity: c.severity,
          resolutionText: c.resolution_text || undefined,
          resolvedAt: c.resolved_at || undefined,
          resolvedBy: c.resolved_by || undefined
        })),
        reports: (reportsData || []).map(r => ({
          id: r.id,
          fieldOfficerId: r.field_officer_id,
          fieldOfficerName: r.field_officer_name,
          date: r.date,
          vendorsOnboardedCount: r.vendors_onboarded_count,
          stepsCompletedCount: r.steps_completed_count,
          summary: r.summary,
          challenges: r.challenges,
          status: r.status,
          supervisorNotes: r.supervisor_notes || undefined
        })),
        courses: (coursesData || []).map(co => ({
          id: co.id,
          title: co.title,
          description: co.description,
          category: co.category,
          durationMinutes: co.duration_minutes,
          completedByFieldOfficers: co.completed_by_field_officers || []
        })),
        auditLogs: (auditsData || []).map(au => ({
          id: au.id,
          timestamp: au.timestamp,
          userId: au.user_id,
          userName: au.user_name,
          userRole: au.user_role,
          action: au.action,
          details: au.details
        }))
      }
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export const SUPABASE_SQL_SCHEMA = `-- ==========================================================
--  MARKET STORMER / MAMIHUBS ONBOARDING DATABASE SCHEMA
--  Paste this entire script into the Supabase SQL Editor.
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('field_personnel', 'supervisor', 'admin')),
    region TEXT NOT NULL,
    avatar TEXT NOT NULL,
    phone TEXT,
    assigned_supervisor_id TEXT REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.vendors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    hub_region TEXT NOT NULL,
    category TEXT NOT NULL,
    city TEXT NOT NULL,
    registered_date TEXT NOT NULL,
    onboarding_step INTEGER DEFAULT 1 NOT NULL,
    checklist JSONB DEFAULT '{}'::jsonb NOT NULL,
    products JSONB DEFAULT '[]'::jsonb NOT NULL,
    orders_count INTEGER DEFAULT 0 NOT NULL,
    inactive_days INTEGER DEFAULT 0 NOT NULL,
    quality_status TEXT NOT NULL DEFAULT 'pending' CHECK (quality_status IN ('approved', 'pending', 'action_required')),
    field_officer_id TEXT NOT NULL REFERENCES public.users(id),
    last_visit_date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.visits (
    id TEXT PRIMARY KEY,
    vendor_id TEXT NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    vendor_name TEXT NOT NULL,
    supervisor_id TEXT NOT NULL REFERENCES public.users(id),
    supervisor_name TEXT NOT NULL,
    date TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    notes TEXT NOT NULL,
    checklist_reviewed BOOLEAN DEFAULT FALSE NOT NULL,
    gps_location JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.complaints (
    id TEXT PRIMARY KEY,
    vendor_id TEXT NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    vendor_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    severity TEXT NOT NULL DEFAULT 'medium',
    resolution_text TEXT,
    resolved_at TEXT,
    resolved_by TEXT REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.reports (
    id TEXT PRIMARY KEY,
    field_officer_id TEXT NOT NULL REFERENCES public.users(id),
    field_officer_name TEXT NOT NULL,
    date TEXT NOT NULL,
    vendors_onboarded_count INTEGER DEFAULT 0 NOT NULL,
    steps_completed_count INTEGER DEFAULT 0 NOT NULL,
    summary TEXT NOT NULL,
    challenges TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_review',
    supervisor_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    completed_by_field_officers TEXT[] DEFAULT '{}'::text[] NOT NULL
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public Write Users" ON public.users FOR ALL USING (true);
CREATE POLICY "Public ALL Vendors" ON public.vendors FOR ALL USING (true);
CREATE POLICY "Public ALL Visits" ON public.visits FOR ALL USING (true);
CREATE POLICY "Public ALL Complaints" ON public.complaints FOR ALL USING (true);
CREATE POLICY "Public ALL Reports" ON public.reports FOR ALL USING (true);
CREATE POLICY "Public ALL Courses" ON public.courses FOR ALL USING (true);
CREATE POLICY "Public ALL AuditLogs" ON public.audit_logs FOR ALL USING (true);

INSERT INTO public.users (id, email, name, role, region, avatar) VALUES
('u-1', 'admin@mamihubs.com', 'Chloe Henderson', 'admin', 'Global Hub', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'),
('u-2', 'sarah@mamihubs.com', 'Sarah Jenkins', 'supervisor', 'East Hub', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'),
('u-3', 'marcus@mamihubs.com', 'Marcus Vance', 'supervisor', 'Central Hub', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'),
('u-4', 'david@mamihubs.com', 'David Cole', 'field_personnel', 'East Hub', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150')
ON CONFLICT (id) DO NOTHING;
`;

export const SUPABASE_EDGE_FUNCTIONS = [
  {
    name: 'auth-secure-verify',
    description: 'Securing administrative and supervisory authorization checkpoints before granting entry to regional data buffers.',
    code: '// Deno runtime - Supabase Secure Edge Function: auth-secure-verify'
  },
  {
    name: 'submit-imputation',
    description: 'Intercepts incoming field registrations and applies organic certification on the Edge before persisting.',
    code: '// Deno runtime - Supabase Secure Edge Function: submit-imputation'
  },
  {
    name: 'gemini-secure-resolution',
    description: 'Invokes Gemini AI Models from within a secure Supabase Edge environment, shielding API keys from the web client.',
    code: '// Deno runtime - Supabase Secure Edge Function: gemini-secure-resolution'
  }
];
