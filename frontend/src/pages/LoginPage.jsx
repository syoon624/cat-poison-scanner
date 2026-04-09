/**
 * ============================================
 * LoginPage - 로그인/회원가입 페이지
 * ============================================
 * 두 가지 인증 방식을 지원합니다:
 * 1. 이메일/비밀번호 (회원가입 & 로그인 전환 가능)
 * 2. Google OAuth 소셜 로그인
 */

import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { googleLogin, emailLogin, emailRegister } from '../services/api';
import useStore from '../store/useStore';
import './LoginPage.css';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // 이메일 폼 상태
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formName, setFormName] = useState('');

  const login = useStore((s) => s.login);

  /** 이메일 폼 제출 (로그인 또는 회원가입) */
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!formEmail.trim() || !formPassword) return;

    setIsLoading(true);
    setError('');

    try {
      let result;
      if (isRegisterMode) {
        result = await emailRegister(formEmail, formPassword, formName || undefined);
      } else {
        result = await emailLogin(formEmail, formPassword);
      }

      if (result.success) {
        login(result.token, result.user);
      } else {
        setError(result.message || '처리에 실패했습니다.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  /** Google 로그인 성공 */
  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await googleLogin(credentialResponse.credential);
      if (result.success) {
        login(result.token, result.user);
      } else {
        setError(result.message || '로그인에 실패했습니다.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || '서버에 연결할 수 없습니다.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  /** 모드 전환 (로그인 ↔ 회원가입) */
  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="logo-emoji">🐱</span>
          <h1>PurrfectScan</h1>
          <p className="login-subtitle">반려묘 안전/건강 복합 관리</p>
        </div>

        <div className="login-features">
          <div className="feature-item">
            <span>📷</span>
            <span>식물/사물 독성 스캔</span>
          </div>
          <div className="feature-item">
            <span>📋</span>
            <span>성분표 OCR 분석</span>
          </div>
          <div className="feature-item">
            <span>💬</span>
            <span>AI 냥챗 상담</span>
          </div>
          <div className="feature-item">
            <span>📅</span>
            <span>건강 타임라인</span>
          </div>
        </div>

        {/* ─── 이메일 폼 ─── */}
        <div className="login-divider">
          <span>{isRegisterMode ? '회원가입' : '로그인'}</span>
        </div>

        <form className="email-form" onSubmit={handleEmailSubmit}>
          {isRegisterMode && (
            <input
              type="text"
              className="form-input"
              placeholder="이름 (선택)"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              autoComplete="name"
            />
          )}
          <input
            type="email"
            className="form-input"
            placeholder="이메일 주소"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            type="password"
            className="form-input"
            placeholder={isRegisterMode ? '비밀번호 (6자 이상)' : '비밀번호'}
            value={formPassword}
            onChange={(e) => setFormPassword(e.target.value)}
            required
            minLength={isRegisterMode ? 6 : undefined}
            autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
          />
          <button
            type="submit"
            className="email-submit-btn"
            disabled={isLoading || !formEmail.trim() || !formPassword}
          >
            {isLoading ? '처리 중...' : isRegisterMode ? '가입하기' : '로그인'}
          </button>
        </form>

        <p className="toggle-mode">
          {isRegisterMode ? '이미 계정이 있으신가요?' : '계정이 없으신가요?'}
          {' '}
          <button className="toggle-btn" onClick={toggleMode} type="button">
            {isRegisterMode ? '로그인' : '회원가입'}
          </button>
        </p>

        {/* ─── 구분선 + Google 로그인 ─── */}
        <div className="login-divider">
          <span>또는</span>
        </div>

        <div className="google-btn-wrapper">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google 로그인에 실패했습니다.')}
            theme="outline"
            size="large"
            text="signin_with"
            shape="rectangular"
            width="300"
            locale="ko"
          />
        </div>

        {error && <p className="login-error">{error}</p>}

        <p className="login-disclaimer">
          로그인 시 개인정보 처리방침에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}
