// User and Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  status: 'ACTIVE' | 'INACTIVE' | 'DISABLED';
  avatar?: string;
  lastActive?: string;
  department?: string;
  employeeId?: string;
  phone?: string;
  dateOfJoining?: string;
  salary?: number | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// Invoice Types
export interface InvoiceLineItem {
  id: string;
  description: string;
  plotNo: string;
  cents: number;
  pricePerCent: number;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  quantity: number;
  price: number;
}

export interface InvoiceAttachment {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'document';
  url: string;
  size: number;
}

export type InvoiceType = 'PROJECT' | 'CUSTOMER' | 'EXPENSE';

export type LeadSourceType = 'Marketing Data' | 'Old Data' | 'Direct Lead' | 'Referral' | 'Social Media' | 'Others';

export interface Invoice {
  id: string;
  invoiceNumber?: string;
  projectName?: string;
  customerName: string;
  customerPhone?: string;
  reference?: string;
  leadSource?: LeadSourceType;
  invoiceDate: string;
  dueDate: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL';
  amount: number;
  tax?: number;
  totalAmount: number;
  lineItems: InvoiceLineItem[];
  tokenAmount?: number;
  agreementAmount?: number;
  registrationAmount?: number;
  agreementDueDate?: string;
  agreementDueAmount?: number;
  registrationDueDate?: string;
  registrationDueAmount?: number;
  invoiceType: InvoiceType;
  attachments?: InvoiceAttachment[];
  notes?: string;
}

// Expense Types
export type ExpenseCategory = 'TRAVEL' | 'OFFICE' | 'MARKETING' | 'EQUIPMENT' | 'SALARY' | 'FUEL' | 'VEHICLE' | 'OTHER';

export interface ExpenseAttachment {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'document';
  url: string;
  size: number;
  dataUrl?: string;
  mimeType?: string;
}

export interface Expense {
  id: string;
  invoiceNumber?: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  notes: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  paymentMode?: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'UPI';
  property?: string;
  projectName?: string;
  attachments?: ExpenseAttachment[];
}

// Payment Types
export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: 'Credit Card' | 'Bank Transfer' | 'Cash' | 'Check';
  status: 'Completed' | 'Pending' | 'Failed';
  date: string;
}

// Approval Types
export interface ApprovalRequest {
  id: string;
  type: 'Expense' | 'Invoice' | 'Time Off' | 'Budget' | 'Leave' | 'Purchase';
  requestedBy: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  date: string;
  description: string;
  priority: 'Normal' | 'Urgent';
  department?: string;
}

// Time Tracking Types
export interface TimeEntry {
  id: string;
  project: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime: string;
  hours: number;
  date: string;
  description: string;
}

// Notification Types
export interface Notification {
  id: string;
  message: string;
  priority: 'High' | 'Medium' | 'Low';
  date: string;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'error';
}

// Report Types
export interface ReportData {
  id: string;
  name: string;
  value: number;
  date: string;
  category: string;
}

export type ReportType = 'revenue' | 'expenses' | 'payments' | 'time';

// Project Types
export type ProjectStatus = 'Not Started' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
export type ProjectPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface ProjectMilestone {
  id: string;
  name: string;
  dueDate: string;
  completed: boolean;
}

// Project Master Type - Central master data for projects
export interface ProjectMaster {
  id?: number | string; // Can be number from DB or string for temporary IDs
  projectName: string; // Project name (e.g., "Ananta Giri")
  propertyName: string; // Property/Phase name (e.g., "Ananta Giri Farm Lands")
  plotNumber: string; // Plot number
  plotArea: number; // Area in cents
  plotPrice: number; // Price per cent
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  customer: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  progress: number;
  teamMembers: string[];
  milestones: ProjectMilestone[];
  projectType?: 'general' | 'real-estate';
}

// Real Estate Project Types
export interface RealEstateSale {
  id: string;
  plotNumber: string;
  buyerName: string;
  saleAmount: number;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  saleDate: string;
  paymentReceived: number;
  remainingAmount: number;
}

export interface RealEstateProjectDetails {
  id: string;
  projectName: string;
  projectLocation: string;
  totalArea: number; // in cents/sq.ft
  launchDate: string;
  expectedCompletionDate: string;
  totalBudget: number;
  totalExpenses: number;
  totalSalesValue: number;
  totalUnitsAvailable: number;
  totalUnitsSold: number;
  salesInProgress: number;
  salesPending: number;
  salesRejected: number;
  timeline: {
    phase: string;
    startDate: string;
    endDate: string;
    status: 'planned' | 'ongoing' | 'completed';
  }[];
  sales: RealEstateSale[];
  expenses: {
    category: string;
    amount: number;
    date: string;
  }[];
}
