import { 
  Invoice, 
  Expense, 
  Payment, 
  ApprovalRequest, 
  TimeEntry, 
  User, 
  Notification,
  ReportData,
  Project 
} from '@/types';

// Helper to simulate API delay
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 11);

// Mock Data Storage (in-memory)
let invoices: Invoice[] = [
  { id: 'INV-001', clientName: 'Acme Corp', amount: 5000, status: 'Paid', date: '2024-01-15', dueDate: '2024-02-15', lineItems: [{ id: '1', description: 'Consulting Services', quantity: 10, price: 500 }], invoiceType: 'Customer' },
  { id: 'INV-002', clientName: 'Tech Solutions', amount: 3500, status: 'Pending', date: '2024-01-20', dueDate: '2024-02-20', lineItems: [{ id: '1', description: 'Development', quantity: 7, price: 500 }], invoiceType: 'Project' },
  { id: 'INV-003', clientName: 'Global Industries', amount: 8000, status: 'Overdue', date: '2023-12-01', dueDate: '2024-01-01', lineItems: [{ id: '1', description: 'Project Management', quantity: 16, price: 500 }], invoiceType: 'Customer' },
  { id: 'INV-004', clientName: 'StartUp Inc', amount: 2200, status: 'Pending', date: '2024-01-25', dueDate: '2024-02-25', lineItems: [{ id: '1', description: 'Design Services', quantity: 4, price: 550 }], invoiceType: 'Expense' },
];

let expenses: Expense[] = [
  { id: 'EXP-001', category: 'Travel', amount: 450, date: '2024-01-10', notes: 'Client meeting in NYC', status: 'Approved', paymentMode: 'Card' },
  { id: 'EXP-002', category: 'Office', amount: 120, date: '2024-01-12', notes: 'Office supplies', status: 'Approved', paymentMode: 'Cash' },
  { id: 'EXP-003', category: 'Marketing', amount: 2500, date: '2024-01-15', notes: 'Digital ads campaign', status: 'Pending', paymentMode: 'Bank Transfer' },
  { id: 'EXP-004', category: 'Equipment', amount: 1800, date: '2024-01-18', notes: 'New laptop', status: 'Pending', paymentMode: 'Card' },
  { id: 'EXP-005', category: 'Salary', amount: 5000, date: '2024-01-25', notes: 'Monthly salary', status: 'Approved', paymentMode: 'Bank Transfer' },
  { id: 'EXP-006', category: 'Fuel', amount: 350, date: '2024-01-20', notes: 'Vehicle fuel', status: 'Approved', paymentMode: 'Cash' },
  { id: 'EXP-007', category: 'Vehicle', amount: 800, date: '2024-01-22', notes: 'Car service', status: 'Pending', paymentMode: 'Card' },
];

let payments: Payment[] = [
  { id: 'PAY-001', invoiceId: 'INV-001', amount: 5000, method: 'Bank Transfer', status: 'Completed', date: '2024-01-20' },
  { id: 'PAY-002', invoiceId: 'INV-002', amount: 1000, method: 'Credit Card', status: 'Pending', date: '2024-01-22' },
  { id: 'PAY-003', invoiceId: 'INV-004', amount: 2200, method: 'Check', status: 'Completed', date: '2024-01-25' },
];

let approvals: ApprovalRequest[] = [
  { id: 'APR-001', type: 'Expense', requestedBy: 'Jane Smith', amount: 2500, status: 'Pending', date: '2024-01-15', description: 'Marketing campaign budget', priority: 'Urgent' },
  { id: 'APR-002', type: 'Time Off', requestedBy: 'Bob Johnson', amount: 0, status: 'Pending', date: '2024-01-18', description: '3 days vacation', priority: 'Normal' },
  { id: 'APR-003', type: 'Budget', requestedBy: 'Alice Brown', amount: 15000, status: 'Pending', date: '2024-01-20', description: 'Q2 marketing budget increase', priority: 'Urgent' },
  { id: 'APR-004', type: 'Invoice', requestedBy: 'Mike Wilson', amount: 8500, status: 'Approved', date: '2024-01-10', description: 'New client contract', priority: 'Normal' },
  { id: 'APR-005', type: 'Leave', requestedBy: 'Sarah Davis', amount: 0, status: 'Pending', date: '2024-01-22', description: 'Sick leave request', priority: 'Urgent' },
  { id: 'APR-006', type: 'Purchase', requestedBy: 'Tom Green', amount: 3200, status: 'Pending', date: '2024-01-23', description: 'Office equipment purchase', priority: 'Normal' },
];

let timeEntries: TimeEntry[] = [
  { id: 'TIME-001', project: 'Website Redesign', userId: '1', userName: 'John Doe', startTime: '09:00', endTime: '12:00', hours: 3, date: '2024-01-25', description: 'Homepage mockups' },
  { id: 'TIME-002', project: 'Mobile App', userId: '2', userName: 'Jane Smith', startTime: '10:00', endTime: '16:00', hours: 6, date: '2024-01-25', description: 'API integration' },
  { id: 'TIME-003', project: 'Website Redesign', userId: '1', userName: 'John Doe', startTime: '13:00', endTime: '17:00', hours: 4, date: '2024-01-25', description: 'Responsive design' },
  { id: 'TIME-004', project: 'Client Portal', userId: '3', userName: 'Bob Johnson', startTime: '08:00', endTime: '15:00', hours: 7, date: '2024-01-24', description: 'Dashboard components' },
];

let users: User[] = [
  { id: '1', name: 'John Doe', email: 'john@company.com', role: 'Admin', status: 'Active', lastActive: new Date().toISOString() },
  { id: '2', name: 'Jane Smith', email: 'jane@company.com', role: 'Manager', status: 'Active', lastActive: new Date().toISOString() },
  { id: '3', name: 'Bob Johnson', email: 'bob@company.com', role: 'Employee', status: 'Active', lastActive: new Date(Date.now() - 3600000).toISOString() },
  { id: '4', name: 'Alice Brown', email: 'alice@company.com', role: 'Manager', status: 'Active', lastActive: new Date(Date.now() - 7200000).toISOString() },
  { id: '5', name: 'Mike Wilson', email: 'mike@company.com', role: 'Employee', status: 'Inactive' },
  { id: '6', name: 'Sarah Davis', email: 'sarah@company.com', role: 'Employee', status: 'Disabled' },
  { id: '7', name: 'Tom Green', email: 'tom@company.com', role: 'Manager', status: 'Active', lastActive: new Date().toISOString() },
];

let notifications: Notification[] = [
  { id: 'NOT-001', message: 'Invoice INV-003 is overdue', priority: 'High', date: '2024-01-25', read: false, type: 'warning' },
  { id: 'NOT-002', message: 'New approval request from Jane Smith', priority: 'Medium', date: '2024-01-24', read: false, type: 'info' },
  { id: 'NOT-003', message: 'Payment received for INV-001', priority: 'Low', date: '2024-01-23', read: true, type: 'success' },
  { id: 'NOT-004', message: 'Time entry reminder: Log your hours', priority: 'Medium', date: '2024-01-22', read: false, type: 'info' },
];

// Invoice API
export const invoiceApi = {
  getAll: async (): Promise<Invoice[]> => {
    await delay();
    return [...invoices];
  },
  getById: async (id: string): Promise<Invoice | undefined> => {
    await delay();
    return invoices.find(inv => inv.id === id);
  },
  create: async (data: Omit<Invoice, 'id'>): Promise<Invoice> => {
    await delay();
    const newInvoice = { ...data, id: `INV-${generateId()}` };
    invoices = [...invoices, newInvoice];
    return newInvoice;
  },
  update: async (id: string, data: Partial<Invoice>): Promise<Invoice> => {
    await delay();
    invoices = invoices.map(inv => inv.id === id ? { ...inv, ...data } : inv);
    return invoices.find(inv => inv.id === id)!;
  },
  delete: async (id: string): Promise<void> => {
    await delay();
    invoices = invoices.filter(inv => inv.id !== id);
  },
};

// Expense API
export const expenseApi = {
  getAll: async (): Promise<Expense[]> => {
    await delay();
    return [...expenses];
  },
  create: async (data: Omit<Expense, 'id'>): Promise<Expense> => {
    await delay();
    const newExpense = { ...data, id: `EXP-${generateId()}` };
    expenses = [...expenses, newExpense];
    return newExpense;
  },
  update: async (id: string, data: Partial<Expense>): Promise<Expense> => {
    await delay();
    expenses = expenses.map(exp => exp.id === id ? { ...exp, ...data } : exp);
    return expenses.find(exp => exp.id === id)!;
  },
  delete: async (id: string): Promise<void> => {
    await delay();
    expenses = expenses.filter(exp => exp.id !== id);
  },
};

// Payment API
export const paymentApi = {
  getAll: async (): Promise<Payment[]> => {
    await delay();
    return [...payments];
  },
  create: async (data: Omit<Payment, 'id'>): Promise<Payment> => {
    await delay();
    const newPayment = { ...data, id: `PAY-${generateId()}` };
    payments = [...payments, newPayment];
    return newPayment;
  },
  update: async (id: string, data: Partial<Payment>): Promise<Payment> => {
    await delay();
    payments = payments.map(pay => pay.id === id ? { ...pay, ...data } : pay);
    return payments.find(pay => pay.id === id)!;
  },
  delete: async (id: string): Promise<void> => {
    await delay();
    payments = payments.filter(pay => pay.id !== id);
  },
};

// Approval API
export const approvalApi = {
  getAll: async (): Promise<ApprovalRequest[]> => {
    await delay();
    return [...approvals];
  },
  approve: async (id: string): Promise<ApprovalRequest> => {
    await delay();
    approvals = approvals.map(apr => apr.id === id ? { ...apr, status: 'Approved' } : apr);
    return approvals.find(apr => apr.id === id)!;
  },
  reject: async (id: string): Promise<ApprovalRequest> => {
    await delay();
    approvals = approvals.map(apr => apr.id === id ? { ...apr, status: 'Rejected' } : apr);
    return approvals.find(apr => apr.id === id)!;
  },
};

// Time Entry API
export const timeEntryApi = {
  getAll: async (): Promise<TimeEntry[]> => {
    await delay();
    return [...timeEntries];
  },
  create: async (data: Omit<TimeEntry, 'id'>): Promise<TimeEntry> => {
    await delay();
    const newEntry = { ...data, id: `TIME-${generateId()}` };
    timeEntries = [...timeEntries, newEntry];
    return newEntry;
  },
  update: async (id: string, data: Partial<TimeEntry>): Promise<TimeEntry> => {
    await delay();
    timeEntries = timeEntries.map(entry => entry.id === id ? { ...entry, ...data } : entry);
    return timeEntries.find(entry => entry.id === id)!;
  },
  delete: async (id: string): Promise<void> => {
    await delay();
    timeEntries = timeEntries.filter(entry => entry.id !== id);
  },
};

// User API
export const userApi = {
  getAll: async (): Promise<User[]> => {
    await delay();
    return [...users];
  },
  create: async (data: Omit<User, 'id'>): Promise<User> => {
    await delay();
    const newUser = { ...data, id: generateId() };
    users = [...users, newUser];
    return newUser;
  },
  update: async (id: string, data: Partial<User>): Promise<User> => {
    await delay();
    users = users.map(user => user.id === id ? { ...user, ...data } : user);
    return users.find(user => user.id === id)!;
  },
  disable: async (id: string): Promise<User> => {
    await delay();
    users = users.map(user => user.id === id ? { ...user, status: 'Inactive' } : user);
    return users.find(user => user.id === id)!;
  },
};

// Notification API
export const notificationApi = {
  getAll: async (): Promise<Notification[]> => {
    await delay();
    return [...notifications];
  },
  markAsRead: async (id: string): Promise<Notification> => {
    await delay();
    notifications = notifications.map(not => not.id === id ? { ...not, read: true } : not);
    return notifications.find(not => not.id === id)!;
  },
  markAllAsRead: async (): Promise<void> => {
    await delay();
    notifications = notifications.map(not => ({ ...not, read: true }));
  },
  clear: async (): Promise<void> => {
    await delay();
    notifications = [];
  },
};

// Report API
export const reportApi = {
  getRevenueData: async (startDate: string, endDate: string): Promise<ReportData[]> => {
    await delay();
    return [
      { id: '1', name: 'January', value: 45000, date: '2024-01-01', category: 'Revenue' },
      { id: '2', name: 'February', value: 52000, date: '2024-02-01', category: 'Revenue' },
      { id: '3', name: 'March', value: 48000, date: '2024-03-01', category: 'Revenue' },
    ];
  },
  getExpenseData: async (startDate: string, endDate: string): Promise<ReportData[]> => {
    await delay();
    return [
      { id: '1', name: 'Travel', value: 8500, date: '2024-01-01', category: 'Expense' },
      { id: '2', name: 'Office', value: 3200, date: '2024-01-01', category: 'Expense' },
      { id: '3', name: 'Marketing', value: 12000, date: '2024-01-01', category: 'Expense' },
    ];
  },
};

// Dashboard Stats
export const dashboardApi = {
  getStats: async () => {
    await delay();
    // Calculate total revenue from paid invoices
    const totalRevenue = invoices
      .filter(inv => inv.status === 'Paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
    
    // Get unique active customers (clients with recent invoices)
    const activeCustomers = new Set(invoices.map(inv => inv.clientName)).size;
    
    // Count unique projects from time entries
    const projectCount = new Set(timeEntries.map(entry => entry.project)).size;
    
    // Payment reminders (pending invoices)
    const paymentReminders = invoices.filter(inv => inv.status === 'Pending').length;
    
    // Project deadlines (using invoices with upcoming due dates as proxy)
    const today = new Date();
    const upcomingDeadlines = invoices.filter(inv => {
      const dueDate = new Date(inv.dueDate);
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7 && inv.status !== 'Paid';
    }).length;

    return {
      totalRevenue,
      activeCustomers,
      totalExpenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
      totalPayments: payments.filter(p => p.status === 'Completed').reduce((sum, pay) => sum + pay.amount, 0),
      pendingApprovals: approvals.filter(apr => apr.status === 'Pending').length,
      invoiceCount: invoices.length,
      overdueInvoices: invoices.filter(inv => inv.status === 'Overdue').length,
      paidInvoices: invoices.filter(inv => inv.status === 'Paid').length,
      projectCount,
      paymentReminders,
      upcomingDeadlines,
    };
  },
};

// Mock Projects Data
let projects: Project[] = [
  {
    id: 'PRJ-001',
    name: 'Website Redesign',
    description: 'Complete redesign of company website with modern UI/UX',
    client: 'Acme Corp',
    status: 'In Progress',
    priority: 'High',
    startDate: '2024-01-01',
    endDate: '2024-03-15',
    budget: 50000,
    spent: 28000,
    progress: 65,
    teamMembers: ['John Doe', 'Jane Smith'],
    milestones: [
      { id: 'm1', name: 'Design Phase', dueDate: '2024-01-30', completed: true },
      { id: 'm2', name: 'Development', dueDate: '2024-02-28', completed: false },
    ],
  },
  {
    id: 'PRJ-002',
    name: 'Mobile App',
    description: 'Cross-platform mobile application development',
    client: 'Tech Solutions',
    status: 'In Progress',
    priority: 'Critical',
    startDate: '2024-01-15',
    endDate: '2024-04-30',
    budget: 80000,
    spent: 35000,
    progress: 40,
    teamMembers: ['Jane Smith', 'Bob Johnson'],
    milestones: [
      { id: 'm1', name: 'MVP', dueDate: '2024-02-28', completed: true },
      { id: 'm2', name: 'Beta Release', dueDate: '2024-03-30', completed: false },
    ],
  },
  {
    id: 'PRJ-003',
    name: 'Client Portal',
    description: 'Customer-facing dashboard and portal',
    client: 'Global Industries',
    status: 'Not Started',
    priority: 'Medium',
    startDate: '2024-02-01',
    endDate: '2024-05-15',
    budget: 45000,
    spent: 0,
    progress: 0,
    teamMembers: ['Bob Johnson'],
    milestones: [],
  },
  {
    id: 'PRJ-004',
    name: 'ERP Integration',
    description: 'Integration with enterprise resource planning system',
    client: 'StartUp Inc',
    status: 'On Hold',
    priority: 'Low',
    startDate: '2023-11-01',
    endDate: '2024-01-31',
    budget: 30000,
    spent: 15000,
    progress: 50,
    teamMembers: ['Alice Brown', 'Mike Wilson'],
    milestones: [
      { id: 'm1', name: 'Analysis', dueDate: '2023-11-30', completed: true },
    ],
  },
  {
    id: 'PRJ-005',
    name: 'Data Migration',
    description: 'Legacy system data migration to cloud',
    client: 'Acme Corp',
    status: 'Completed',
    priority: 'High',
    startDate: '2023-10-01',
    endDate: '2023-12-31',
    budget: 25000,
    spent: 23000,
    progress: 100,
    teamMembers: ['John Doe', 'Sarah Davis'],
    milestones: [
      { id: 'm1', name: 'Planning', dueDate: '2023-10-15', completed: true },
      { id: 'm2', name: 'Migration', dueDate: '2023-12-01', completed: true },
      { id: 'm3', name: 'Verification', dueDate: '2023-12-31', completed: true },
    ],
  },
];

// Project API
export const projectApi = {
  getAll: async (): Promise<Project[]> => {
    await delay();
    return [...projects];
  },
  getById: async (id: string): Promise<Project | undefined> => {
    await delay();
    return projects.find(p => p.id === id);
  },
  create: async (data: Omit<Project, 'id'>): Promise<Project> => {
    await delay();
    const newProject = { ...data, id: `PRJ-${generateId()}` };
    projects = [...projects, newProject];
    return newProject;
  },
  update: async (id: string, data: Partial<Project>): Promise<Project> => {
    await delay();
    projects = projects.map(p => p.id === id ? { ...p, ...data } : p);
    return projects.find(p => p.id === id)!;
  },
  delete: async (id: string): Promise<void> => {
    await delay();
    projects = projects.filter(p => p.id !== id);
  },
};
