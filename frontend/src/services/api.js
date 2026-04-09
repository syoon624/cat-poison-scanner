/**
 * ============================================
 * API 서비스 - 백엔드 통신 모듈 (PWA 웹 버전)
 * ============================================
 * Axios를 사용하여 PurrfectScan 백엔드 API와 통신합니다.
 * JWT 토큰 자동 첨부 및 401 응답 시 자동 로그아웃 처리 포함.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── 요청 인터셉터: JWT 토큰 자동 첨부 ───
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('purrfect_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── 응답 인터셉터: 401 시 자동 로그아웃 ───
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('purrfect_token');
      localStorage.removeItem('purrfect_user');
      // 로그인 페이지로 이동은 컴포넌트 레벨에서 처리
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    return Promise.reject(error);
  }
);

// ============================================
// 인증 API
// ============================================

/** 이메일 회원가입 */
export const emailRegister = async (email, password, displayName) => {
  const response = await apiClient.post('/api/auth/register', { email, password, displayName });
  return response.data;
};

/** 이메일 로그인 */
export const emailLogin = async (email, password) => {
  const response = await apiClient.post('/api/auth/login', { email, password });
  return response.data;
};

/** Google 소셜 로그인 */
export const googleLogin = async (idToken) => {
  const response = await apiClient.post('/api/auth/google', { idToken });
  return response.data;
};

/** 현재 사용자 정보 조회 */
export const getMe = async () => {
  const response = await apiClient.get('/api/auth/me');
  return response.data;
};

/** 계정 삭제 */
export const deleteAccount = async () => {
  const response = await apiClient.delete('/api/auth/account');
  return response.data;
};

// ============================================
// 고양이 프로필 API
// ============================================

/** 내 고양이 목록 조회 */
export const getCats = async () => {
  const response = await apiClient.get('/api/cats');
  return response.data;
};

/** 고양이 등록 */
export const createCat = async (catData) => {
  const response = await apiClient.post('/api/cats', catData);
  return response.data;
};

/** 고양이 정보 수정 */
export const updateCat = async (catId, catData) => {
  const response = await apiClient.put(`/api/cats/${catId}`, catData);
  return response.data;
};

/** 고양이 삭제 */
export const deleteCat = async (catId) => {
  const response = await apiClient.delete(`/api/cats/${catId}`);
  return response.data;
};

// ============================================
// 스캔 API
// ============================================

/** 이미지 분석 요청 */
export const scanImage = async (imageFile, scanType = 'object') => {
  const formData = new FormData();
  formData.append('image', imageFile, 'scan.jpg');
  formData.append('scanType', scanType);

  const response = await apiClient.post('/api/scan/image', formData, {
    headers: { 'Content-Type': undefined },
    timeout: 60000,
  });
  return response.data;
};

// ============================================
// 챗봇 API
// ============================================

/** 챗봇 질의 전송 */
export const askChat = async (message) => {
  const response = await apiClient.post('/api/chat/ask', { message });
  return response.data;
};

// ============================================
// 타임라인 API
// ============================================

/** 타임라인 기록 조회 */
export const getTimeline = async (catId, filters = {}) => {
  const params = {};
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.type) params.type = filters.type;

  const response = await apiClient.get(`/api/timeline/${catId}`, { params });
  return response.data;
};

/** 타임라인 기록 추가 */
export const addTimelineEntry = async (entry) => {
  const response = await apiClient.post('/api/timeline', entry);
  return response.data;
};

/** 타임라인 기록 수정 */
export const updateTimelineEntry = async (entryId, data) => {
  const response = await apiClient.put(`/api/timeline/${entryId}`, data);
  return response.data;
};

/** 타임라인 기록 삭제 */
export const deleteTimelineEntry = async (entryId) => {
  const response = await apiClient.delete(`/api/timeline/${entryId}`);
  return response.data;
};

/** 서버 상태 확인 */
export const checkHealth = async () => {
  const response = await apiClient.get('/api/health');
  return response.data;
};

export default apiClient;
