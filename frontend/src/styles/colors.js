/**
 * ============================================
 * PurrfectScan 앱 컬러 팔레트 (PWA 웹 버전)
 * ============================================
 * 앱 전체에서 일관된 색상을 사용하기 위한 상수 정의.
 * React Native 버전과 동일한 색상 체계를 유지합니다.
 */

export const COLORS = {
  primary: '#6C63FF',
  primaryDark: '#5A52D5',
  primaryLight: '#8B83FF',
  safe: '#4CAF50',
  safeLight: '#E8F5E9',
  warning: '#FF9800',
  warningLight: '#FFF3E0',
  toxic: '#FF1744',
  toxicLight: '#FFEBEE',
  background: '#F5F5F7',
  surface: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  plant: '#66BB6A',
  ingredient: '#42A5F5',
  chat: '#AB47BC',
  symptom: '#EF5350',
  hospital: '#26A69A',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#9E9E9E',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

/**
 * 위험도(riskLevel)에 따른 색상 반환
 * @param {string} riskLevel - 'SAFE' | 'WARNING' | 'TOXIC' | 'NONE'
 * @returns {{ main: string, light: string }}
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
 * @returns {string}
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
