import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect } from 'vitest';
import { LoginPage } from './LoginPage';
import { AuthProvider } from '../lib/auth';

describe('LoginPage', () => {
  it('renders login form elements properly', () => {
    render(
      <MantineProvider>
        <BrowserRouter>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </BrowserRouter>
      </MantineProvider>
    );

    expect(screen.getByRole('heading', { name: /Welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Log In/i })).toBeInTheDocument();
  });
});
