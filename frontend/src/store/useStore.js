/**
 * ============================================
 * Zustand 전역 상태 관리 스토어 (PWA 웹 버전)
 * ============================================
 * React Native 버전과 동일한 상태 구조.
 * Zustand는 React 웹에서도 그대로 사용 가능합니다.
 */

import { create } from 'zustand';

const useStore = create((set) => ({
  // ─── 스캔 결과 ───
  scanResult: null,
  isScanning: false,
  setScanResult: (result) => set({ scanResult: result }),
  setIsScanning: (loading) => set({ isScanning: loading }),
  clearScanResult: () => set({ scanResult: null }),

  // ─── 챗봇 ───
  chatHistory: [],
  isChatLoading: false,
  addChatMessage: (message) => set((state) => ({
    chatHistory: [...state.chatHistory, {
      ...message,
      timestamp: new Date().toISOString(),
    }],
  })),
  setChatLoading: (loading) => set({ isChatLoading: loading }),
  clearChatHistory: () => set({ chatHistory: [] }),

  // ─── 타임라인 ───
  timelineData: [],
  isTimelineLoading: false,
  setTimelineData: (data) => set({ timelineData: data }),
  addTimelineEntry: (entry) => set((state) => ({
    timelineData: [entry, ...state.timelineData],
  })),
  setTimelineLoading: (loading) => set({ isTimelineLoading: loading }),

  // ─── 선택된 고양이 (Mock) ───
  selectedCat: {
    _id: 'mock_cat_001',
    name: '나비',
    birthDate: '2023-03-15',
    weight: 4.2,
    preExistingConditions: [],
  },
  setSelectedCat: (cat) => set({ selectedCat: cat }),
}));

export default useStore;
