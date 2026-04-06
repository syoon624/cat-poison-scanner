/**
 * ============================================
 * API 서비스 - 백엔드 통신 모듈
 * ============================================
 * Axios를 사용하여 PurrfectScan 백엔드 API와 통신합니다.
 * 
 * 모든 API 호출은 이 모듈을 통해 이루어지며,
 * 에러 처리와 응답 변환을 중앙에서 관리합니다.
 * 
 * 환경 설정:
 * - 개발: http://localhost:5000
 * - 프로덕션: 배포된 서버 URL로 변경 필요
 */

import axios from 'axios';

// 백엔드 서버 기본 URL
// TODO: 프로덕션 배포 시 환경 변수로 관리
const API_BASE_URL = 'http://localhost:5000';

/**
 * Axios 인스턴스 생성
 * - baseURL: 모든 요청에 기본 URL 자동 적용
 * - timeout: 15초 타임아웃 (이미지 업로드를 고려하여 넉넉하게 설정)
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// 스캔 관련 API
// ============================================

/**
 * 이미지 분석 요청
 * 카메라로 촬영한 이미지를 서버에 전송하여 독성 분석
 * 
 * @param {string} imageUri - 로컬 이미지 파일 URI
 * @param {string} scanType - 스캔 모드 ('object' | 'ocr')
 * @returns {Promise<Object>} 스캔 분석 결과
 */
export const scanImage = async (imageUri, scanType = 'object') => {
  // FormData 구성 (멀티파트 파일 업로드)
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'scan.jpg',
  });
  formData.append('scanType', scanType);

  const response = await apiClient.post('/api/scan/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// ============================================
// 챗봇 관련 API
// ============================================

/**
 * 챗봇 질의 전송
 * 텍스트 메시지로 독성 물질에 대해 질문
 * 
 * @param {string} message - 사용자 질문 메시지
 * @returns {Promise<Object>} 챗봇 응답 (answer, relatedItems 포함)
 */
export const askChat = async (message) => {
  const response = await apiClient.post('/api/chat/ask', { message });
  return response.data;
};

// ============================================
// 타임라인 관련 API
// ============================================

/**
 * 특정 고양이의 타임라인 기록 조회
 * 
 * @param {string} catId - 고양이 ObjectId
 * @param {Object} [filters] - 선택적 필터
 * @param {string} [filters.startDate] - 시작일 (ISO 8601)
 * @param {string} [filters.endDate] - 종료일 (ISO 8601)
 * @param {string} [filters.type] - 이벤트 유형 필터
 * @returns {Promise<Object>} 타임라인 기록 목록
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
 * 타임라인에 새 기록 추가
 * 
 * @param {Object} entry - 타임라인 항목
 * @param {string} entry.catId - 고양이 ID
 * @param {string} entry.type - 이벤트 유형
 * @param {string} entry.content - 내용
 * @param {string} [entry.riskLevel] - 위험도
 * @param {string} [entry.imageUrl] - 이미지 URL
 * @param {number} [entry.palatabilityRating] - 기호성 별점
 * @returns {Promise<Object>} 생성된 기록
 */
export const addTimelineEntry = async (entry) => {
  const response = await apiClient.post('/api/timeline', entry);
  return response.data;
};

// ============================================
// 헬스 체크 API
// ============================================

/**
 * 서버 상태 확인
 * 서버가 정상 동작 중인지 확인합니다.
 * 
 * @returns {Promise<Object>} 서버 상태 정보
 */
export const checkHealth = async () => {
  const response = await apiClient.get('/api/health');
  return response.data;
};

export default apiClient;
