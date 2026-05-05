const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

interface ApiResponse<T = any> {
  status: number;
  success: boolean;
  message: string;
  data?: T;
}

interface SimpleApiResponse {
  status: number;
  success: boolean;
  message: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<T> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }

      // Handle nested data structure from backend
      if (result.data && typeof result.data === 'object' && 'data' in result.data) {
        return result.data.data as T;
      }

      return result.data as T;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private async simpleRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<SimpleApiResponse> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const result: SimpleApiResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string, options?: { params?: any }): Promise<T> {
    let url = endpoint;
    if (options?.params) {
      const searchParams = new URLSearchParams(options.params);
      url += `?${searchParams.toString()}`;
    }
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async simplePost(endpoint: string, data: any): Promise<SimpleApiResponse> {
    return this.simpleRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);