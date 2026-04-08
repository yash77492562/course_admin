import { apiClient } from './api';

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'NEW' | 'IN_PROGRESS' | 'RESPONDED' | 'CLOSED';
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  respondedAt?: string;
}

export const contactApi = {
  getAllContacts: async (status?: string): Promise<Contact[]> => {
    const endpoint = status ? `/admin/contacts?status=${status}` : '/admin/contacts';
    return apiClient.get<Contact[]>(endpoint);
  },

  updateContactStatus: async (id: string, status: string): Promise<Contact> => {
    return apiClient.put<Contact>(`/admin/contacts/${id}/status`, { status });
  },
};
