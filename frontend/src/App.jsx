/**
 * ============================================
 * App - 메인 라우팅 + 하단 탭 네비게이션 (PWA 웹 버전)
 * ============================================
 * Google OAuth Provider로 감싸고, 인증 상태에 따라
 * 로그인 페이지 또는 메인 앱을 표시합니다.
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import useStore from './store/useStore';
import { getCats } from './services/api';
import LoginPage from './pages/LoginPage';
import ScannerPage from './pages/ScannerPage';
import ChatPage from './pages/ChatPage';
import TimelinePage from './pages/TimelinePage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function AuthenticatedApp() {
  const logout = useStore((s) => s.logout);
  const setCats = useStore((s) => s.setCats);

  // 로그인 후 고양이 목록 자동 로드
  useEffect(() => {
    getCats()
      .then((res) => { if (res.success) setCats(res.cats); })
      .catch((err) => console.warn('고양이 목록 로드 실패:', err.message));
  }, [setCats]);

  // 401 토큰 만료 이벤트 수신 → 자동 로그아웃
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, [logout]);

  return (
    <div className="app-shell">
      <main className="app-content">
        <Routes>
          <Route path="/" element={<ScannerPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <nav className="tab-bar">
        <NavLink to="/" className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`} end>
          <span className="tab-icon">📷</span>
          <span className="tab-label">스캔</span>
        </NavLink>
        <NavLink to="/chat" className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}>
          <span className="tab-icon">💬</span>
          <span className="tab-label">냥챗</span>
        </NavLink>
        <NavLink to="/timeline" className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}>
          <span className="tab-icon">📅</span>
          <span className="tab-label">타임라인</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}>
          <span className="tab-icon">⚙️</span>
          <span className="tab-label">설정</span>
        </NavLink>
      </nav>
    </div>
  );
}

export default function App() {
  const isAuthenticated = useStore((s) => s.isAuthenticated);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        {isAuthenticated ? <AuthenticatedApp /> : <LoginPage />}
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
