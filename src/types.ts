export type RoleType = 'field_personnel' | 'supervisor' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: RoleType;
  region: string;
  avatar: string;
  phone?: string;
  assignedSupervisorId?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  createdAt: string;
  status: 'approved' | 'rejected' | 'pending_review';
  isOrganicOrFamilyCertified: boolean;
  image?: string;
}

export interface VendorChecklist {
  registered: boolean;
  profileCompleted: boolean;
  firstProductUploaded: boolean;
  min10ProductsUploaded: boolean;
  firstOrderReceived: boolean;
  firstOrderFulfilled: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  hubRegion: string;
  category: string;
  city: string;
  registeredDate: string;
  onboardingStep: number; // Current completed step: 0 to 6
  checklist: VendorChecklist;
  products: Product[];
  ordersCount: number;
  inactiveDays: number; // Track for inactivity monitoring
  qualityStatus: 'approved' | 'pending' | 'action_required';
  fieldOfficerId: string;
  lastVisitDate?: string;
}

export interface WeeklyVisit {
  id: string;
  vendorId: string;
  vendorName: string;
  supervisorId: string;
  supervisorName: string;
  date: string;
  durationMinutes: number;
  notes: string;
  checklistReviewed: boolean;
  gpsLocation: {
    lat: number;
    lng: number;
    address: string;
  };
}

export interface Complaint {
  id: string;
  vendorId: string;
  vendorName: string;
  title: string;
  description: string;
  category: 'onboarding_speed' | 'portal_access' | 'product_listing' | 'payouts' | 'unresponsive_officer';
  createdAt: string;
  status: 'open' | 'in_progress' | 'resolved';
  severity: 'low' | 'medium' | 'high';
  resolutionText?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface DailyReport {
  id: string;
  fieldOfficerId: string;
  fieldOfficerName: string;
  date: string;
  vendorsOnboardedCount: number;
  stepsCompletedCount: number;
  summary: string;
  challenges: string;
  status: 'pending_review' | 'reviewed';
  supervisorNotes?: string;
}

export interface TrainingCourse {
  id: string;
  title: string;
  description: string;
  category: 'Customer Success' | 'Product Quality' | 'Digital Sales' | 'Code of Conduct';
  durationMinutes: number;
  completedByFieldOfficers: string[]; // field officer user.id
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
}
