import { create } from 'zustand';
import { supabase, Client, EngagementModel, Document } from '../lib/supabase';

interface ClientState {
  clients: Client[];
  selectedClient: Client | null;
  engagementModel: EngagementModel | null;
  documents: Document[];
  loading: boolean;
  error: string | null;
  fetchClients: (userId: string) => Promise<void>;
  getClient: (clientId: string) => Promise<Client | null>;
  fetchClient: (clientId: string) => Promise<void>;
  fetchEngagementModel: (clientId: string) => Promise<void>;
  fetchDocuments: (clientId: string) => Promise<void>;
  createClient: (client: Partial<Client>) => Promise<Client | null>;
  updateClient: (clientId: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  createEngagementModel: (model: Partial<EngagementModel>) => Promise<void>;
  updateEngagementModel: (modelId: string, updates: Partial<EngagementModel>) => Promise<void>;
  uploadDocument: (clientId: string, file: File, type: Document['type'], name: string) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
}

export const useClientStore = create<ClientState>((set, get) => ({
  clients: [],
  selectedClient: null,
  engagementModel: null,
  documents: [],
  loading: false,
  error: null,
  
  fetchClients: async (userId) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ clients: data as Client[] });
    } catch (error: any) {
      console.error('Fetch clients error:', error);
      set({ error: error.message || 'Failed to fetch clients' });
    } finally {
      set({ loading: false });
    }
  },
  
  getClient: async (clientId) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
      
      if (error) throw error;
      
      return data as Client;
    } catch (error: any) {
      console.error('Get client error:', error);
      set({ error: error.message || 'Failed to get client' });
      return null;
    } finally {
      set({ loading: false });
    }
  },
  
  fetchClient: async (clientId) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
      
      if (error) throw error;
      
      set({ selectedClient: data as Client });
    } catch (error: any) {
      console.error('Fetch client error:', error);
      set({ error: error.message || 'Failed to fetch client' });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchEngagementModel: async (clientId) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('engagement_models')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle();
      
      if (error) throw error;
      
      set({ engagementModel: data as EngagementModel || null });
    } catch (error: any) {
      console.error('Fetch engagement model error:', error);
      set({ error: error.message || 'Failed to fetch engagement model' });
      // Set engagement model to null to prevent UI from breaking
      set({ engagementModel: null });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchDocuments: async (clientId) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ documents: data as Document[] });
    } catch (error: any) {
      console.error('Fetch documents error:', error);
      set({ error: error.message || 'Failed to fetch documents' });
    } finally {
      set({ loading: false });
    }
  },
  
  createClient: async (client) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('clients')
        .insert([client])
        .select()
        .single();
      
      if (error) throw error;
      
      set((state) => ({ 
        clients: [data as Client, ...state.clients],
        selectedClient: data as Client
      }));
      
      return data as Client;
    } catch (error: any) {
      console.error('Create client error:', error);
      set({ error: error.message || 'Failed to create client' });
      return null;
    } finally {
      set({ loading: false });
    }
  },
  
  updateClient: async (clientId, updates) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId)
        .select()
        .single();
      
      if (error) throw error;
      
      const updatedClient = data as Client;
      
      set((state) => ({ 
        clients: state.clients.map(c => 
          c.id === clientId ? updatedClient : c
        ),
        selectedClient: state.selectedClient?.id === clientId 
          ? updatedClient 
          : state.selectedClient
      }));
    } catch (error: any) {
      console.error('Update client error:', error);
      set({ error: error.message || 'Failed to update client' });
    } finally {
      set({ loading: false });
    }
  },
  
  deleteClient: async (clientId) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);
      
      if (error) throw error;
      
      set((state) => ({ 
        clients: state.clients.filter(c => c.id !== clientId),
        selectedClient: state.selectedClient?.id === clientId 
          ? null 
          : state.selectedClient
      }));
    } catch (error: any) {
      console.error('Delete client error:', error);
      set({ error: error.message || 'Failed to delete client' });
    } finally {
      set({ loading: false });
    }
  },
  
  createEngagementModel: async (model) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('engagement_models')
        .insert([model])
        .select()
        .single();
      
      if (error) throw error;
      
      set({ engagementModel: data as EngagementModel });
    } catch (error: any) {
      console.error('Create engagement model error:', error);
      set({ error: error.message || 'Failed to create engagement model' });
    } finally {
      set({ loading: false });
    }
  },
  
  updateEngagementModel: async (modelId, updates) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('engagement_models')
        .update(updates)
        .eq('id', modelId)
        .select()
        .single();
      
      if (error) throw error;
      
      set({ engagementModel: data as EngagementModel });
    } catch (error: any) {
      console.error('Update engagement model error:', error);
      set({ error: error.message || 'Failed to update engagement model' });
    } finally {
      set({ loading: false });
    }
  },
  
  uploadDocument: async (clientId, file, type, name) => {
    try {
      set({ loading: true, error: null });
      
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${clientId}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data } = supabase.storage.from('documents').getPublicUrl(filePath);
      
      // Create document record
      const { data: documentData, error: documentError } = await supabase
        .from('documents')
        .insert([{
          client_id: clientId,
          name,
          file_url: data.publicUrl,
          type
        }])
        .select()
        .single();
      
      if (documentError) throw documentError;
      
      set((state) => ({ 
        documents: [documentData as Document, ...state.documents] 
      }));
    } catch (error: any) {
      console.error('Upload document error:', error);
      set({ error: error.message || 'Failed to upload document' });
    } finally {
      set({ loading: false });
    }
  },
  
  deleteDocument: async (documentId) => {
    try {
      set({ loading: true, error: null });
      
      // Get document to find file path
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Delete from database
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);
      
      if (deleteError) throw deleteError;
      
      // Extract storage path from URL
      const fileUrl = (document as Document).file_url;
      const path = fileUrl.split('/').slice(-2).join('/');
      
      // Delete from storage if path is valid
      if (path) {
        await supabase.storage.from('documents').remove([path]);
      }
      
      set((state) => ({ 
        documents: state.documents.filter(d => d.id !== documentId) 
      }));
    } catch (error: any) {
      console.error('Delete document error:', error);
      set({ error: error.message || 'Failed to delete document' });
    } finally {
      set({ loading: false });
    }
  }
}));