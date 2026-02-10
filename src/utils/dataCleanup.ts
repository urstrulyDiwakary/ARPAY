// Data Cleanup Utilities for ARPAY
// Use these functions in the browser console to clean up old invoice data

export const cleanupUtilities = {
  // Clear all invoices with random IDs and reset counter
  cleanupAllInvoices: (): void => {
    try {
      console.log('🧹 Starting invoice cleanup...');

      // Get current invoices from localStorage
      const stored = localStorage.getItem('arpay_invoices');
      const invoices = stored ? JSON.parse(stored) : [];

      console.log(`📊 Found ${invoices.length} invoices in storage`);

      // Filter out invoices with random UUID/string patterns
      const cleanedInvoices = invoices.filter((invoice: any) =>
        invoice.id.startsWith('AR-26-') || invoice.id.startsWith('INV-')
      );

      const removedCount = invoices.length - cleanedInvoices.length;

      if (removedCount > 0) {
        console.log(`🗑️ Removing ${removedCount} invoices with random IDs`);
        localStorage.setItem('arpay_invoices', JSON.stringify(cleanedInvoices));
      }

      // Reset invoice counter to start fresh
      localStorage.setItem('arpay_invoice_counter', '1');

      console.log('✅ Cleanup complete!');
      console.log(`📈 Kept ${cleanedInvoices.length} valid invoices`);
      console.log('🔢 Invoice counter reset to 1');

      // Reload page to see changes
      console.log('🔄 Reloading page to reflect changes...');
      setTimeout(() => window.location.reload(), 1000);

    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  },

  // Just remove bad invoices, keep the counter
  removeInvalidInvoices: (): void => {
    try {
      console.log('🧹 Removing invalid invoices...');

      const stored = localStorage.getItem('arpay_invoices');
      const invoices = stored ? JSON.parse(stored) : [];

      const cleanedInvoices = invoices.filter((invoice: any) =>
        invoice.id.startsWith('AR-26-') || invoice.id.startsWith('INV-')
      );

      const removedCount = invoices.length - cleanedInvoices.length;

      if (removedCount > 0) {
        localStorage.setItem('arpay_invoices', JSON.stringify(cleanedInvoices));
        console.log(`✅ Removed ${removedCount} invalid invoices`);
        setTimeout(() => window.location.reload(), 1000);
      } else {
        console.log('✅ No invalid invoices found');
      }

    } catch (error) {
      console.error('❌ Error removing invalid invoices:', error);
    }
  },

  // Reset only the invoice counter
  resetInvoiceCounter: (startFrom: number = 1): void => {
    try {
      localStorage.setItem('arpay_invoice_counter', startFrom.toString());
      console.log(`✅ Invoice counter reset to ${startFrom}`);
    } catch (error) {
      console.error('❌ Error resetting counter:', error);
    }
  },

  // View current data status
  checkDataStatus: (): void => {
    try {
      console.log('📊 Current Data Status:');
      console.log('='.repeat(50));

      // Check invoices
      const stored = localStorage.getItem('arpay_invoices');
      const invoices = stored ? JSON.parse(stored) : [];

      console.log(`📄 Total invoices: ${invoices.length}`);

      const validInvoices = invoices.filter((inv: any) =>
        inv.id.startsWith('AR-26-') || inv.id.startsWith('INV-')
      );

      const invalidInvoices = invoices.filter((inv: any) =>
        !inv.id.startsWith('AR-26-') && !inv.id.startsWith('INV-')
      );

      console.log(`✅ Valid invoices: ${validInvoices.length}`);
      console.log(`❌ Invalid invoices: ${invalidInvoices.length}`);

      if (invalidInvoices.length > 0) {
        console.log('❌ Invalid invoice IDs found:');
        invalidInvoices.forEach((inv: any) => {
          console.log(`   - ${inv.id} (${inv.clientName})`);
        });
      }

      // Check counter
      const counter = localStorage.getItem('arpay_invoice_counter');
      console.log(`🔢 Current invoice counter: ${counter || 'not set'}`);

      console.log('='.repeat(50));

    } catch (error) {
      console.error('❌ Error checking data status:', error);
    }
  },

  // Clear all data (use with caution!)
  clearAllData: (): void => {
    if (confirm('⚠️ This will clear ALL invoice data! Are you sure?')) {
      localStorage.removeItem('arpay_invoices');
      localStorage.removeItem('arpay_invoice_counter');
      console.log('🗑️ All invoice data cleared!');
      setTimeout(() => window.location.reload(), 1000);
    }
  }
};

// Make it available globally for console access
(window as any).arpayCleanup = cleanupUtilities;

console.log('🛠️ ARPAY Cleanup utilities loaded!');
console.log('📝 Use arpayCleanup.checkDataStatus() to see current data');
console.log('🧹 Use arpayCleanup.cleanupAllInvoices() to clean up and reset');
console.log('🔍 Use arpayCleanup.removeInvalidInvoices() to just remove bad data');
