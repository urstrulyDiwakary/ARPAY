import { 
  Invoice, 
  Expense, 
  Payment, 
  ApprovalRequest, 
  TimeEntry, 
  User, 
  Notification,
  ReportData,
  Project,
  ProjectMaster
} from '@/types';

// API Base URL - Backend server
const API_BASE_URL = 'http://localhost:8080/api';

// Helper to simulate API delay
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Generate unique IDs - DEPRECATED, use proper invoice number generation instead
const generateId = () => Math.random().toString(36).substring(2, 11);

// Proper Invoice Number Generation System
let invoiceCounter = 1;

// Initialize counter from localStorage or start from 1
const initializeInvoiceCounter = (): number => {
  try {
    const stored = localStorage.getItem('arpay_invoice_counter');
    if (stored) {
      const counter = parseInt(stored, 10);
      return isNaN(counter) ? 1 : counter;
    }
  } catch (error) {
    console.warn('Failed to load invoice counter from localStorage:', error);
  }
  return 1;
};

// Save counter to localStorage
const saveInvoiceCounter = (counter: number): void => {
  try {
    localStorage.setItem('arpay_invoice_counter', counter.toString());
  } catch (error) {
    console.warn('Failed to save invoice counter to localStorage:', error);
  }
};

// Generate proper invoice number in AR-26-XXX format
const generateInvoiceNumber = (): string => {
  invoiceCounter = initializeInvoiceCounter();
  const paddingLength = invoiceCounter < 1000 ? 3 :
                        invoiceCounter < 10000 ? 4 :
                        invoiceCounter < 100000 ? 5 : 6;
  const invoiceNumber = `AR-26-${invoiceCounter.toString().padStart(paddingLength, '0')}`;

  // Increment and save counter
  invoiceCounter++;
  saveInvoiceCounter(invoiceCounter);

  return invoiceNumber;
};

// ===== EXPENSE NUMBER GENERATION =====
let expenseCounter = 1;

// Initialize expense counter from localStorage
const initializeExpenseCounter = (): number => {
  try {
    const stored = localStorage.getItem('arpay_expense_counter');
    if (stored) {
      const counter = parseInt(stored, 10);
      return isNaN(counter) ? 1 : counter;
    }
  } catch (error) {
    console.warn('Failed to load expense counter from localStorage:', error);
  }
  return 1;
};

// Save expense counter to localStorage
const saveExpenseCounter = (counter: number): void => {
  try {
    localStorage.setItem('arpay_expense_counter', counter.toString());
  } catch (error) {
    console.warn('Failed to save expense counter to localStorage:', error);
  }
};

// Generate proper expense number in AR-EXP-XXX format
export const generateExpenseNumber = (): string => {
  expenseCounter = initializeExpenseCounter();
  const expenseNumber = `AR-EXP-${expenseCounter.toString().padStart(3, '0')}`;

  // Increment and save counter
  expenseCounter++;
  saveExpenseCounter(expenseCounter);

  return expenseNumber;
};

// Utility function to clean up old invoice data with random IDs
export const cleanupOldInvoiceData = (): void => {
  try {
    const stored = localStorage.getItem('arpay_invoices');
    if (stored) {
      const oldInvoices = JSON.parse(stored);
      // Filter out invoices with random UUID/string patterns
      const cleanedInvoices = oldInvoices.filter((invoice: Invoice) =>
        invoice.id.startsWith('AR-26-') || invoice.id.startsWith('INV-')
      );

      if (cleanedInvoices.length !== oldInvoices.length) {
        console.log(`Cleaned up ${oldInvoices.length - cleanedInvoices.length} invoices with random IDs`);
        localStorage.setItem('arpay_invoices', JSON.stringify(cleanedInvoices));
      }
    }
  } catch (error) {
    console.warn('Error cleaning up old invoice data:', error);
  }
};

// Utility function to reset invoice counter (for admin use)
export const resetInvoiceCounter = (newStartNumber: number = 1): void => {
  saveInvoiceCounter(newStartNumber);
  console.log(`Invoice counter reset to ${newStartNumber}`);
};


// Mock Data Storage (in-memory with localStorage persistence)
let invoices: Invoice[] = [];

// Helper functions for invoice localStorage
const getStoredInvoices = (): Invoice[] => {
  try {
    const stored = localStorage.getItem('arpay_invoices');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to load invoices from localStorage:', error);
    return [];
  }
};

const saveInvoicesToStorage = (invoicesData: Invoice[]): void => {
  try {
    localStorage.setItem('arpay_invoices', JSON.stringify(invoicesData));
  } catch (error) {
    console.warn('Failed to save invoices to localStorage:', error);
  }
};

// Initialize invoices from localStorage
invoices = getStoredInvoices();

// Clean up any old data with random IDs on initialization
cleanupOldInvoiceData();

// Initialize expenses from localStorage or use default data
const defaultExpenses: Expense[] = [
  { id: 'EXP-001', category: 'TRAVEL' as any, amount: 450, date: '2024-01-10', notes: 'Client meeting in NYC', status: 'APPROVED' as any, paymentMode: 'CARD' as any },
  { id: 'EXP-002', category: 'OFFICE' as any, amount: 120, date: '2024-01-12', notes: 'Office supplies', status: 'APPROVED' as any, paymentMode: 'CASH' as any },
  { id: 'EXP-003', category: 'MARKETING' as any, amount: 2500, date: '2024-01-15', notes: 'Digital ads campaign', status: 'PENDING' as any, paymentMode: 'BANK_TRANSFER' as any },
  { id: 'EXP-004', category: 'EQUIPMENT' as any, amount: 1800, date: '2024-01-18', notes: 'New laptop', status: 'PENDING' as any, paymentMode: 'CARD' as any },
  { id: 'EXP-005', category: 'SALARY' as any, amount: 5000, date: '2024-01-25', notes: 'Monthly salary', status: 'APPROVED' as any, paymentMode: 'BANK_TRANSFER' as any },
  { id: 'EXP-006', category: 'FUEL' as any, amount: 350, date: '2024-01-20', notes: 'Vehicle fuel', status: 'APPROVED' as any, paymentMode: 'CASH' as any },
  { id: 'EXP-007', category: 'VEHICLE' as any, amount: 800, date: '2024-01-22', notes: 'Car service', status: 'PENDING' as any, paymentMode: 'CARD' as any },
];

// Helper functions for localStorage
const getStoredExpenses = (): Expense[] => {
  try {
    const stored = localStorage.getItem('arpay_expenses');
    return stored ? JSON.parse(stored) : defaultExpenses;
  } catch (error) {
    console.warn('Failed to load expenses from localStorage:', error);
    return defaultExpenses;
  }
};

const saveExpensesToStorage = (expensesData: Expense[]): void => {
  try {
    localStorage.setItem('arpay_expenses', JSON.stringify(expensesData));
  } catch (error) {
    console.warn('Failed to save expenses to localStorage:', error);
  }
};

let expenses: Expense[] = getStoredExpenses();

let payments: Payment[] = [
  { id: 'PAY-001', invoiceId: 'INV-001', amount: 5000, method: 'Bank Transfer', status: 'Completed', date: '2024-01-20' },
  { id: 'PAY-002', invoiceId: 'INV-002', amount: 1000, method: 'Credit Card', status: 'Pending', date: '2024-01-22' },
  { id: 'PAY-003', invoiceId: 'INV-004', amount: 2200, method: 'Check', status: 'Completed', date: '2024-01-25' },
];

let approvals: ApprovalRequest[] = [
  { id: 'APR-001', type: 'Expense', requestedBy: 'Jane Smith', amount: 2500, status: 'Pending', date: '2024-01-15', description: 'Marketing campaign budget', priority: 'Urgent' },
  { id: 'APR-002', type: 'Time Off', requestedBy: 'Bob Johnson', amount: 0, status: 'Pending', date: '2024-01-18', description: '3 days vacation', priority: 'Normal' },
  { id: 'APR-003', type: 'Budget', requestedBy: 'Alice Brown', amount: 15000, status: 'Pending', date: '2024-01-20', description: 'Q2 marketing budget increase', priority: 'Urgent' },
  { id: 'APR-004', type: 'Invoice', requestedBy: 'Mike Wilson', amount: 8500, status: 'Approved', date: '2024-01-10', description: 'New customer contract', priority: 'Normal' },
  { id: 'APR-005', type: 'Leave', requestedBy: 'Sarah Davis', amount: 0, status: 'Pending', date: '2024-01-22', description: 'Sick leave request', priority: 'Urgent' },
  { id: 'APR-006', type: 'Purchase', requestedBy: 'Tom Green', amount: 3200, status: 'Pending', date: '2024-01-23', description: 'Office equipment purchase', priority: 'Normal' },
];

let timeEntries: TimeEntry[] = [
  { id: 'TIME-001', project: 'Website Redesign', userId: '1', userName: 'John Doe', startTime: '09:00', endTime: '12:00', hours: 3, date: '2024-01-25', description: 'Homepage mockups' },
  { id: 'TIME-002', project: 'Mobile App', userId: '2', userName: 'Jane Smith', startTime: '10:00', endTime: '16:00', hours: 6, date: '2024-01-25', description: 'API integration' },
  { id: 'TIME-003', project: 'Website Redesign', userId: '1', userName: 'John Doe', startTime: '13:00', endTime: '17:00', hours: 4, date: '2024-01-25', description: 'Responsive design' },
  { id: 'TIME-004', project: 'Client Portal', userId: '3', userName: 'Bob Johnson', startTime: '08:00', endTime: '15:00', hours: 7, date: '2024-01-24', description: 'Dashboard components' },
];

let notifications: Notification[] = [
  { id: 'NOT-001', message: 'Invoice INV-003 is overdue', priority: 'High', date: '2024-01-25', read: false, type: 'warning' },
  { id: 'NOT-002', message: 'New approval request from Jane Smith', priority: 'Medium', date: '2024-01-24', read: false, type: 'info' },
  { id: 'NOT-003', message: 'Payment received for INV-001', priority: 'Low', date: '2024-01-23', read: true, type: 'success' },
  { id: 'NOT-004', message: 'Time entry reminder: Log your hours', priority: 'Medium', date: '2024-01-22', read: false, type: 'info' },
];

// Invoice API - Connected to Backend
export const invoiceApi = {
  getAll: async (): Promise<Invoice[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/invoices?size=1000`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Backend returns PageResponse<InvoiceDTO>, extract content array
      const backendInvoices = data.content || data;

      // Transform lineItems and attachments from JSON strings to objects
      const transformedInvoices = backendInvoices.map((invoice: any) => ({
        ...invoice,
        clientName: invoice.customerName || invoice.clientName,
        lineItems: typeof invoice.lineItems === 'string' ? JSON.parse(invoice.lineItems) : invoice.lineItems || [],
        attachments: invoice.attachments && typeof invoice.attachments === 'string' ? JSON.parse(invoice.attachments) : invoice.attachments || [],
      }));

      // Save backend data to localStorage for offline access
      saveInvoicesToStorage(transformedInvoices);

      return transformedInvoices;
    } catch (error) {
      console.error('Error fetching invoices from backend, using local storage:', error);

      // Fallback: Return invoices from localStorage
      const localInvoices = getStoredInvoices();

      // Filter out any invoices with random UUID patterns (old bad data)
      const cleanedInvoices = localInvoices.filter(invoice =>
        invoice.id.startsWith('AR-26-') || invoice.id.startsWith('INV-')
      );

      if (cleanedInvoices.length !== localInvoices.length) {
        console.log('Cleaned up old invoices with random IDs');
        saveInvoicesToStorage(cleanedInvoices);
        invoices = cleanedInvoices;
      }

      return cleanedInvoices;
    }
  },
  getById: async (id: string): Promise<Invoice | undefined> => {
    try {
      const response = await fetch(`${API_BASE_URL}/invoices/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();

      // Transform lineItems and attachments from JSON strings to objects
      return {
        ...result,
        lineItems: typeof result.lineItems === 'string' ? JSON.parse(result.lineItems) : result.lineItems || [],
        attachments: result.attachments && typeof result.attachments === 'string' ? JSON.parse(result.attachments) : result.attachments || [],
      };
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return undefined;
    }
  },
  create: async (data: Omit<Invoice, 'id'>): Promise<Invoice> => {
    try {
      // Transform data to match backend expectations
      const transformedData = {
        ...data,
        clientName: data.clientName, // Map to customerName for backend compatibility
      };

      // Invoice number will be auto-generated by the backend
      const response = await fetch(`${API_BASE_URL}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();

      // Transform response back to frontend format
      return {
        ...result,
        clientName: result.customerName || result.clientName,
        lineItems: typeof result.lineItems === 'string' ? JSON.parse(result.lineItems) : result.lineItems || [],
        attachments: result.attachments && typeof result.attachments === 'string' ? JSON.parse(result.attachments) : result.attachments || [],
      };
    } catch (error) {
      console.error('Error creating invoice via backend, using fallback:', error);

      // FALLBACK: Create invoice locally with proper numbering when backend is unavailable
      const fallbackInvoice: Invoice = {
        ...data,
        id: generateInvoiceNumber(), // Use proper invoice numbering instead of random ID
      };

      // Save to local storage
      invoices = [...invoices, fallbackInvoice];
      saveInvoicesToStorage(invoices);

      console.log('Created invoice with fallback mechanism:', fallbackInvoice.id);
      return fallbackInvoice;
    }
  },
  update: async (id: string, data: Partial<Invoice>): Promise<Invoice> => {
    try {
      // Transform data to match backend expectations
      const transformedData = {
        ...data,
        // lineItems: data.lineItems, // Send as object/array
        // attachments: data.attachments, // Send as object/array
      };

      const response = await fetch(`${API_BASE_URL}/invoices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();

      // Transform response back to frontend format
      return {
        ...result,
        lineItems: typeof result.lineItems === 'string' ? JSON.parse(result.lineItems) : result.lineItems || [],
        attachments: result.attachments && typeof result.attachments === 'string' ? JSON.parse(result.attachments) : result.attachments || [],
      };
    } catch (error) {
      console.error('Error updating invoice via backend, using fallback:', error);

      // FALLBACK: Update invoice locally when backend is unavailable
      invoices = invoices.map(inv => inv.id === id ? { ...inv, ...data } : inv);
      saveInvoicesToStorage(invoices);
      const updatedInvoice = invoices.find(inv => inv.id === id);

      if (!updatedInvoice) {
        throw new Error('Invoice not found for update');
      }

      return updatedInvoice;
    }
  },
  delete: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/invoices/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting invoice via backend, using fallback:', error);

      // FALLBACK: Delete invoice locally when backend is unavailable
      invoices = invoices.filter(inv => inv.id !== id);
      saveInvoicesToStorage(invoices);
    }
  },
};

// Expense API
export const expenseApi = {
  getAll: async (): Promise<Expense[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/expenses`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Handle both direct array and PageResponse format
      const expenseList = Array.isArray(data) ? data : (data.content || []);

      // Transform attachments from JSON strings to objects if needed
      const transformedExpenses = expenseList.map((expense: any) => ({
        ...expense,
        attachments: expense.attachments && typeof expense.attachments === 'string' ? JSON.parse(expense.attachments) : expense.attachments || [],
      }));

      console.log('Expenses fetched from database:', transformedExpenses);
      return transformedExpenses;
    } catch (error) {
      console.error('Failed to fetch expenses from backend:', error);
      throw error;
    }
  },
  create: async (data: Omit<Expense, 'id'>): Promise<Expense> => {
    try {
      console.log('Creating expense in database:', data);

      const response = await fetch(`${API_BASE_URL}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const newExpense = await response.json();
      console.log('Expense created successfully:', newExpense);
      return newExpense;
    } catch (error) {
      console.error('Failed to create expense in backend:', error);
      throw error;
    }
  },
  update: async (id: string, data: Partial<Expense>): Promise<Expense> => {
    try {
      console.log('Updating expense in database:', id, data);

      const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const updatedExpense = await response.json();
      console.log('Expense updated successfully:', updatedExpense);
      return updatedExpense;
    } catch (error) {
      console.error('Failed to update expense in backend:', error);
      throw error;
    }
  },
  delete: async (id: string): Promise<void> => {
    try {
      console.log('Deleting expense from database:', id);

      const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      console.log('Expense deleted successfully:', id);
    } catch (error) {
      console.error('Failed to delete expense in backend:', error);
      throw error;
    }
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

// User API - Connected to Backend
export const userApi = {
  getAll: async (): Promise<User[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users?size=1000`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Backend returns PageResponse<UserDTO>, extract content array
      return data.content || data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },
  create: async (data: Omit<User, 'id'>): Promise<User> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },
  update: async (id: string, data: Partial<User>): Promise<User> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },
  disable: async (id: string): Promise<User> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}/status?status=INACTIVE`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error disabling user:', error);
      throw error;
    }
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
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    // Get unique active customers (customers with recent invoices)
    const activeCustomers = new Set(invoices.map(inv => inv.customerName)).size;

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


// Real Estate Projects Data (Ananta Realty)
let projects: Project[] = [
  {
    id: 'PRJ-GIRI-001',
    name: 'Ananta Giri',
    description: 'Premium residential plots and villas in prime location',
    customer: 'Ananta Realty',
    status: 'In Progress',
    priority: 'Critical',
    startDate: '2023-06-01',
    endDate: '2025-12-31',
    budget: 50000000,
    spent: 22500000,
    progress: 45,
    projectType: 'real-estate',
    teamMembers: ['John Doe', 'Jane Smith', 'Bob Johnson'],
    milestones: [
      { id: 'm1', name: 'Land Acquisition', dueDate: '2023-08-31', completed: true },
      { id: 'm2', name: 'Site Development', dueDate: '2024-03-31', completed: true },
      { id: 'm3', name: 'Phase 1 Construction', dueDate: '2024-12-31', completed: false },
      { id: 'm4', name: 'Phase 2 Construction', dueDate: '2025-06-30', completed: false },
      { id: 'm5', name: 'Project Completion', dueDate: '2025-12-31', completed: false },
    ],
  },
  {
    id: 'PRJ-NIDHI-001',
    name: 'Ananta Nidhi',
    description: 'Affordable housing community with modern amenities',
    customer: 'Ananta Realty',
    status: 'In Progress',
    priority: 'Critical',
    startDate: '2024-01-15',
    endDate: '2025-08-31',
    budget: 35000000,
    spent: 14000000,
    progress: 40,
    projectType: 'real-estate',
    teamMembers: ['Jane Smith', 'Bob Johnson', 'Alice Brown'],
    milestones: [
      { id: 'm1', name: 'Planning & Approvals', dueDate: '2024-02-28', completed: true },
      { id: 'm2', name: 'Infrastructure Setup', dueDate: '2024-05-31', completed: true },
      { id: 'm3', name: 'Phase 1 Construction', dueDate: '2024-10-31', completed: false },
      { id: 'm4', name: 'Phase 2 Construction', dueDate: '2025-04-30', completed: false },
      { id: 'm5', name: 'Handover & Completion', dueDate: '2025-08-31', completed: false },
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

// Project Master API - Connected to Backend
export const projectMasterApi = {
  getAll: async (): Promise<ProjectMaster[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/project-masters`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch project masters:', error);
      return [];
    }
  },

  getByProject: async (projectName: string): Promise<ProjectMaster[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/project-masters/by-project/${projectName}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch project masters by project:', error);
      return [];
    }
  },

  getByProperty: async (propertyName: string): Promise<ProjectMaster[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/project-masters/by-property/${propertyName}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch project masters by property:', error);
      return [];
    }
  },

  getUniquePlotNumbers: async (projectName: string): Promise<string[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/project-masters/unique/plots/${projectName}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch plot numbers:', error);
      return [];
    }
  },

  getUniqueProperties: async (projectName: string): Promise<string[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/project-masters/unique/properties/${projectName}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch properties:', error);
      return [];
    }
  },

  getPlotDetails: async (projectName: string, plotNumber: string): Promise<ProjectMaster | null> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/project-masters/plot-details?projectName=${projectName}&plotNumber=${plotNumber}`
      );
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch plot details:', error);
      return null;
    }
  },

  create: async (data: Omit<ProjectMaster, 'id'>): Promise<ProjectMaster> => {
    try {
      const response = await fetch(`${API_BASE_URL}/project-masters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If response is not JSON, use text
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
            }
          } catch (e2) {
            // Keep default message
          }
        }
        console.error('Backend error details:', errorMessage);
        throw new Error(errorMessage);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to create project master:', error);
      throw error;
    }
  },

  update: async (id: string, data: Partial<ProjectMaster>): Promise<ProjectMaster> => {
    try {
      const response = await fetch(`${API_BASE_URL}/project-masters/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to update project master:', error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/project-masters/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to delete project master:', error);
      throw error;
    }
  },

  bulkCreate: async (data: Array<Omit<ProjectMaster, 'id'>>): Promise<ProjectMaster[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/project-masters/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to bulk create project masters:', error);
      throw error;
    }
  },
};

// Real Estate Project Details Mock Data
const realEstateProjects: Record<string, any> = {
  'PRJ-GIRI-001': {
    id: 'PRJ-GIRI-001',
    projectName: 'Ananta Giri',
    projectLocation: 'Hyderabad, Telangana',
    totalArea: 250,
    launchDate: '2023-06-01',
    expectedCompletionDate: '2025-12-31',
    totalBudget: 50000000,
    totalExpenses: 22500000,
    totalSalesValue: 58000000,
    totalUnitsAvailable: 120,
    totalUnitsSold: 45,
    salesInProgress: 15,
    salesPending: 20,
    salesRejected: 2,
    timeline: [
      { phase: 'Land Acquisition', startDate: '2023-06-01', endDate: '2023-08-31', status: 'completed' },
      { phase: 'Site Development', startDate: '2023-09-01', endDate: '2024-03-31', status: 'completed' },
      { phase: 'Phase 1 Construction', startDate: '2024-04-01', endDate: '2024-12-31', status: 'ongoing' },
      { phase: 'Phase 2 Construction', startDate: '2025-01-01', endDate: '2025-09-30', status: 'planned' },
      { phase: 'Final Handover', startDate: '2025-10-01', endDate: '2025-12-31', status: 'planned' },
    ],
    sales: [
      { id: 's1', plotNumber: 'GIRI-A-101', buyerName: 'Rajesh Kumar', saleAmount: 1200000, status: 'completed', saleDate: '2023-09-15', paymentReceived: 1200000, remainingAmount: 0 },
      { id: 's2', plotNumber: 'GIRI-A-102', buyerName: 'Priya Sharma', saleAmount: 1150000, status: 'completed', saleDate: '2023-10-20', paymentReceived: 1150000, remainingAmount: 0 },
      { id: 's3', plotNumber: 'GIRI-A-103', buyerName: 'Amit Patel', saleAmount: 1180000, status: 'in-progress', saleDate: '2024-01-10', paymentReceived: 600000, remainingAmount: 580000 },
      { id: 's4', plotNumber: 'GIRI-A-104', buyerName: 'Neha Singh', saleAmount: 1200000, status: 'in-progress', saleDate: '2024-02-05', paymentReceived: 400000, remainingAmount: 800000 },
      { id: 's5', plotNumber: 'GIRI-A-105', buyerName: 'Vikram Reddy', saleAmount: 1160000, status: 'pending', saleDate: '2024-03-01', paymentReceived: 200000, remainingAmount: 960000 },
      { id: 's6', plotNumber: 'GIRI-A-106', buyerName: 'Anjali Verma', saleAmount: 1210000, status: 'pending', saleDate: '2024-03-15', paymentReceived: 0, remainingAmount: 1210000 },
      { id: 's7', plotNumber: 'GIRI-B-101', buyerName: 'Cancelled Buyer', saleAmount: 1200000, status: 'rejected', saleDate: '2023-12-20', paymentReceived: 300000, remainingAmount: 900000 },
    ],
    expenses: [
      { category: 'Land Acquisition', amount: 12000000, date: '2023-08-31' },
      { category: 'Site Development', amount: 4500000, date: '2024-03-31' },
      { category: 'Labor & Materials', amount: 3200000, date: '2024-09-30' },
      { category: 'Equipment & Machinery', amount: 1800000, date: '2024-08-15' },
      { category: 'Administration & Overhead', amount: 1000000, date: '2024-09-30' },
    ],
  },
  'PRJ-NIDHI-001': {
    id: 'PRJ-NIDHI-001',
    projectName: 'Ananta Nidhi',
    projectLocation: 'Bangalore, Karnataka',
    totalArea: 180,
    launchDate: '2024-01-15',
    expectedCompletionDate: '2025-08-31',
    totalBudget: 35000000,
    totalExpenses: 14000000,
    totalSalesValue: 42000000,
    totalUnitsAvailable: 200,
    totalUnitsSold: 68,
    salesInProgress: 25,
    salesPending: 35,
    salesRejected: 3,
    timeline: [
      { phase: 'Planning & Approvals', startDate: '2024-01-15', endDate: '2024-02-28', status: 'completed' },
      { phase: 'Infrastructure Setup', startDate: '2024-03-01', endDate: '2024-05-31', status: 'completed' },
      { phase: 'Phase 1 Construction', startDate: '2024-06-01', endDate: '2024-10-31', status: 'ongoing' },
      { phase: 'Phase 2 Construction', startDate: '2024-11-01', endDate: '2025-04-30', status: 'ongoing' },
      { phase: 'Handover & Completion', startDate: '2025-05-01', endDate: '2025-08-31', status: 'planned' },
    ],
    sales: [
      { id: 's1', plotNumber: 'NIDHI-101', buyerName: 'Suresh Rao', saleAmount: 650000, status: 'completed', saleDate: '2024-02-10', paymentReceived: 650000, remainingAmount: 0 },
      { id: 's2', plotNumber: 'NIDHI-102', buyerName: 'Deepika Gupta', saleAmount: 680000, status: 'completed', saleDate: '2024-02-25', paymentReceived: 680000, remainingAmount: 0 },
      { id: 's3', plotNumber: 'NIDHI-103', buyerName: 'Rohit Nair', saleAmount: 670000, status: 'in-progress', saleDate: '2024-04-01', paymentReceived: 350000, remainingAmount: 320000 },
      { id: 's4', plotNumber: 'NIDHI-104', buyerName: 'Meera Singh', saleAmount: 685000, status: 'in-progress', saleDate: '2024-04-10', paymentReceived: 250000, remainingAmount: 435000 },
      { id: 's5', plotNumber: 'NIDHI-105', buyerName: 'Arjun Desai', saleAmount: 675000, status: 'pending', saleDate: '2024-05-01', paymentReceived: 150000, remainingAmount: 525000 },
      { id: 's6', plotNumber: 'NIDHI-106', buyerName: 'Chitra Iyer', saleAmount: 700000, status: 'pending', saleDate: '2024-05-15', paymentReceived: 0, remainingAmount: 700000 },
      { id: 's7', plotNumber: 'NIDHI-107', buyerName: 'Cancelled Buyer', saleAmount: 680000, status: 'rejected', saleDate: '2024-01-20', paymentReceived: 200000, remainingAmount: 480000 },
    ],
    expenses: [
      { category: 'Land & Approvals', amount: 8000000, date: '2024-02-28' },
      { category: 'Infrastructure', amount: 3500000, date: '2024-05-31' },
      { category: 'Construction Materials', amount: 1800000, date: '2024-09-30' },
      { category: 'Labor Costs', amount: 600000, date: '2024-09-30' },
      { category: 'Administration', amount: 100000, date: '2024-09-30' },
    ],
  },
};

// Real Estate Project API
export const realEstateProjectApi = {
  getDetails: async (projectId: string): Promise<any> => {
    await delay();
    return realEstateProjects[projectId] || null;
  },
  getSalesMetrics: async (projectId: string): Promise<any> => {
    await delay();
    const project = realEstateProjects[projectId];
    if (!project) return null;
    return {
      totalSalesValue: project.totalSalesValue,
      totalUnitsAvailable: project.totalUnitsAvailable,
      totalUnitsSold: project.totalUnitsSold,
      salesInProgress: project.salesInProgress,
      salesPending: project.salesPending,
      salesRejected: project.salesRejected,
      conversionRate: ((project.totalUnitsSold / project.totalUnitsAvailable) * 100).toFixed(1),
      sales: project.sales,
    };
  },
  getExpensesMetrics: async (projectId: string): Promise<any> => {
    await delay();
    const project = realEstateProjects[projectId];
    if (!project) return null;
    return {
      totalBudget: project.totalBudget,
      totalExpenses: project.totalExpenses,
      remainingBudget: project.totalBudget - project.totalExpenses,
      budgetUtilization: ((project.totalExpenses / project.totalBudget) * 100).toFixed(1),
      expenses: project.expenses,
    };
  },
  getTimelineMetrics: async (projectId: string): Promise<any> => {
    await delay();
    const project = realEstateProjects[projectId];
    if (!project) return null;
    const totalPhases = project.timeline.length;
    const completedPhases = project.timeline.filter((p: any) => p.status === 'completed').length;
    return {
      timeline: project.timeline,
      totalPhases,
      completedPhases,
      completionPercentage: ((completedPhases / totalPhases) * 100).toFixed(1),
      launchDate: project.launchDate,
      expectedCompletionDate: project.expectedCompletionDate,
    };
  },
};
