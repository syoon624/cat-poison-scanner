/**
 * ============================================
 * PurrfectScan 앱 컬러 팔레트
 * ============================================
 * 앱 전체에서 일관된 색상을 사용하기 위한 상수 정의.
 * 
 * 위험도 색상 체계:
 * - SAFE: 초록색 계열 → 안전함을 직관적으로 전달
 * - WARNING: 노란/주황 계열 → 주의 필요
 * - TOXIC: 빨강/네온 레드 계열 → 즉각적 위험 경고
 */

export const COLORS = {
  // ─── 메인 브랜드 컬러 ───
  primary: '#6C63FF',       // 보라색 - 메인 테마 컬러
  primaryDark: '#5A52D5',   // 진한 보라 - 버튼 누름 상태
  primaryLight: '#8B83FF',  // 밝은 보라 - 하이라이트
  
  // ─── 위험도 표시 컬러 (스캔 결과 피드백) ───
  safe: '#4CAF50',          // 초록 - 안전
  safeLight: '#E8F5E9',     // 연초록 - 안전 배경
  warning: '#FF9800',       // 주황 - 주의
  warningLight: '#FFF3E0',  // 연주황 - 주의 배경
  toxic: '#FF1744',         // 네온 레드 - 위험/독성 (명세서 요구사항)
  toxicLight: '#FFEBEE',    // 연빨강 - 위험 배경
  
  // ─── 기본 UI 컬러 ───
  background: '#F5F5F7',    // 앱 배경
  surface: '#FFFFFF',       // 카드/서피스 배경
  text: '#1A1A2E',          // 메인 텍스트
  textSecondary: '#6B7280', // 보조 텍스트
  textLight: '#9CA3AF',     // 비활성 텍스트
  border: '#E5E7EB',        // 테두리
  
  // ─── 타임라인 이벤트 타입별 컬러 ───
  plant: '#66BB6A',         // 식물 스캔
  ingredient: '#42A5F5',    // 성분표 스캔
  chat: '#AB47BC',          // 챗봇 질의
  symptom: '#EF5350',       // 증상 기록
  hospital: '#26A69A',      // 병원 방문
  
  // ─── 기타 ───
  white: '#FFFFFF',
  black: '#000000',
  gray: '#9E9E9E',
  overlay: 'rgba(0, 0, 0, 0.5)', // 모달 오버레이
};

/**
 * 위험도(riskLevel)에 따른 색상 반환 유틸리티
 * @param {string} riskLevel - 'SAFE' | 'WARNING' | 'TOXIC' | 'NONE'
 * @returns {{ main: string, light: string }} 메인 색상과 배경 색상
 */
export const getRiskColor = (riskLevel) => {
  switch (riskLevel) {
    case 'SAFE':
      return { main: COLORS.safe, light: COLORS.safeLight };
    case 'WARNING':
      return { main: COLORS.warning, light: COLORS.warningLight };
    case 'TOXIC':
      return { main: COLORS.toxic, light: COLORS.toxicLight };
    default:
      return { main: COLORS.gray, light: COLORS.background };
  }
};

/**
 * 타임라인 이벤트 타입에 따른 색상 반환
 * @param {string} type - 'PLANT' | 'INGREDIENT' | 'CHAT' | 'SYMPTOM' | 'HOSPITAL'
 * @returns {string} 해당 타입의 색상
 */
export const getTypeColor = (type) => {
  const typeColors = {
    PLANT: COLORS.plant,
    INGREDIENT: COLORS.ingredient,
    CHAT: COLORS.chat,
    SYMPTOM: COLORS.symptom,
    HOSPITAL: COLORS.hospital,
  };
  return typeColors[type] || COLORS.gray;
};
