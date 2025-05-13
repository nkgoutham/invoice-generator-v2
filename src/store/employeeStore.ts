import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Employee } from '../lib/supabase';
import toast from 'react-hot-toast';

interface EmployeeState {
  employees: Employee[];
  selectedEmployee: Employee | null;
  loading: boolean;
  error: string | null;
  
  // Employee CRUD operations
  fetchEmployees: (userId: string) => Promise<void>;
  fetchEmployee: (id: string) => Promise<void>;
  createEmployee: (employee: Partial<Employee>) => Promise<Employee | null>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
}

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  employees: [],
  selectedEmployee: null,
  loading: false,
  error: null,
  
  fetchEmployees: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      set({ employees: data as Employee[] });
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      set({ error: error.message || 'Failed to fetch employees' });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchEmployee: async (id: string) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      set({ selectedEmployee: data as Employee });
    } catch (error: any) {
      console.error('Error fetching employee:', error);
      set({ error: error.message || 'Failed to fetch employee' });
    } finally {
      set({ loading: false });
    }
  },
  
  createEmployee: async (employee: Partial<Employee>) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('employees')
        .insert([employee])
        .select()
        .single();
      
      if (error) throw error;
      
      const newEmployee = data as Employee;
      
      set((state) => ({ 
        employees: [...state.employees, newEmployee]
      }));
      
      return newEmployee;
    } catch (error: any) {
      console.error('Error creating employee:', error);
      set({ error: error.message || 'Failed to create employee' });
      return null;
    } finally {
      set({ loading: false });
    }
  },
  
  updateEmployee: async (id: string, updates: Partial<Employee>) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      const updatedEmployee = data as Employee;
      
      set((state) => ({ 
        employees: state.employees.map(e => 
          e.id === id ? updatedEmployee : e
        ),
        selectedEmployee: state.selectedEmployee?.id === id 
          ? updatedEmployee 
          : state.selectedEmployee
      }));
      
      toast.success('Employee updated successfully');
    } catch (error: any) {
      console.error('Error updating employee:', error);
      set({ error: error.message || 'Failed to update employee' });
      toast.error('Failed to update employee');
    } finally {
      set({ loading: false });
    }
  },
  
  deleteEmployee: async (id: string) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set((state) => ({ 
        employees: state.employees.filter(e => e.id !== id),
        selectedEmployee: state.selectedEmployee?.id === id 
          ? null 
          : state.selectedEmployee
      }));
      
      toast.success('Employee deleted successfully');
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      set({ error: error.message || 'Failed to delete employee' });
      toast.error('Failed to delete employee');
    } finally {
      set({ loading: false });
    }
  }
}));