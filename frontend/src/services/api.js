import { useAuthStore } from '../store/authStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

let refreshInFlight = null;

const readResponse = async (response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: 'Máy chủ trả về nội dung không phải JSON (HTTP ' + response.status + ').',
    };
  }
};

const createApiError = (response, data) => {
  const error = new Error(data?.message || 'Lỗi máy chủ (' + response.status + ')');
  error.status = response.status;
  error.data = data;
  return error;
};

const refreshAccessToken = async () => {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    const response = await fetch(BASE_URL + '/auth/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await readResponse(response);

    if (!response.ok || !data?.data?.accessToken) {
      throw createApiError(response, data);
    }

    useAuthStore.getState().setAuth(data.data);
    return data.data.accessToken;
  })();

  try {
    return await refreshInFlight;
  } catch (error) {
    useAuthStore.getState().logout();
    throw error;
  } finally {
    refreshInFlight = null;
  }
};

const sendRequest = (endpoint, options, token) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: 'Bearer ' + token } : {}),
    ...options.headers,
  };

  return fetch(BASE_URL + endpoint, { ...options, headers });
};

export const apiClient = async (endpoint, options = {}) => {
  let response = await sendRequest(
    endpoint,
    options,
    localStorage.getItem('access_token')
  );
  let data = await readResponse(response);

  if (response.status === 401 && !endpoint.startsWith('/auth/')) {
    try {
      const newAccessToken = await refreshAccessToken();
      response = await sendRequest(endpoint, options, newAccessToken);
      data = await readResponse(response);
    } catch (error) {
      if (error.status) throw error;
      throw createApiError(response, { message: error.message });
    }
  }

  if (!response.ok) {
    throw createApiError(response, data);
  }

  return data;
};

export default apiClient;
