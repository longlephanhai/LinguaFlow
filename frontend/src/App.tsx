import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { VocabularyPage } from './pages/VocabularyPage';
import { AppLayout } from './components/layout/AppLayout';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<RegisterPage />} />
        
        {/* Protected Routes mapped to AppLayout */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/vocabulary" element={<VocabularyPage />} />
          {/* Add future protected routes here */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
