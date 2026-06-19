import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Vendor, WeeklyVisit, Complaint, DailyReport, TrainingCourse, AuditLog, Product } from './types';
import { DEMO_USERS, DEMO_VENDORS, DEMO_VISITS, DEMO_COMPLAINTS, DEMO_REPORTS, DEMO_COURSES, DEMO_AUDIT_LOGS } from './initialData';
import { 
  getSupabaseConfig, 
  getSupabaseClient, 
  pushStateToSupabase, 
  pullStateFromSupabase, 
  saveSupabaseConfig 
} from './lib/supabase';

interface OnboardingContextProps {
  currentUser: User | null;
  users: User[];
  vendors: Vendor[];
  visits: WeeklyVisit[];
  complaints: Complaint[];
  reports: DailyReport[];
  courses: TrainingCourse[];
  auditLogs: AuditLog[];
  supabaseEnabled: boolean;
  supabaseLogs: string[];
  login: (email: string) => boolean;
  logout: () => void;
  registerVendor: (vendorData: { name: string; ownerName: string; phone: string; email: string; hubRegion: string; category: string; city: string; fieldOfficerId: string }) => Vendor;
  updateVendorChecklist: (vendorId: string, key: keyof Vendor['checklist'], checked: boolean) => void;
  addVendorProduct: (vendorId: string, productData: { name: string; price: number; category: string; isOrganic: boolean }) => void;
  simulateVendorOrder: (vendorId: string) => void;
  logWeeklyVisit: (visitData: { vendorId: string; vendorName: string; supervisorId: string; supervisorName: string; durationMinutes: number; notes: string; address: string; lat: number; lng: number }) => void;
  addComplaint: (complaintData: { vendorId: string; vendorName: string; title: string; description: string; category: Complaint['category']; severity: Complaint['severity'] }) => void;
  resolveComplaint: (complaintId: string, resolutionText: string) => void;
  updateVendorQuality: (vendorId: string, status: Vendor['qualityStatus']) => void;
  submitDailyReport: (reportData: { fieldOfficerId: string; fieldOfficerName: string; date: string; vendorsOnboardedCount: number; stepsCompletedCount: number; summary: string; challenges: string }) => void;
  reviewDailyReport: (reportId: string, supervisorNotes: string) => void;
  toggleFieldOfficerTraining: (courseId: string, fieldOfficerId: string) => void;
  addAudit: (action: string, details: string) => void;
  generateAiResolutionDraft: (complaint: Complaint) => Promise<{ resolution: string; steps: string[]; recommendedTraining?: string }>;
  generateAiOnboardingBrief: () => Promise<{ executiveSummary: string; directives: string[] }>;
  triggerSupabasePush: () => Promise<boolean>;
  triggerSupabasePull: () => Promise<boolean>;
  setSupabaseEnabled: (enabled: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextProps | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [visits, setVisits] = useState<WeeklyVisit[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [supabaseEnabled, setRawSupabaseEnabled] = useState<boolean>(false);
  const [supabaseLogs, setSupabaseLogs] = useState<string[]>(['Init Supabase offline sandbox context.']);

  const setSupabaseEnabled = (enabled: boolean) => {
    setRawSupabaseEnabled(enabled);
    const config = getSupabaseConfig();
    saveSupabaseConfig(config.url, config.anonKey, enabled);
    addLog(`Supabase integrations toggled to: ${enabled ? 'ACTIVE_MIRROR' : 'DISABLED'}`);
  };

  const addLog = (msg: string) => {
    setSupabaseLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 49)]);
  };

  // Initialize and load state from localStorage
  useEffect(() => {
    const localUsers = localStorage.getItem('m_users');
    const localVendors = localStorage.getItem('m_vendors');
    const localVisits = localStorage.getItem('m_visits');
    const localComplaints = localStorage.getItem('m_complaints');
    const localReports = localStorage.getItem('m_reports');
    const localCourses = localStorage.getItem('m_courses');
    const localAudits = localStorage.getItem('m_audits');
    const localUser = localStorage.getItem('m_curr_user');

    if (localUsers) setUsers(JSON.parse(localUsers));
    else {
      setUsers(DEMO_USERS);
      localStorage.setItem('m_users', JSON.stringify(DEMO_USERS));
    }

    if (localVendors) setVendors(JSON.parse(localVendors));
    else {
      setVendors(DEMO_VENDORS);
      localStorage.setItem('m_vendors', JSON.stringify(DEMO_VENDORS));
    }

    if (localVisits) setVisits(JSON.parse(localVisits));
    else {
      setVisits(DEMO_VISITS);
      localStorage.setItem('m_visits', JSON.stringify(DEMO_VISITS));
    }

    if (localComplaints) setComplaints(JSON.parse(localComplaints));
    else {
      setComplaints(DEMO_COMPLAINTS);
      localStorage.setItem('m_complaints', JSON.stringify(DEMO_COMPLAINTS));
    }

    if (localReports) setReports(JSON.parse(localReports));
    else {
      setReports(DEMO_REPORTS);
      localStorage.setItem('m_reports', JSON.stringify(DEMO_REPORTS));
    }

    if (localCourses) setCourses(JSON.parse(localCourses));
    else {
      setCourses(DEMO_COURSES);
      localStorage.setItem('m_courses', JSON.stringify(DEMO_COURSES));
    }

    if (localAudits) setAuditLogs(JSON.parse(localAudits));
    else {
      setAuditLogs(DEMO_AUDIT_LOGS);
      localStorage.setItem('m_audits', JSON.stringify(DEMO_AUDIT_LOGS));
    }

    if (localUser) {
      setCurrentUser(JSON.parse(localUser));
    }

    // Load initial Supabase enablement status
    const config = getSupabaseConfig();
    setRawSupabaseEnabled(config.enabled);
    if (config.enabled) {
      addLog(`Supabase mirror configured to server at ${config.url.slice(0, 25)}...`);
    }
  }, []);

  // Sync individual lists to Supabase in background
  const syncListToSupabase = async (tableName: string, dataList: any[]) => {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      if (tableName === 'users') {
        const { error } = await client.from('users').upsert(dataList.map((u: any) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          region: u.region,
          avatar: u.avatar,
          phone: u.phone || null,
          assigned_supervisor_id: u.assignedSupervisorId || null
        })));
        if (error) throw error;
      } else if (tableName === 'vendors') {
        const { error } = await client.from('vendors').upsert(dataList.map((v: any) => ({
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
        })));
        if (error) throw error;
      } else if (tableName === 'visits') {
        const { error } = await client.from('visits').upsert(dataList.map((vi: any) => ({
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
        })));
        if (error) throw error;
      } else if (tableName === 'complaints') {
        const { error } = await client.from('complaints').upsert(dataList.map((c: any) => ({
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
        })));
        if (error) throw error;
      } else if (tableName === 'reports') {
        const { error } = await client.from('reports').upsert(dataList.map((r: any) => ({
          id: r.id,
          field_officer_id: r.fieldOfficerId,
          field_officer_name: r.fieldOfficerName,
          date: r.date,
          vendors_onboarded_count: r.vendorsOnboardedCount,
          steps_completed_count: r.stepsCompletedCount,
          summary: r.summary,
          challenges: r.challenges,
          status: r.status,
          supervisor_notes: r.supervisor_notes || null
        })));
        if (error) throw error;
      } else if (tableName === 'courses') {
        const { error } = await client.from('courses').upsert(dataList.map((co: any) => ({
          id: co.id,
          title: co.title,
          description: co.description,
          category: co.category,
          duration_minutes: co.durationMinutes,
          completed_by_field_officers: co.completedByFieldOfficers
        })));
        if (error) throw error;
      } else if (tableName === 'audit_logs') {
        const { error } = await client.from('audit_logs').upsert(dataList.slice(0, 50).map((au: any) => ({
          id: au.id,
          timestamp: au.timestamp,
          user_id: au.userId,
          user_name: au.userName,
          user_role: au.userRole,
          action: au.action,
          details: au.details
        })));
        if (error) throw error;
      }
      addLog(`✓ Supabase background sync: Table [${tableName}] mirrored successfully.`);
    } catch (err: any) {
      console.warn(`Supabase background sync for ${tableName} failed/skipped:`, err.message);
      addLog(`⚡ Supabase sync skipped: Table [${tableName}] (${err.message.slice(0, 30)}...). Is schema deployed?`);
    }
  };

  // Synchronizers that save back to localStorage and replicate to Supabase
  const saveState = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
    
    // Auto-map state keys to Supabase tables
    const mapKeyToTable: Record<string, string> = {
      'm_users': 'users',
      'm_vendors': 'vendors',
      'm_visits': 'visits',
      'm_complaints': 'complaints',
      'm_reports': 'reports',
      'm_courses': 'courses',
      'm_audits': 'audit_logs'
    };
    
    const table = mapKeyToTable[key];
    if (table && supabaseEnabled) {
      syncListToSupabase(table, data);
    }
  };

  // Explicit sync actions
  const triggerSupabasePush = async (): Promise<boolean> => {
    addLog('Pushing entire state to Supabase database...');
    const result = await pushStateToSupabase({
      users,
      vendors,
      visits,
      complaints,
      reports,
      courses,
      auditLogs
    });
    
    result.log.forEach(msg => {
      addLog(msg);
    });
    
    return result.success;
  };

  const triggerSupabasePull = async (): Promise<boolean> => {
    addLog('Querying data streams from Supabase database...');
    const result = await pullStateFromSupabase();
    
    if (result.success && result.data) {
      const { users: u, vendors: v, visits: vi, complaints: c, reports: r, courses: co, auditLogs: al } = result.data;
      
      if (u.length > 0) { setUsers(u); localStorage.setItem('m_users', JSON.stringify(u)); }
      if (v.length > 0) { setVendors(v); localStorage.setItem('m_vendors', JSON.stringify(v)); }
      if (vi.length > 0) { setVisits(vi); localStorage.setItem('m_visits', JSON.stringify(vi)); }
      if (c.length > 0) { setComplaints(c); localStorage.setItem('m_complaints', JSON.stringify(c)); }
      if (r.length > 0) { setReports(r); localStorage.setItem('m_reports', JSON.stringify(r)); }
      if (co.length > 0) { setCourses(co); localStorage.setItem('m_courses', JSON.stringify(co)); }
      if (al.length > 0) { setAuditLogs(al); localStorage.setItem('m_audits', JSON.stringify(al)); }
      
      addLog('✓ Data successfully pulled and integrated into client workspace.');
      return true;
    } else {
      addLog(`❌ Pull failed or table schemas do not exist: ${result.error || 'Connection incomplete'}`);
      return false;
    }
  };

  const addAudit = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'System Auto',
      userRole: currentUser?.role || 'system',
      action,
      details,
    };
    const updated = [newLog, ...auditLogs];
    setAuditLogs(updated);
    saveState('m_audits', updated);
  };

  const login = (email: string): boolean => {
    const normalizedEmail = email.trim().toLowerCase();
    const found = users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (found) {
      setCurrentUser(found);
      saveState('m_curr_user', found);
      
      // Log login event
      const newLog: AuditLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: found.id,
        userName: found.name,
        userRole: found.role,
        action: 'USER_LOGIN',
        details: `Successfully logged in to region: ${found.region}`,
      };
      const updated = [newLog, ...auditLogs];
      setAuditLogs(updated);
      saveState('m_audits', updated);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) {
      addAudit('USER_LOGOUT', `Logged out of region: ${currentUser.region}`);
    }
    setCurrentUser(null);
    localStorage.removeItem('m_curr_user');
  };

  const registerVendor = (vendorData: { name: string; ownerName: string; phone: string; email: string; hubRegion: string; category: string; city: string; fieldOfficerId: string }) => {
    const newVendor: Vendor = {
      id: `v-${Date.now()}`,
      name: vendorData.name,
      ownerName: vendorData.ownerName,
      phone: vendorData.phone,
      email: vendorData.email,
      hubRegion: vendorData.hubRegion,
      category: vendorData.category,
      city: vendorData.city,
      registeredDate: new Date().toISOString().split('T')[0],
      onboardingStep: 1, // First step completed on register
      checklist: {
        registered: true,
        profileCompleted: false,
        firstProductUploaded: false,
        min10ProductsUploaded: false,
        firstOrderReceived: false,
        firstOrderFulfilled: false,
      },
      products: [],
      ordersCount: 0,
      inactiveDays: 0,
      qualityStatus: 'pending',
      fieldOfficerId: vendorData.fieldOfficerId,
    };

    const updated = [newVendor, ...vendors];
    setVendors(updated);
    saveState('m_vendors', updated);
    addAudit('REGISTER_VENDOR', `Registered micro-merchant: "${newVendor.name}" under officer "${currentUser?.name}"`);
    return newVendor;
  };

  const updateVendorChecklist = (vendorId: string, key: keyof Vendor['checklist'], checked: boolean) => {
    const updated = vendors.map(v => {
      if (v.id === vendorId) {
        const checklist = { ...v.checklist, [key]: checked };
        
        // Calculate onboarding step based on sequential milestones
        let step = 0;
        if (checklist.registered) step = 1;
        if (checklist.registered && checklist.profileCompleted) step = 2;
        if (checklist.registered && checklist.profileCompleted && checklist.firstProductUploaded) step = 3;
        if (checklist.registered && checklist.profileCompleted && checklist.firstProductUploaded && checklist.min10ProductsUploaded) step = 4;
        if (checklist.registered && checklist.profileCompleted && checklist.firstProductUploaded && checklist.min10ProductsUploaded && checklist.firstOrderReceived) step = 5;
        if (checklist.registered && checklist.profileCompleted && checklist.firstProductUploaded && checklist.min10ProductsUploaded && checklist.firstOrderReceived && checklist.firstOrderFulfilled) step = 6;

        return { ...v, checklist, onboardingStep: step };
      }
      return v;
    });

    setVendors(updated);
    saveState('m_vendors', updated);
    const vName = vendors.find(v => v.id === vendorId)?.name || 'Unknown';
    addAudit('UPDATE_CHECKLIST', `Updated milestone [${key}] to ${checked} for vendor "${vName}"`);
  };

  const addVendorProduct = (vendorId: string, productData: { name: string; price: number; category: string; isOrganic: boolean }) => {
    const updated = vendors.map(v => {
      if (v.id === vendorId) {
        const newProduct: Product = {
          id: `p-${Date.now()}`,
          name: productData.name,
          price: productData.price,
          category: productData.category,
          createdAt: new Date().toISOString().split('T')[0],
          status: 'pending_review', // Requires supervisor quality validation
          isOrganicOrFamilyCertified: productData.isOrganic,
        };

        const products = [...v.products, newProduct];
        const checklist = { ...v.checklist };

        // Auto trigger checklist triggers
        if (products.length >= 1) {
          checklist.firstProductUploaded = true;
        }
        if (products.length >= 10) {
          checklist.min10ProductsUploaded = true;
        }

        // Recompute steps
        let step = v.onboardingStep;
        if (checklist.registered) step = 1;
        if (checklist.registered && checklist.profileCompleted) step = 2;
        if (checklist.registered && checklist.profileCompleted && checklist.firstProductUploaded) step = 3;
        if (checklist.registered && checklist.profileCompleted && checklist.firstProductUploaded && checklist.min10ProductsUploaded) step = 4;
        if (checklist.registered && checklist.profileCompleted && checklist.firstProductUploaded && checklist.min10ProductsUploaded && checklist.firstOrderReceived) step = 5;
        if (checklist.registered && checklist.profileCompleted && checklist.firstProductUploaded && checklist.min10ProductsUploaded && checklist.firstOrderReceived && checklist.firstOrderFulfilled) step = 6;

        return {
          ...v,
          products,
          checklist,
          onboardingStep: step,
          inactiveDays: 0, // Activity resets inactive days
        };
      }
      return v;
    });

    setVendors(updated);
    saveState('m_vendors', updated);
    const vName = vendors.find(v => v.id === vendorId)?.name || 'Unknown';
    addAudit('ADD_PRODUCT', `Uploaded product "${productData.name}" for vendor "${vName}". Quality inspection pending.`);
  };

  const simulateVendorOrder = (vendorId: string) => {
    const updated = vendors.map(v => {
      if (v.id === vendorId) {
        const newOrdersCount = v.ordersCount + 1;
        const checklist = { ...v.checklist };
        
        if (newOrdersCount === 1) {
          checklist.firstOrderReceived = true;
        }
        // Auto mark fulfilled after orders logging for demo support
        if (checklist.firstOrderReceived) {
          checklist.firstOrderFulfilled = true;
        }

        let step = v.onboardingStep;
        if (checklist.registered) step = 1;
        if (checklist.registered && checklist.profileCompleted) step = 2;
        if (checklist.registered && checklist.profileCompleted && checklist.firstProductUploaded) step = 3;
        if (checklist.registered && checklist.profileCompleted && checklist.firstProductUploaded && checklist.min10ProductsUploaded) step = 4;
        if (checklist.registered && checklist.profileCompleted && checklist.firstProductUploaded && checklist.min10ProductsUploaded && checklist.firstOrderReceived) step = 5;
        if (checklist.registered && checklist.profileCompleted && checklist.firstProductUploaded && checklist.min10ProductsUploaded && checklist.firstOrderReceived && checklist.firstOrderFulfilled) step = 6;

        return {
          ...v,
          ordersCount: newOrdersCount,
          checklist,
          onboardingStep: step,
          inactiveDays: 0,
        };
      }
      return v;
    });

    setVendors(updated);
    saveState('m_vendors', updated);
    const vName = vendors.find(v => v.id === vendorId)?.name || 'Unknown';
    addAudit('SIMULATE_ORDER', `Mocked first sale/fulfillment event for vendor "${vName}"`);
  };

  const logWeeklyVisit = (visitData: { vendorId: string; vendorName: string; supervisorId: string; supervisorName: string; durationMinutes: number; notes: string; address: string; lat: number; lng: number }) => {
    const newVisit: WeeklyVisit = {
      id: `w-${Date.now()}`,
      vendorId: visitData.vendorId,
      vendorName: visitData.vendorName,
      supervisorId: visitData.supervisorId,
      supervisorName: visitData.supervisorName,
      date: new Date().toISOString().split('T')[0],
      durationMinutes: visitData.durationMinutes,
      notes: visitData.notes,
      checklistReviewed: true,
      gpsLocation: {
        lat: visitData.lat,
        lng: visitData.lng,
        address: visitData.address,
      }
    };

    const updatedVisits = [newVisit, ...visits];
    setVisits(updatedVisits);
    saveState('m_visits', updatedVisits);

    // Update vendor last visit date
    const updatedVendors = vendors.map(v => {
      if (v.id === visitData.vendorId) {
        return { ...v, lastVisitDate: newVisit.date, inactiveDays: 0 };
      }
      return v;
    });
    setVendors(updatedVendors);
    saveState('m_vendors', updatedVendors);

    addAudit('LOG_VISIT', `Supervisor ${visitData.supervisorName} logged verification visit to "${visitData.vendorName}"`);
  };

  const addComplaint = (complaintData: { vendorId: string; vendorName: string; title: string; description: string; category: Complaint['category']; severity: Complaint['severity'] }) => {
    const newComplaint: Complaint = {
      id: `c-${Date.now()}`,
      vendorId: complaintData.vendorId,
      vendorName: complaintData.vendorName,
      title: complaintData.title,
      description: complaintData.description,
      category: complaintData.category,
      createdAt: new Date().toISOString(),
      status: 'open',
      severity: complaintData.severity,
    };

    const updated = [newComplaint, ...complaints];
    setComplaints(updated);
    saveState('m_complaints', updated);
    addAudit('ADD_COMPLAINT', `Raised complaint "${complaintData.title}" for vendor "${complaintData.vendorName}"`);
  };

  const resolveComplaint = (complaintId: string, resolutionText: string) => {
    const updated = complaints.map(c => {
      if (c.id === complaintId) {
        return {
          ...c,
          status: 'resolved' as const,
          resolutionText,
          resolvedAt: new Date().toISOString(),
          resolvedBy: currentUser?.id,
        };
      }
      return c;
    });

    setComplaints(updated);
    saveState('m_complaints', updated);
    const title = complaints.find(c => c.id === complaintId)?.title || '';
    addAudit('RESOLVE_COMPLAINT', `Resolved complaint "${title}" with statement: "${resolutionText.substring(0, 40)}..."`);
  };

  const updateVendorQuality = (vendorId: string, status: Vendor['qualityStatus']) => {
    const updated = vendors.map(v => {
      if (v.id === vendorId) {
        // Also update all products associated with this vendor to 'approved' if qualityStatus approved
        const products = v.products.map(p => ({
          ...p,
          status: status === 'approved' ? 'approved' as const : p.status,
        }));
        return { ...v, qualityStatus: status, products };
      }
      return v;
    });

    setVendors(updated);
    saveState('m_vendors', updated);
    const name = vendors.find(v => v.id === vendorId)?.name || '';
    addAudit('QUALITY_UPDATE', `Supervisor updated quality audit status for "${name}" to: ${status.toUpperCase()}`);
  };

  const submitDailyReport = (reportData: { fieldOfficerId: string; fieldOfficerName: string; date: string; vendorsOnboardedCount: number; stepsCompletedCount: number; summary: string; challenges: string }) => {
    const newReport: DailyReport = {
      id: `r-${Date.now()}`,
      fieldOfficerId: reportData.fieldOfficerId,
      fieldOfficerName: reportData.fieldOfficerName,
      date: reportData.date,
      vendorsOnboardedCount: reportData.vendorsOnboardedCount,
      stepsCompletedCount: reportData.stepsCompletedCount,
      summary: reportData.summary,
      challenges: reportData.challenges,
      status: 'pending_review',
    };

    const updated = [newReport, ...reports];
    setReports(updated);
    saveState('m_reports', updated);
    addAudit('SUBMIT_REPORT', `Field officer "${reportData.fieldOfficerName}" submitted daily onboarding logs`);
  };

  const reviewDailyReport = (reportId: string, supervisorNotes: string) => {
    const updated = reports.map(r => {
      if (r.id === reportId) {
        return {
          ...r,
          status: 'reviewed' as const,
          supervisorNotes,
        };
      }
      return r;
    });

    setReports(updated);
    saveState('m_reports', updated);
    const officerName = reports.find(r => r.id === reportId)?.fieldOfficerName || '';
    addAudit('REVIEW_REPORT', `Reviewed officer daily report submitted by "${officerName}"`);
  };

  const toggleFieldOfficerTraining = (courseId: string, fieldOfficerId: string) => {
    const updated = courses.map(c => {
      if (c.id === courseId) {
        const completed = c.completedByFieldOfficers.includes(fieldOfficerId)
          ? c.completedByFieldOfficers.filter(id => id !== fieldOfficerId)
          : [...c.completedByFieldOfficers, fieldOfficerId];
        return { ...c, completedByFieldOfficers: completed };
      }
      return c;
    });

    setCourses(updated);
    saveState('m_courses', updated);
    
    const courseTitle = courses.find(c => c.id === courseId)?.title || '';
    const officerName = users.find(u => u.id === fieldOfficerId)?.name || '';
    addAudit('TRAINING_TOGGLE', `Updated training logs for "${officerName}" on course "${courseTitle}"`);
  };

  // call server-side gemini endpoint to draft resolutions
  const generateAiResolutionDraft = async (complaint: Complaint) => {
    try {
      const response = await fetch('/api/ai/suggest-resolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: complaint.title,
          description: complaint.description,
          category: complaint.category,
          severity: complaint.severity,
          vendorName: complaint.vendorName,
        }),
      });
      if (!response.ok) throw new Error('API failed');
      return await response.json();
    } catch (err) {
      console.error(err);
      return {
        resolution: `Dear ${complaint.vendorName},\n\nWe hear you! Our East Hub crew is looking directly into your ${complaint.category} matter. Rest assured we cherish mom-owned businesses and wish to accelerate your setup.`,
        steps: ['Contact local tech partner', 'Audit physical label certificates', 'Expedite database listings'],
      };
    }
  };

  // call server-side gemini endpoint to generate admin analytical memo
  const generateAiOnboardingBrief = async () => {
    // build simple funnel stats
    const stepDistribution = [
      { step: 'Registered', count: vendors.filter(v => v.onboardingStep >= 1).length },
      { step: 'Profile Done', count: vendors.filter(v => v.onboardingStep >= 2).length },
      { step: '1st Product', count: vendors.filter(v => v.onboardingStep >= 3).length },
      { step: '10 Products', count: vendors.filter(v => v.onboardingStep >= 4).length },
      { step: '1st Order', count: vendors.filter(v => v.onboardingStep >= 5).length },
      { step: 'Fulfilled', count: vendors.filter(v => v.onboardingStep >= 6).length },
    ];

    const activeCount = vendors.filter(v => v.ordersCount > 0).length;
    const inactiveCount = vendors.filter(v => v.inactiveDays >= 10).length;

    try {
      const response = await fetch('/api/ai/onboarding-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funnelStats: stepDistribution,
          activeCount,
          inactiveCount,
          registeredCount: vendors.length,
        }),
      });
      if (!response.ok) throw new Error('API brief failed');
      return await response.json();
    } catch (err) {
      console.error(err);
      return {
        executiveSummary: "Market Stormer onboarding pipelines show steady initial traction. Key product-listing challenges are being proactively managed across East and Central regional hubs.",
        directives: [
          'Direct David Cole to target текстиles vendors for photography support.',
          'Supervisors should host a weekly Zoom workshop on packaging and label printing.',
          'Execute prompt payment validation upgrades.'
        ]
      };
    }
  };

  return (
    <OnboardingContext.Provider value={{
      currentUser,
      users,
      vendors,
      visits,
      complaints,
      reports,
      courses,
      auditLogs,
      supabaseEnabled,
      supabaseLogs,
      login,
      logout,
      registerVendor,
      updateVendorChecklist,
      addVendorProduct,
      simulateVendorOrder,
      logWeeklyVisit,
      addComplaint,
      resolveComplaint,
      updateVendorQuality,
      submitDailyReport,
      reviewDailyReport,
      toggleFieldOfficerTraining,
      addAudit,
      generateAiResolutionDraft,
      generateAiOnboardingBrief,
      triggerSupabasePush,
      triggerSupabasePull,
      setSupabaseEnabled,
    }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
