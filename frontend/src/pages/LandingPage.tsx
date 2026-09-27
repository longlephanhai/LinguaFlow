import { Link } from 'react-router-dom';
import './LandingPage.css';

export const LandingPage = () => {
  return (
    <div className="landing-layout">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-logo">
          <span>LinguaFlow</span>
        </div>
        <nav className="header-nav">
          <Link to="/login" className="btn btn-ghost">Log In</Link>
          <button type="button" className="btn btn-primary">Sign Up</button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="landing-hero">
        <span className="hero-pill">Powered by Gemini AI</span>
        
        <h1 className="hero-title">
          Master English vocabulary <br />
          <span className="hero-title-highlight">in its natural habitat.</span>
        </h1>
        
        <p className="hero-subtitle">
          Don't just memorize word lists. Capture words in context from any webpage, get AI-powered explanations, and retain them forever with spaced repetition.
        </p>

        <div className="hero-ctas">
          <button type="button" className="btn btn-primary btn-large">Start for free</button>
          <button type="button" className="btn btn-ghost btn-large">Install Extension</button>
        </div>

        {/* Interactive Demo */}
        <div className="demo-container">
          <div className="demo-header">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            Interactive Demo
          </div>
          <p className="demo-text">
            "The architecture was highly 
            <span className="demo-highlight">
               idiosyncratic 
              <span className="demo-tooltip">
                <span className="tooltip-title">idiosyncratic</span>
                <span className="tooltip-desc">Peculiar or individual; a feature that is unique to a specific person or thing.</span>
                <span className="tooltip-ai">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                  </svg>
                  AI Explanation
                </span>
              </span>
            </span>
            , reflecting the eccentric tastes of its creator rather than the prevailing styles of the era."
          </p>
          <p className="demo-note">
            Hover over the highlighted word to see how LinguaFlow explains it in context.
          </p>
        </div>
      </main>
    </div>
  );
};
