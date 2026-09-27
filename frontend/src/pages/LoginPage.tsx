import { useState } from 'react';
import { Link } from 'react-router-dom';
import './LoginPage.css';

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="login-layout">
      <div className="login-visual">
        <Link to="/" className="login-logo">
          LinguaFlow
        </Link>
        <div className="login-visual-content">
          <blockquote className="login-quote">
            "Language is the road map of a culture. It tells you where its people come from and where they are going."
            <footer>— Rita Mae Brown</footer>
          </blockquote>
        </div>
      </div>
      
      <div className="login-form-container">
        <div className="login-form-wrapper">
          <div className="login-form-header">
            <h1 className="login-title">Welcome back</h1>
            <p className="login-subtitle">Enter your details to access your vocabulary.</p>
          </div>

          <form className="login-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                placeholder="hello@example.com" 
                autoComplete="email"
                required 
              />
            </div>
            
            <div className="form-group">
              <div className="password-header">
                <label htmlFor="password">Password</label>
                <a href="#" className="forgot-password">Forgot password?</a>
              </div>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  id="password" 
                  placeholder="••••••••" 
                  autoComplete="current-password"
                  required 
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full">
              Log In
            </button>
          </form>
          
          <p className="login-footer">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
