// Edge function to handle scheduled tasks such as:
// - Generating recurring invoices
// - Sending invoice reminders

import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2.39.0';

// Types (simplified versions of what's in the frontend)
interface RecurringInvoice {
  id: string;
  user_id: string;
  client_id: string;
  title: string;
  frequency: string;
  start_date: string;
  end_date: string | null;
  next_issue_date: string;
  last_generated: string | null;
  status: string;
  template_data: any;
  auto_send: boolean;
}

interface Invoice {
  id: string;
  due_date: string;
  status: string;
  next_reminder_date: string | null;
  last_reminder_sent: string | null;
}

// Create Supabase client using env vars
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      persistSession: false,
    }
  }
);

Deno.serve(async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Process tasks
    const result = await Promise.allSettled([
      processRecurringInvoices(supabaseClient, today),
      processInvoiceReminders(supabaseClient, today)
    ]);
    
    // Extract results and errors
    const recurringResult = result[0].status === 'fulfilled' ? result[0].value : { error: result[0].reason };
    const remindersResult = result[1].status === 'fulfilled' ? result[1].value : { error: result[1].reason };
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        timestamp: new Date().toISOString(),
        recurringInvoices: recurringResult,
        invoiceReminders: remindersResult
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error('Error processing scheduled tasks:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

// Function to process recurring invoices
async function processRecurringInvoices(supabase: SupabaseClient, today: Date) {
  // Format today as YYYY-MM-DD for database query
  const todayStr = today.toISOString().split('T')[0];
  
  // Find all active recurring invoices due for generation
  const { data: dueInvoices, error: fetchError } = await supabase
    .from('recurring_invoices')
    .select('*')
    .eq('status', 'active')
    .lte('next_issue_date', todayStr);
  
  if (fetchError) {
    throw new Error(`Error fetching recurring invoices: ${fetchError.message}`);
  }
  
  if (!dueInvoices || dueInvoices.length === 0) {
    return { processed: 0, message: 'No recurring invoices due for generation' };
  }
  
  // Process each recurring invoice
  const results = await Promise.all(
    dueInvoices.map(async (recurringInvoice: RecurringInvoice) => {
      try {
        // Check if we've reached the end date
        if (recurringInvoice.end_date && new Date(recurringInvoice.end_date) < today) {
          // Update status to inactive
          await supabase
            .from('recurring_invoices')
            .update({ status: 'inactive' })
            .eq('id', recurringInvoice.id);
          
          return { id: recurringInvoice.id, result: 'deactivated', reason: 'End date reached' };
        }
        
        // Generate a new invoice from template
        const templateData = recurringInvoice.template_data;
        const invoiceData = templateData.invoice_data;
        
        // Generate invoice number with current date
        const date = new Date();
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const invoiceNumber = `INV-${year}-${month}-${random}`;
        
        // Set issue date to today and calculate due date (15 days from today)
        const issueDate = todayStr;
        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + 15);
        const dueDateStr = dueDate.toISOString().split('T')[0];
        
        // Create the new invoice
        const { data: newInvoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            ...invoiceData,
            invoice_number: invoiceNumber,
            issue_date: issueDate,
            due_date: dueDateStr,
            status: recurringInvoice.auto_send ? 'sent' : 'draft'
          })
          .select()
          .single();
        
        if (invoiceError) {
          throw new Error(`Error creating invoice: ${invoiceError.message}`);
        }
        
        // Create invoice items
        const invoiceItems = templateData.invoice_items.map((item: any) => ({
          ...item,
          invoice_id: newInvoice.id
        }));
        
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(invoiceItems);
        
        if (itemsError) {
          throw new Error(`Error creating invoice items: ${itemsError.message}`);
        }
        
        // Calculate next issue date based on frequency
        let nextIssueDate = new Date(recurringInvoice.next_issue_date);
        
        switch(recurringInvoice.frequency) {
          case 'weekly':
            nextIssueDate.setDate(nextIssueDate.getDate() + 7);
            break;
          case 'monthly':
            nextIssueDate.setMonth(nextIssueDate.getMonth() + 1);
            break;
          case 'quarterly':
            nextIssueDate.setMonth(nextIssueDate.getMonth() + 3);
            break;
          case 'yearly':
            nextIssueDate.setFullYear(nextIssueDate.getFullYear() + 1);
            break;
        }
        
        // Update recurring invoice
        await supabase
          .from('recurring_invoices')
          .update({
            next_issue_date: nextIssueDate.toISOString().split('T')[0],
            last_generated: todayStr
          })
          .eq('id', recurringInvoice.id);
        
        return { 
          id: recurringInvoice.id, 
          result: 'success', 
          invoiceId: newInvoice.id, 
          nextDate: nextIssueDate.toISOString().split('T')[0]
        };
      } catch (error) {
        console.error(`Error processing recurring invoice ${recurringInvoice.id}:`, error);
        return { id: recurringInvoice.id, result: 'error', error: error.message };
      }
    })
  );
  
  return { 
    processed: results.length,
    successful: results.filter(r => r.result === 'success').length,
    deactivated: results.filter(r => r.result === 'deactivated').length,
    failed: results.filter(r => r.result === 'error').length,
    details: results
  };
}

// Function to process invoice reminders
async function processInvoiceReminders(supabase: SupabaseClient, today: Date) {
  // Format today as YYYY-MM-DD for database query
  const todayStr = today.toISOString().split('T')[0];
  
  // Find all reminder settings
  const { data: allReminderSettings, error: settingsError } = await supabase
    .from('invoice_reminders')
    .select('*')
    .eq('enabled', true);
  
  if (settingsError) {
    throw new Error(`Error fetching reminder settings: ${settingsError.message}`);
  }
  
  if (!allReminderSettings || allReminderSettings.length === 0) {
    return { processed: 0, message: 'No active reminder settings found' };
  }
  
  // Find all invoices that need reminders (those with next_reminder_date <= today)
  const { data: dueReminders, error: remindersError } = await supabase
    .from('invoices')
    .select('*, clients(*)')
    .in('status', ['sent', 'partially_paid', 'overdue'])
    .lte('next_reminder_date', todayStr);
  
  if (remindersError) {
    throw new Error(`Error fetching invoices for reminders: ${remindersError.message}`);
  }
  
  if (!dueReminders || dueReminders.length === 0) {
    return { processed: 0, message: 'No invoices due for reminders' };
  }
  
  // Process each invoice that needs a reminder
  const reminderResults = await Promise.all(
    dueReminders.map(async (invoice: any) => {
      try {
        // Get reminder settings for this invoice's user
        const userSettings = allReminderSettings.find(
          (setting: any) => setting.user_id === invoice.user_id
        );
        
        if (!userSettings) {
          return { 
            id: invoice.id, 
            result: 'skipped', 
            reason: 'No reminder settings for user' 
          };
        }
        
        // Find out if this is a before or after due date reminder
        const dueDate = new Date(invoice.due_date);
        dueDate.setHours(0, 0, 0, 0);
        
        const daysDifference = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Determine the reminder type and prepare email content
        let reminderType = '';
        if (daysDifference < 0) {
          // Before due date
          reminderType = 'before';
        } else if (daysDifference >= 0) {
          // After due date (overdue)
          reminderType = 'after';
        }
        
        // Prepare email content
        let subject = userSettings.reminder_subject
          .replace('{invoice_number}', invoice.invoice_number)
          .replace('{amount}', getFormattedAmount(invoice))
          .replace('{status}', getInvoiceStatus(invoice, daysDifference));
        
        let message = userSettings.reminder_message
          .replace('{invoice_number}', invoice.invoice_number)
          .replace('{amount}', getFormattedAmount(invoice))
          .replace('{due_date}', formatDate(invoice.due_date))
          .replace('{status}', getInvoiceStatus(invoice, daysDifference));
        
        // In a real implementation, this would send an email using a service
        // For this example, we'll just update the reminder tracking fields
        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            last_reminder_sent: todayStr,
            next_reminder_date: calculateNextReminderDate(invoice, userSettings, daysDifference)
          })
          .eq('id', invoice.id);
        
        if (updateError) {
          throw new Error(`Error updating invoice reminder tracking: ${updateError.message}`);
        }
        
        return { 
          id: invoice.id, 
          result: 'success', 
          type: reminderType,
          // Normally we'd include the sent email details here
          sentTo: invoice.clients.email,
          subject
        };
      } catch (error) {
        console.error(`Error processing reminder for invoice ${invoice.id}:`, error);
        return { id: invoice.id, result: 'error', error: error.message };
      }
    })
  );
  
  return { 
    processed: reminderResults.length,
    successful: reminderResults.filter(r => r.result === 'success').length,
    skipped: reminderResults.filter(r => r.result === 'skipped').length,
    failed: reminderResults.filter(r => r.result === 'error').length,
    details: reminderResults
  };
}

// Helper function to format currency amount
function getFormattedAmount(invoice: any): string {
  const currency = invoice.currency === 'USD' ? '$' : '₹';
  return `${currency}${invoice.total.toFixed(2)}`;
}

// Helper function to get human-readable status for email
function getInvoiceStatus(invoice: any, daysDifference: number): string {
  if (daysDifference < 0) {
    return `due in ${Math.abs(daysDifference)} days`;
  } else if (daysDifference === 0) {
    return 'due today';
  } else {
    return `overdue by ${daysDifference} days`;
  }
}

// Helper function to format date
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// Calculate the next reminder date based on reminder settings
function calculateNextReminderDate(
  invoice: Invoice, 
  settings: any, 
  currentDaysDifference: number
): string | null {
  const dueDate = new Date(invoice.due_date);
  let nextReminderDays = null;
  
  if (currentDaysDifference < 0) {
    // We're before the due date, find the next "days before" reminder
    // Sort days in descending order (furthest from due date first)
    const daysBefore = [...settings.days_before_due].sort((a, b) => b - a);
    
    // Find the next reminder day that's closer to the due date than current
    const absCurrentDiff = Math.abs(currentDaysDifference);
    nextReminderDays = daysBefore.find(days => days < absCurrentDiff);
    
    if (nextReminderDays !== undefined) {
      const nextDate = new Date(dueDate);
      nextDate.setDate(nextDate.getDate() - nextReminderDays);
      return nextDate.toISOString().split('T')[0];
    }
    
    // If no more before-due reminders, set next reminder to first after-due day
    if (settings.days_after_due.length > 0) {
      const nextDate = new Date(dueDate);
      nextDate.setDate(nextDate.getDate() + Math.min(...settings.days_after_due));
      return nextDate.toISOString().split('T')[0];
    }
  } else {
    // We're after the due date, find the next "days after" reminder
    // Sort days in ascending order (closest to due date first)
    const daysAfter = [...settings.days_after_due].sort((a, b) => a - b);
    
    // Find the next reminder day that's further from the due date than current
    nextReminderDays = daysAfter.find(days => days > currentDaysDifference);
    
    if (nextReminderDays !== undefined) {
      const nextDate = new Date(dueDate);
      nextDate.setDate(nextDate.getDate() + nextReminderDays);
      return nextDate.toISOString().split('T')[0];
    }
  }
  
  // No more reminders scheduled
  return null;
}