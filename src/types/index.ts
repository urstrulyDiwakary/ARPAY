// User and Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Employee';
  status: 'Active' | 'Inactive' | 'Disabled';
  avatar?: string;
  lastActive?: string;
  department?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// Invoice Types
export interface InvoiceLineItem {
  id: string;
  description: string;
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

export type InvoiceType = 'Project' | 'Customer' | 'Expense';

export interface Invoice {
  id: string;
  clientName: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  date: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  invoiceType: InvoiceType;
  attachments?: InvoiceAttachment[];
}

// Expense Types
export type ExpenseCategory = 'Travel' | 'Office' | 'Marketing' | 'Equipment' | 'Salary' | 'Fuel' | 'Vehicle' | 'Other';

export interface ExpenseAttachment {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'document';
  url: string;
  size: number;
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  notes: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  paymentMode?: 'Cash' | 'Bank Transfer' | 'Card' | 'UPI';
  property?: string;
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

export interface Project {
  id: string;
  name: string;
  description: string;
  client: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  progress: number;
  teamMembers: string[];
  milestones: ProjectMilestone[];
}
