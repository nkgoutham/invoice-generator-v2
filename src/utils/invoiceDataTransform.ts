/**
 * Invoice Data Transformation Layer
 * 
 * This file contains functions to transform invoice data between different formats
 * based on engagement types. It handles the conversion of generic invoice data
 * into specialized formats for different engagement types, ensuring consistent
 * display and calculation across the application.
 */

import { InvoicePreviewData } from "../types/invoice";

/**
 * Transform invoice data based on engagement type
 * This is the main function that dispatches to type-specific transformers
 */
export function transformInvoiceData(data: InvoicePreviewData): InvoicePreviewData {
  const engagementType = data.invoice.engagement_type;

  switch (engagementType) {
    case 'retainership':
      return transformRetainershipInvoiceData(data);
    case 'project':
      return transformProjectInvoiceData(data);
    case 'milestone':
      return transformMilestoneInvoiceData(data);
    case 'service':
    default:
      return transformServiceInvoiceData(data);
  }
}

/**
 * Transform invoice data for service-based engagements
 */
function transformServiceInvoiceData(data: InvoicePreviewData): InvoicePreviewData {
  // For service-based invoices, most of the data is already in the correct format
  // Just ensure that the items array is properly structured
  return {
    ...data,
    invoice: {
      ...data.invoice,
      items: data.invoice.items?.map(item => ({
        ...item,
        // Ensure all numeric values are properly formatted
        quantity: Number(item.quantity) || 0,
        rate: Number(item.rate) || 0,
        amount: Number(item.amount) || 0
      })) || []
    }
  };
}

/**
 * Transform invoice data for retainership engagements
 */
function transformRetainershipInvoiceData(data: InvoicePreviewData): InvoicePreviewData {
  // For retainership, ensure we have a properly structured item
  // Retainerships typically have a single line item
  if (!data.invoice.items || data.invoice.items.length === 0) {
    // Create a default item if none exists
    return {
      ...data,
      invoice: {
        ...data.invoice,
        items: [{
          description: 'Monthly Retainer Fee',
          quantity: 1,
          rate: data.invoice.subtotal || 0,
          amount: data.invoice.subtotal || 0
        }]
      }
    };
  }
  
  // Make sure the first item is properly structured
  const firstItem = data.invoice.items[0];
  const items = [{
    description: firstItem.description || 'Monthly Retainer Fee',
    quantity: 1,
    rate: firstItem.rate || data.invoice.subtotal || 0,
    amount: firstItem.amount || data.invoice.subtotal || 0
  }];
  
  return {
    ...data,
    invoice: {
      ...data.invoice,
      items: items
    }
  };
}

/**
 * Transform invoice data for project-based engagements
 */
function transformProjectInvoiceData(data: InvoicePreviewData): InvoicePreviewData {
  // For projects, ensure we have a properly structured item
  // Projects typically have a single line item
  if (!data.invoice.items || data.invoice.items.length === 0) {
    // Create a default item if none exists
    return {
      ...data,
      invoice: {
        ...data.invoice,
        items: [{
          description: 'Project Fee',
          quantity: 1,
          rate: data.invoice.subtotal || 0,
          amount: data.invoice.subtotal || 0
        }]
      }
    };
  }
  
  // Make sure the first item is properly structured
  const firstItem = data.invoice.items[0];
  const items = [{
    description: firstItem.description || 'Project Fee',
    quantity: 1,
    rate: firstItem.rate || data.invoice.subtotal || 0,
    amount: firstItem.amount || data.invoice.subtotal || 0
  }];
  
  return {
    ...data,
    invoice: {
      ...data.invoice,
      items: items
    }
  };
}

/**
 * Transform invoice data for milestone-based engagements
 */
function transformMilestoneInvoiceData(data: InvoicePreviewData): InvoicePreviewData {
  // For milestone-based invoices, ensure milestones array is properly structured
  if (!data.invoice.milestones || data.invoice.milestones.length === 0) {
    // If no milestones, create a default one based on subtotal
    return {
      ...data,
      invoice: {
        ...data.invoice,
        milestones: [{
          name: 'Project Milestone',
          amount: data.invoice.subtotal || 0
        }]
      }
    };
  }
  
  // Ensure all milestone amounts are properly formatted
  const milestones = data.invoice.milestones.map(milestone => ({
    name: milestone.name || 'Milestone',
    amount: Number(milestone.amount) || 0
  }));
  
  return {
    ...data,
    invoice: {
      ...data.invoice,
      milestones: milestones
    }
  };
}

/**
 * Normalize invoice data to ensure all required fields are present
 * This is useful for validation before saving or displaying
 */
export function normalizeInvoiceData(data: Partial<InvoicePreviewData>): InvoicePreviewData {
  // Provide default values for any missing fields
  return {
    issuer: {
      business_name: data.issuer?.business_name || 'Your Business',
      address: data.issuer?.address || '',
      pan_number: data.issuer?.pan_number,
      phone: data.issuer?.phone,
      logo_url: data.issuer?.logo_url,
      primary_color: data.issuer?.primary_color || '#3B82F6',
      secondary_color: data.issuer?.secondary_color || '#0EA5E9',
      footer_text: data.issuer?.footer_text || 'Thank you for your business!'
    },
    client: {
      name: data.client?.name || '',
      company_name: data.client?.company_name,
      billing_address: data.client?.billing_address,
      email: data.client?.email,
      phone: data.client?.phone,
      gst_number: data.client?.gst_number
    },
    banking: data.banking,
    invoice: {
      invoice_number: data.invoice?.invoice_number || '',
      issue_date: data.invoice?.issue_date || new Date().toISOString().split('T')[0],
      due_date: data.invoice?.due_date || '',
      subtotal: Number(data.invoice?.subtotal) || 0,
      tax: Number(data.invoice?.tax) || 0,
      total: Number(data.invoice?.total) || 0,
      notes: data.invoice?.notes,
      currency: data.invoice?.currency || 'INR',
      tax_percentage: Number(data.invoice?.tax_percentage) || 0,
      engagement_type: data.invoice?.engagement_type || 'service',
      items: data.invoice?.items || [],
      milestones: data.invoice?.milestones || [],
      payment_date: data.invoice?.payment_date,
      payment_method: data.invoice?.payment_method,
      payment_reference: data.invoice?.payment_reference,
      is_partially_paid: data.invoice?.is_partially_paid || false,
      partially_paid_amount: data.invoice?.partially_paid_amount,
      status: data.invoice?.status || 'draft'
    }
  };
}