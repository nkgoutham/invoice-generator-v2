import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// Define types
export interface Expense {
  id: string;
  created_at?: string;
  user_id: string;
  date: string;
  amount: number;
  description: string;
  category_id?: string | null;
  client_id?: string | null;
  invoice_id?: string | null;
  is_recurring?: boolean;
  recurring_frequency?: string | null;
  receipt_url?: string | null;
  notes?: string | null;
  is_billable?: boolean;
  is_reimbursable?: boolean;
  reimbursed?: boolean;
  payment_method?: string | null;
  currency: string;
  employee_id?: string | null;
  is_salary?: boolean;
  salary_type?: string | null;
  hours_worked?: number | null;
  category?: ExpenseCategory;
  client?: {
    name: string;
    company_name?: string;
  };
  employee?: {
    name: string;
    designation?: string;
    hourly_rate?: number;
    monthly_salary?: number;
    currency_preference?: string;
  };
}

export interface ExpenseCategory {
  id: string;
  created_at?: string;
  user_id: string;
  name: string;
  description?: string | null;
  color: string;
}

interface ExpenseState {
  expenses: Expense[];
  selectedExpense: Expense | null;
  categories: ExpenseCategory[];
  loading: boolean;
  error: string | null;
  
  // Expense CRUD operations
  fetchExpenses: (userId: string) => Promise<void>;
  fetchExpense: (id: string) => Promise<void>;
  createExpense: (expense: Partial<Expense>) => Promise<Expense | null>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  // Category operations
  fetchCategories: (userId: string) => Promise<void>;
  createCategory: (category: Partial<ExpenseCategory>) => Promise<ExpenseCategory | null>;
  updateCategory: (id: string, updates: Partial<ExpenseCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Receipt upload
  uploadReceipt: (file: File, userId: string) => Promise<string | null>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  selectedExpense: null,
  categories: [],
  loading: false,
  error: null,
  
  fetchExpenses: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          category:category_id(id, name, color),
          client:client_id(name, company_name),
          employee:employee_id(name, designation, hourly_rate, monthly_salary, currency_preference)
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      set({ expenses: data as Expense[] });
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      set({ error: error.message || 'Failed to fetch expenses' });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchExpense: async (id: string) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          category:category_id(id, name, color),
          client:client_id(name, company_name),
          employee:employee_id(name, designation, hourly_rate, monthly_salary, currency_preference)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      set({ selectedExpense: data as Expense });
    } catch (error: any) {
      console.error('Error fetching expense:', error);
      set({ error: error.message || 'Failed to fetch expense' });
    } finally {
      set({ loading: false });
    }
  },
  
  createExpense: async (expense: Partial<Expense>) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('expenses')
        .insert([expense])
        .select(`
          *,
          category:category_id(id, name, color),
          client:client_id(name, company_name)
        `)
        .single();
      
      if (error) throw error;
      
      const newExpense = data as Expense;
      
      set((state) => ({ 
        expenses: [newExpense, ...state.expenses]
      }));
      
      return newExpense;
    } catch (error: any) {
      console.error('Error creating expense:', error);
      set({ error: error.message || 'Failed to create expense' });
      return null;
    } finally {
      set({ loading: false });
    }
  },
  
  updateExpense: async (id: string, updates: Partial<Expense>) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          category:category_id(id, name, color),
          client:client_id(name, company_name)
        `)
        .single();
      
      if (error) throw error;
      
      const updatedExpense = data as Expense;
      
      set((state) => ({ 
        expenses: state.expenses.map(e => 
          e.id === id ? updatedExpense : e
        ),
        selectedExpense: state.selectedExpense?.id === id 
          ? updatedExpense 
          : state.selectedExpense
      }));
    } catch (error: any) {
      console.error('Error updating expense:', error);
      set({ error: error.message || 'Failed to update expense' });
    } finally {
      set({ loading: false });
    }
  },
  
  deleteExpense: async (id: string) => {
    try {
      set({ loading: true, error: null });
      
      // Get the expense to check if it has a receipt
      const expense = get().expenses.find(e => e.id === id);
      
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // If the expense has a receipt, delete it from storage
      if (expense?.receipt_url) {
        const receiptPath = expense.receipt_url.split('/').pop();
        if (receiptPath) {
          await supabase.storage
            .from('receipts')
            .remove([receiptPath]);
        }
      }
      
      set((state) => ({ 
        expenses: state.expenses.filter(e => e.id !== id),
        selectedExpense: state.selectedExpense?.id === id 
          ? null 
          : state.selectedExpense
      }));
      
      toast.success('Expense deleted successfully');
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      set({ error: error.message || 'Failed to delete expense' });
      toast.error('Failed to delete expense');
    } finally {
      set({ loading: false });
    }
  },
  
  fetchCategories: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      set({ categories: data as ExpenseCategory[] });
    } catch (error: any) {
      console.error('Error fetching expense categories:', error);
      set({ error: error.message || 'Failed to fetch expense categories' });
    } finally {
      set({ loading: false });
    }
  },
  
  createCategory: async (category: Partial<ExpenseCategory>) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('expense_categories')
        .insert([category])
        .select()
        .single();
      
      if (error) throw error;
      
      const newCategory = data as ExpenseCategory;
      
      set((state) => ({ 
        categories: [...state.categories, newCategory]
      }));
      
      return newCategory;
    } catch (error: any) {
      console.error('Error creating expense category:', error);
      set({ error: error.message || 'Failed to create expense category' });
      return null;
    } finally {
      set({ loading: false });
    }
  },
  
  updateCategory: async (id: string, updates: Partial<ExpenseCategory>) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('expense_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      const updatedCategory = data as ExpenseCategory;
      
      set((state) => ({ 
        categories: state.categories.map(c => 
          c.id === id ? updatedCategory : c
        )
      }));
    } catch (error: any) {
      console.error('Error updating expense category:', error);
      set({ error: error.message || 'Failed to update expense category' });
    } finally {
      set({ loading: false });
    }
  },
  
  deleteCategory: async (id: string) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set((state) => ({ 
        categories: state.categories.filter(c => c.id !== id)
      }));
      
      toast.success('Category deleted successfully');
    } catch (error: any) {
      console.error('Error deleting expense category:', error);
      set({ error: error.message || 'Failed to delete expense category' });
      toast.error('Failed to delete category');
    } finally {
      set({ loading: false });
    }
  },
  
  uploadReceipt: async (file: File, userId: string) => {
    try {
      set({ loading: true, error: null });
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Receipt file size must be less than 5MB');
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Receipt must be an image (JPEG, PNG, GIF) or PDF');
      }
      
      // Generate a unique filename
      const timestamp = new Date().getTime();
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${timestamp}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      
      // Upload file
      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);
      
      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Error uploading receipt:', error);
      set({ error: error.message || 'Failed to upload receipt' });
      return null;
    } finally {
      set({ loading: false });
    }
  }
}));