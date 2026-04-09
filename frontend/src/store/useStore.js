/**
 * ============================================
 * Zustand 전역 상태 관리 스토어 (PWA 웹 버전)
 * ============================================
 * 인증 상태, 스캔 결과, 챗봇, 타임라인, 고양이 프로필을 관리합니다.
 * localStorage와 연동하여 페이지 새로고침 시에도 로그인 유지.
 */

import { create } from 'zustand';

/**
 * localStorage에서 인증 정보 복원 시도
 * 페이지 새로고침 시 자동 로그인 유지에 사용
 */
const loadAuthFromStorage = () => {
  try {
    const token = localStorage.getItem('purrfect_token');
    const userStr = localStorage.getItem('purrfect_user');
    if (token && userStr) {
      return { token, user: JSON.parse(userStr), isAuthenticated: true };
    }
  } catch {
    localStorage.removeItem('purrfect_token');
    localStorage.removeItem('purrfect_user');
  }
  return { token: null, user: null, isAuthenticated: false };
};

const savedAuth = loadAuthFromStorage();

const useStore = create((set, get) => ({
  // ─── 인증 상태 ───
  token: savedAuth.token,
  user: savedAuth.user,
  isAuthenticated: savedAuth.isAuthenticated,

  login: (token, user) => {
    localStorage.setItem('purrfect_token', token);
    localStorage.setItem('purrfect_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('purrfect_token');
    localStorage.removeItem('purrfect_user');
    localStorage.removeItem('purrfect_selectedCatId');
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      chatHistory: [],
      timelineData: [],
      scanResult: null,
      cats: [],
      selectedCat: null,
    });
  },

  // ─── 고양이 프로필 ───
  cats: [],
  selectedCat: null,
  setCats: (cats) => {
    const state = get();
    const savedCatId = localStorage.getItem('purrfect_selectedCatId');
    let selected = cats.find(c => c._id === savedCatId) || cats[0] || null;
    set({ cats, selectedCat: selected });
  },
  setSelectedCat: (cat) => {
    if (cat?._id) localStorage.setItem('purrfect_selectedCatId', cat._id);
    set({ selectedCat: cat });
  },
  addCat: (cat) => set((state) => {
    const newCats = [...state.cats, cat];
    const selected = state.selectedCat || cat;
    return { cats: newCats, selectedCat: selected };
  }),
  updateCatInList: (updatedCat) => set((state) => ({
    cats: state.cats.map(c => c._id === updatedCat._id ? updatedCat : c),
    selectedCat: state.selectedCat?._id === updatedCat._id ? updatedCat : state.selectedCat,
  })),
  removeCat: (catId) => set((state) => {
    const newCats = state.cats.filter(c => c._id !== catId);
    const selected = state.selectedCat?._id === catId ? (newCats[0] || null) : state.selectedCat;
    return { cats: newCats, selectedCat: selected };
  }),

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
}));

export default useStore;
