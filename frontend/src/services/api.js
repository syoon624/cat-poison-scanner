/**
 * ============================================
 * API 서비스 - 백엔드 통신 모듈 (PWA 웹 버전)
 * ============================================
 * Axios를 사용하여 PurrfectScan 백엔드 API와 통신합니다.
 * React Native 버전의 로직을 그대로 포팅했으며,
 * 웹 환경에 맞게 FormData 처리 방식만 변경되었습니다.
 */

import axios from 'axios';

// 백엔드 서버 URL (Render.com 배포)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://cat-poison-scanner.onrender.com';

/**
 * Axios 인스턴스
 * - timeout: 30초 (Render 무료 티어 콜드 스타트 대비)
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 이미지 분석 요청 (웹 버전)
 * File 객체를 FormData에 담아 서버로 전송
 * @param {File} imageFile - 이미지 파일 객체
 * @param {string} scanType - 'object' | 'ocr'
 * @returns {Promise<Object>} 스캔 분석 결과
 */
export const scanImage = async (imageFile, scanType = 'object') => {
  const formData = new FormData();
  formData.append('image', imageFile, 'scan.jpg');
  formData.append('scanType', scanType);

  const response = await apiClient.post('/api/scan/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * 챗봇 질의 전송
 * @param {string} message - 사용자 질문
 * @returns {Promise<Object>} 챗봇 응답
 */
export const askChat = async (message) => {
  const response = await apiClient.post('/api/chat/ask', { message });
  return response.data;
};

/**
 * 타임라인 기록 조회
 * @param {string} catId - 고양이 ID
 * @param {Object} filters - 필터 옵션
 * @returns {Promise<Object>} 타임라인 데이터
 */
export const getTimeline = async (catId, filters = {}) => {
  const params = {};
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.type) params.type = filters.type;

  const response = await apiClient.get(`/api/timeline/${catId}`, { params });
  return response.data;
};

/**
 * 타임라인 새 기록 추가
 * @param {Object} entry - 타임라인 항목
 * @returns {Promise<Object>} 생성된 기록
 */
export const addTimelineEntry = async (entry) => {
  const response = await apiClient.post('/api/timeline', entry);
  return response.data;
};

/**
 * 서버 상태 확인
 * @returns {Promise<Object>} 서버 상태
 */
export const checkHealth = async () => {
  const response = await apiClient.get('/api/health');
  return response.data;
};

export default apiClient;
