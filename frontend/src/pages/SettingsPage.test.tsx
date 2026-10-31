import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsPage } from './SettingsPage';
import { settingsApi } from '../lib/settings.api';

const mockUpdateUser = vi.fn();
const mockLogout = vi.fn();

const mockUser = {
  id: 'u-123',
  email: 'alex@example.com',
  displayName: 'Alex Smith',
  avatarUrl: 'https://example.com/avatar.jpg',
  role: 'Learner',
  settings: {
    dailyReviewGoal: 20,
    quizDefaultCount: 10,
    timezone: 'UTC',
  },
};

vi.mock('../lib/auth', () => ({
  useAuth: () => ({
    user: mockUser,
    updateUser: mockUpdateUser,
    logout: mockLogout,
  }),
}));

vi.mock('../lib/settings.api', () => ({
  settingsApi: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    updateSettings: vi.fn(),
  },
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <MantineProvider>
        <BrowserRouter>
          <SettingsPage />
        </BrowserRouter>
      </MantineProvider>
    );

  it('renders settings page with user profile and study preferences', () => {
    renderComponent();

    expect(screen.getByText('Settings & Profile')).toBeInTheDocument();
    expect(screen.getByText('User Profile')).toBeInTheDocument();
    expect(screen.getByText('Study Goals & SRS Preferences')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Alex Smith')).toBeInTheDocument();
    expect(screen.getByDisplayValue('alex@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://example.com/avatar.jpg')).toBeInTheDocument();
    expect(screen.getByText(/20 cards \/ day/i)).toBeInTheDocument();
    expect(screen.getAllByText(/10 Questions/i).length).toBeGreaterThan(0);
  });

  it('submits updated profile and calls settingsApi.updateProfile', async () => {
    vi.mocked(settingsApi.updateProfile).mockResolvedValue({
      _id: 'u-123',
      email: 'alex@example.com',
      displayName: 'Alexander The Great',
      avatarUrl: 'https://example.com/new.png',
      settings: {
        dailyReviewGoal: 20,
        quizDefaultCount: 10,
        timezone: 'UTC',
      },
    });

    renderComponent();

    const nameInput = screen.getByDisplayValue('Alex Smith');
    fireEvent.change(nameInput, { target: { value: 'Alexander The Great' } });

    const saveProfileBtn = screen.getByRole('button', { name: /save profile/i });
    fireEvent.click(saveProfileBtn);

    await waitFor(() => {
      expect(settingsApi.updateProfile).toHaveBeenCalledWith({
        displayName: 'Alexander The Great',
        avatarUrl: 'https://example.com/avatar.jpg',
      });
      expect(mockUpdateUser).toHaveBeenCalledWith({
        displayName: 'Alexander The Great',
        avatarUrl: 'https://example.com/new.png',
      });
      expect(screen.getByText('Profile updated successfully')).toBeInTheDocument();
    });
  });

  it('shows error if display name is cleared and submitted', async () => {
    renderComponent();

    const nameInput = screen.getByDisplayValue('Alex Smith');
    fireEvent.change(nameInput, { target: { value: '   ' } });

    const saveProfileBtn = screen.getByRole('button', { name: /save profile/i });
    fireEvent.click(saveProfileBtn);

    await waitFor(() => {
      expect(screen.getByText('Display name cannot be empty')).toBeInTheDocument();
      expect(settingsApi.updateProfile).not.toHaveBeenCalled();
    });
  });

  it('submits updated study preferences and calls settingsApi.updateSettings', async () => {
    vi.mocked(settingsApi.updateSettings).mockResolvedValue({
      _id: 'u-123',
      email: 'alex@example.com',
      displayName: 'Alex Smith',
      avatarUrl: null,
      settings: {
        dailyReviewGoal: 30,
        quizDefaultCount: 15,
        timezone: 'Asia/Ho_Chi_Minh',
      },
    });

    renderComponent();

    const saveSettingsBtn = screen.getByRole('button', { name: /save preferences/i });
    fireEvent.click(saveSettingsBtn);

    await waitFor(() => {
      expect(settingsApi.updateSettings).toHaveBeenCalled();
      expect(mockUpdateUser).toHaveBeenCalledWith({
        settings: {
          dailyReviewGoal: 30,
          quizDefaultCount: 15,
          timezone: 'Asia/Ho_Chi_Minh',
        },
      });
      expect(screen.getByText('Study preferences saved successfully')).toBeInTheDocument();
    });
  });

  it('shows alert message when settingsApi.updateSettings fails', async () => {
    vi.mocked(settingsApi.updateSettings).mockRejectedValue(
      new Error('Failed to connect to server')
    );

    renderComponent();

    const saveSettingsBtn = screen.getByRole('button', { name: /save preferences/i });
    fireEvent.click(saveSettingsBtn);

    await waitFor(() => {
      expect(screen.getByText('Failed to connect to server')).toBeInTheDocument();
    });
  });

  it('handles user logout button click', async () => {
    renderComponent();

    const logoutBtn = screen.getByRole('button', { name: /log out/i });
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });
});
