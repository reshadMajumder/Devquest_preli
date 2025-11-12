const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  refresh?: string;
  access?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  method: string,
  data?: any,
  requireAuth: boolean = false
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (requireAuth) {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      return { success: false, error: 'Authentication required.' };
    }
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    const responseData = await response.json();

    if (!response.ok) {
      // Handle specific error messages from backend
      const errorMessage = responseData.error || responseData.message || 'An unknown error occurred.';
      return { success: false, error: errorMessage };
    }

    return { success: true, ...responseData };
  } catch (error: any) {
    console.error('API Request Error:', error);
    return { success: false, error: error.message || 'Network error.' };
  }
}

// Specific API functions
export const authApi = {
  register: (data: any) => apiRequest('/api/users/register/', 'POST', data),
  login: (data: any) => apiRequest('/api/users/login/', 'POST', data),
  verifyOtp: (data: any) => apiRequest('/api/users/verify-otp/', 'POST', data),
  resendOtp: (data: any) => apiRequest('/api/users/resend-otp/', 'POST', data),
  forgotPassword: (data: any) => apiRequest('/api/users/forgot-password/', 'POST', data),
  resetPassword: (data: any) => apiRequest('/api/users/reset-password/', 'POST', data),
  logout: (data: any) => apiRequest('/api/users/logout/', 'POST', data, true),
  refreshToken: (data: any) => apiRequest('/api/users/token/refresh/', 'POST', data),
};
