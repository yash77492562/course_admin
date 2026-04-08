import { apiClient } from './api';

export interface Partner {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  expertise: string;
  experience: string;
  linkedIn?: string;
  portfolio?: string;
  teachingInterest: string;
  message: string;
  status: 'PENDING' | 'REVIEWED' | 'APPROVED' | 'REJECTED';
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  reviewedAt?: string;
}

export const partnerApi = {
  getAllPartners: async (status?: string): Promise<Partner[]> => {
    const endpoint = status ? `/admin/partners?status=${status}` : '/admin/partners';
    return apiClient.get<Partner[]>(endpoint);
  },

  updatePartnerStatus: async (id: string, status: string): Promise<Partner> => {
    return apiClient.put<Partner>(`/admin/partners/${id}/status`, { status });
  },
};
