import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './lib/auth';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { VocabularyPage } from './pages/VocabularyPage';
import { FlashcardPage } from './pages/FlashcardPage';
import { QuizPage } from './pages/QuizPage';
import { ChatPage } from './pages/ChatPage';
import { WritingPage } from './pages/WritingPage';
import { SettingsPage } from './pages/SettingsPage';
import { VideoStudyRoomPage } from './pages/VideoStudyRoomPage';
import { ReaderPage } from './pages/ReaderPage';
import { ConversationPage } from './pages/ConversationPage';
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
              <Route path="/reader" element={<ReaderPage />} />
              <Route path="/conversation" element={<ConversationPage />} />
              <Route path="/voice" element={<Navigate to="/conversation" replace />} />
              <Route path="/flashcards" element={<FlashcardPage />} />
              <Route path="/review" element={<Navigate to="/flashcards" replace />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/writing" element={<WritingPage />} />
              <Route path="/video" element={<VideoStudyRoomPage />} />
              <Route path="/study-room" element={<Navigate to="/video" replace />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
