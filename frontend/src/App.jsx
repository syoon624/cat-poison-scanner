/**
 * ============================================
 * App - 메인 라우팅 + 하단 탭 네비게이션 (PWA 웹 버전)
 * ============================================
 * React Navigation (네이티브) → React Router DOM으로 변환
 * 하단 탭 네비게이션을 CSS로 직접 구현합니다.
 */

import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import ScannerPage from './pages/ScannerPage';
import ChatPage from './pages/ChatPage';
import TimelinePage from './pages/TimelinePage';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        {/* 메인 콘텐츠 영역 */}
        <main className="app-content">
          <Routes>
            <Route path="/" element={<ScannerPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
          </Routes>
        </main>

        {/* 하단 탭 바 (iOS 탭 바 스타일) */}
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
        </nav>
      </div>
    </BrowserRouter>
  );
}
