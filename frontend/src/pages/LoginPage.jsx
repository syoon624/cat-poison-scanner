/**
 * ============================================
 * LoginPage - 로그인 페이지 (Google OAuth)
 * ============================================
 * 비로그인 사용자에게 표시되는 진입 화면.
 * Google Identity Services 버튼으로 로그인합니다.
 */

import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { googleLogin } from '../services/api';
import useStore from '../store/useStore';
import './LoginPage.css';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const login = useStore((s) => s.login);

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
      console.error('로그인 에러:', err);
      const msg = err.response?.data?.message || '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google 로그인에 실패했습니다. 다시 시도해주세요.');
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

        <div className="login-divider">
          <span>시작하기</span>
        </div>

        <div className="google-btn-wrapper">
          {isLoading ? (
            <div className="login-loading">
              <div className="login-spinner" />
              <p>로그인 중...</p>
            </div>
          ) : (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
              width="300"
              locale="ko"
            />
          )}
        </div>

        {error && <p className="login-error">{error}</p>}

        <p className="login-disclaimer">
          로그인 시 개인정보 처리방침에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}
