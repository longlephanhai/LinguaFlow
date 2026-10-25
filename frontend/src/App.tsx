import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './lib/auth';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { VocabularyPage } from './pages/VocabularyPage';
import { FlashcardPage } from './pages/FlashcardPage';
import { QuizPage } from './pages/QuizPage';
import { AppLayout } from './components/layout/AppLayout';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<RegisterPage />} />
          
          {/* Protected Routes mapped to AppLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/vocabulary" element={<VocabularyPage />} />
              <Route path="/flashcards" element={<FlashcardPage />} />
              <Route path="/review" element={<Navigate to="/flashcards" replace />} />
              <Route path="/quiz" element={<QuizPage />} />
              {/* Add future protected routes here */}
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
