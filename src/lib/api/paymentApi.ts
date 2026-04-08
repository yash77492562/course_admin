import { apiClient } from './api';

export interface Payment {
  paymentId: string;
  orderId: string;
  paymentIntentId?: string;
  chargeId?: string;
  amount: number;
  currency: string;
  status: string;
  invoiceUrl?: string;
  errorMessage?: string;
  errorCode?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  course: {
    id: string;
    title: string;
    thumbnail?: string;
  };
}

export interface PaymentResponse {
  transactions: Payment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const paymentApi = {
  getAllPayments: async (page: number = 1, limit: number = 50): Promise<PaymentResponse> => {
    return apiClient.get<PaymentResponse>(`/admin/payments?page=${page}&limit=${limit}`);
  },

  getAllOrders: async (page: number = 1, limit: number = 50): Promise<PaymentResponse> => {
    return apiClient.get<PaymentResponse>(`/admin/orders?page=${page}&limit=${limit}`);
  },
};
