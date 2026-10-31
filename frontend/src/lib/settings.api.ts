import { api } from './api';
import type { UserSettings } from './auth';

export interface UserProfileResponse {
  _id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  roleId?: string | null;
  settings: UserSettings;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfilePayload {
  displayName?: string;
  avatarUrl?: string;
}

export interface UpdateSettingsPayload {
  dailyReviewGoal?: number;
  quizDefaultCount?: number;
  timezone?: string;
}

export const settingsApi = {
  getProfile: async (): Promise<UserProfileResponse> => {
    return api.get('/users/me');
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<UserProfileResponse> => {
    return api.patch('/users/me', payload);
  },

  updateSettings: async (payload: UpdateSettingsPayload): Promise<UserProfileResponse> => {
    return api.patch('/users/me/settings', payload);
  },
};
