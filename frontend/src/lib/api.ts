const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://selfmadedevpreli.vercel.app';

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
      console.log(`API Request to ${endpoint}: Authentication required (no access token).`);
      return { success: false, error: 'Authentication required.' };
    }
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    console.log(`API Request: ${method} ${url}`);
    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    console.log(`API Response Status for ${endpoint}: ${response.status}`);

    // Check if response is not OK and if it's not JSON
    if (!response.ok && response.headers.get('content-type')?.includes('text/html')) {
      const errorText = await response.text();
      console.error(`API Error (HTML response) for ${endpoint}:`, errorText);
      return { success: false, error: `Server error: ${response.status} ${response.statusText}` };
    }

    const responseData = await response.json();
    console.log(`API Response Data for ${endpoint}:`, responseData);

    if (!response.ok) {
      // Handle specific error messages from backend
      const errorMessage = responseData.detail || responseData.error || responseData.message || 'An unknown error occurred.';
      console.log(`API Request to ${endpoint} failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }

    console.log(`API Request to ${endpoint} successful.`);
    return { success: true, data: responseData };
  } catch (error: any) {
    console.error('API Request Error (catch block):', error);
    return { success: false, error: error.message || 'Network error.' };
  }
}

// Specific API functions
export const authApi = {
  register: (data: any) => apiRequest('/api/users/register/', 'POST', data),
  login: (data: any) => apiRequest('/api/users/login/', 'POST', data),
  getUserDetails: () => apiRequest('/api/users/me/', 'GET', undefined, true),
  verifyOtp: (data: any) => apiRequest('/api/users/verify-otp/', 'POST', data),
  resendOtp: (data: any) => apiRequest('/api/users/resend-otp/', 'POST', data),
  forgotPassword: (data: any) => apiRequest('/api/users/forgot-password/', 'POST', data),
  resetPassword: (data: any) => apiRequest('/api/users/reset-password/', 'POST', data),
  logout: (data: any) => apiRequest('/api/users/logout/', 'POST', data, true),
  refreshToken: (data: any) => apiRequest('/api/users/token/refresh/', 'POST', data),
};

export const examApi = {
  getExamQuestions: () => apiRequest('/api/quiz/questions/', 'GET', undefined, true),
  submitExamAnswers: (data: any) => apiRequest('/api/quiz/submit/', 'POST', data, true),
};
