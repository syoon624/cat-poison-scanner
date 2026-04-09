/**
 * ============================================
 * Zustand 전역 상태 관리 스토어
 * ============================================
 * 
 * 앱 전체에서 공유되는 전역 상태를 관리합니다.
 * 
 * 관리 상태:
 * - scanResult: 최근 스캔 결과
 * - chatHistory: 챗봇 대화 기록
 * - timelineData: 타임라인 기록
 * - selectedCat: 현재 선택된 고양이 정보
 * - isLoading: 글로벌 로딩 상태
 */

import { create } from 'zustand';

const useStore = create((set, get) => ({
  // ─── 스캔 결과 상태 ───
  scanResult: null,          // 최근 스캔 분석 결과
  isScanning: false,         // 스캔 진행 중 여부

  /**
   * 스캔 결과 저장
   * @param {Object} result - 서버로부터 받은 스캔 분석 결과
   */
  setScanResult: (result) => set({ scanResult: result }),

  /**
   * 스캔 진행 상태 토글
   * @param {boolean} loading - 스캔 중 여부
   */
  setIsScanning: (loading) => set({ isScanning: loading }),

  /**
   * 스캔 결과 초기화 (새 스캔 시작 시)
   */
  clearScanResult: () => set({ scanResult: null }),

  // ─── 챗봇 상태 ───
  chatHistory: [],           // 대화 기록 배열 [{ role: 'user'|'bot', message: string }]
  isChatLoading: false,      // 챗봇 응답 대기 중 여부

  /**
   * 챗봇 대화 기록에 메시지 추가
   * @param {Object} message - { role: 'user'|'bot', message: string, timestamp: Date }
   */
  addChatMessage: (message) => set((state) => ({
    chatHistory: [...state.chatHistory, {
      ...message,
      timestamp: new Date().toISOString()
    }]
  })),

  /**
   * 챗봇 로딩 상태 설정
   * @param {boolean} loading - 응답 대기 중 여부
   */
  setChatLoading: (loading) => set({ isChatLoading: loading }),

  /**
   * 대화 기록 전체 초기화
   */
  clearChatHistory: () => set({ chatHistory: [] }),

  // ─── 타임라인 상태 ───
  timelineData: [],          // 타임라인 기록 배열
  isTimelineLoading: false,  // 타임라인 로딩 중 여부

  /**
   * 타임라인 데이터 설정 (서버에서 가져온 데이터로 교체)
   * @param {Array} data - 타임라인 기록 배열
   */
  setTimelineData: (data) => set({ timelineData: data }),

  /**
   * 타임라인에 새 기록 추가 (로컬 상태에 즉시 반영)
   * @param {Object} entry - 새 타임라인 항목
   */
  addTimelineEntry: (entry) => set((state) => ({
    timelineData: [entry, ...state.timelineData]
  })),

  /**
   * 타임라인 로딩 상태 설정
   * @param {boolean} loading - 로딩 중 여부
   */
  setTimelineLoading: (loading) => set({ isTimelineLoading: loading }),

  // ─── 선택된 고양이 정보 ───
  // Mock 고양이 데이터 (인증/프로필 구현 전 테스트용)
  selectedCat: {
    _id: 'mock_cat_001',
    name: '나비',
    birthDate: '2023-03-15',
    weight: 4.2,
    preExistingConditions: []
  },

  /**
   * 선택된 고양이 변경
   * @param {Object} cat - 고양이 프로필 정보
   */
  setSelectedCat: (cat) => set({ selectedCat: cat }),
}));

export default useStore;
