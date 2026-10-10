import { apiClient } from './api';

export const userApi = {
  getMyProfile: async () => (await apiClient('/users/me')).data,
  updateMyProfile: async (profile) => (await apiClient('/users/me', {
    method: 'PATCH', body: JSON.stringify(profile),
  })).data,
};
