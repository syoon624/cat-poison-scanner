/**
 * ============================================
 * TimelineItem - 타임라인 개별 항목 컴포넌트
 * ============================================
 * 
 * 수직 트리 구조의 타임라인에서 각 이벤트를 표시합니다.
 * 
 * UI 구조 (명세서 요구사항):
 * - CSS border-left를 활용한 수직 연결선
 * - ::before/::after 역할의 원형 노드 (View로 구현)
 * - 이벤트 타입별 아이콘 및 색상
 * - 위험도별 배경색 피드백
 * 
 * 시각적 예시:
 *   ● [14:00] 백합 스캔 (위험)      ← 빨간 노드
 *   │
 *   ● [15:30] 구토 증상 기록        ← 회색 노드
 *   │
 *   ● [16:00] 병원 방문             ← 청록 노드
 * 
 * Props:
 * @param {Object} item - 타임라인 항목 데이터
 * @param {boolean} isFirst - 첫 번째 항목 여부
 * @param {boolean} isLast - 마지막 항목 여부
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, getRiskColor, getTypeColor } from '../styles/colors';

export default function TimelineItem({ item, isFirst, isLast }) {
  // 이벤트 타입에 따른 색상 결정
  const typeColor = getTypeColor(item.type);
  
  // 위험도에 따른 색상 (riskLevel이 있는 경우)
  const riskColor = getRiskColor(item.riskLevel);

  /**
   * 이벤트 타입별 아이콘 매핑
   */
  const getTypeIcon = (type) => {
    const icons = {
      PLANT: '🌿',
      INGREDIENT: '🏷️',
      CHAT: '💬',
      SYMPTOM: '🤒',
      HOSPITAL: '🏥',
    };
    return icons[type] || '📌';
  };

  /**
   * 이벤트 타입별 라벨 매핑 (한글)
   */
  const getTypeLabel = (type) => {
    const labels = {
      PLANT: '식물/사물 스캔',
      INGREDIENT: '성분표 스캔',
      CHAT: '냥챗 질의',
      SYMPTOM: '증상 기록',
      HOSPITAL: '병원 방문',
    };
    return labels[type] || '기록';
  };

  /**
   * 타임스탬프 포맷팅 (시:분 형식)
   */
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * 날짜 포맷팅 (월/일 형식)
   */
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * 기호성 별점 렌더링 (1~5)
   * 사료/간식 급여 후 기록된 별점을 표시
   */
  const renderStars = (rating) => {
    if (!rating) return null;
    return (
      <View style={styles.starsContainer}>
        <Text style={styles.starsLabel}>기호성: </Text>
        {[1, 2, 3, 4, 5].map(star => (
          <Text key={star} style={styles.star}>
            {star <= rating ? '⭐' : '☆'}
          </Text>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* ─── 왼쪽: 시간 표시 영역 ─── */}
      <View style={styles.timeColumn}>
        <Text style={styles.timeText}>{formatTime(item.timestamp)}</Text>
        <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
      </View>

      {/* ─── 중앙: 수직 연결선 + 노드 ─── */}
      <View style={styles.lineColumn}>
        {/* 상단 연결선 (첫 번째 아이템이 아닐 때만 표시) */}
        <View style={[
          styles.lineTop,
          !isFirst && { backgroundColor: COLORS.border }
        ]} />
        
        {/* 원형 노드 - 이벤트 타입 색상으로 표시 */}
        <View style={[styles.node, { backgroundColor: typeColor }]}>
          <Text style={styles.nodeIcon}>{getTypeIcon(item.type)}</Text>
        </View>
        
        {/* 하단 연결선 (마지막 아이템이 아닐 때만 표시) */}
        <View style={[
          styles.lineBottom,
          !isLast && { backgroundColor: COLORS.border }
        ]} />
      </View>

      {/* ─── 오른쪽: 이벤트 내용 카드 ─── */}
      <View style={[
        styles.contentCard,
        // 위험도가 있으면 왼쪽 테두리에 색상 표시
        item.riskLevel !== 'NONE' && { borderLeftColor: riskColor.main, borderLeftWidth: 3 }
      ]}>
        {/* 이벤트 타입 라벨 + 위험도 뱃지 */}
        <View style={styles.cardHeader}>
          <Text style={[styles.typeLabel, { color: typeColor }]}>
            {getTypeLabel(item.type)}
          </Text>
          {item.riskLevel && item.riskLevel !== 'NONE' && (
            <View style={[styles.riskBadge, { backgroundColor: riskColor.light }]}>
              <Text style={[styles.riskBadgeText, { color: riskColor.main }]}>
                {item.riskLevel === 'TOXIC' ? '위험' :
                 item.riskLevel === 'WARNING' ? '주의' : '안전'}
              </Text>
            </View>
          )}
        </View>

        {/* 이벤트 내용 */}
        <Text style={styles.contentText}>{item.content}</Text>

        {/* 기호성 별점 (사료/간식인 경우) */}
        {item.palatabilityRating && renderStars(item.palatabilityRating)}
      </View>
    </View>
  );
}

// ============================================
// 스타일 정의
// ============================================
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    minHeight: 80,
  },

  // ─── 왼쪽: 시간 열 ───
  timeColumn: {
    width: 55,
    alignItems: 'flex-end',
    paddingRight: 12,
    paddingTop: 12,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  dateText: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 2,
  },

  // ─── 중앙: 연결선 + 노드 열 ───
  // border-left 역할을 하는 수직 연결선 구현
  lineColumn: {
    width: 40,
    alignItems: 'center',
  },
  // 상단 수직선 (::before 역할)
  lineTop: {
    width: 2,
    height: 16,
    backgroundColor: 'transparent',
  },
  // 원형 노드 (타임라인의 각 이벤트 포인트)
  node: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
    // 그림자 효과 (iOS)
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // 그림자 효과 (Android)
    elevation: 3,
  },
  nodeIcon: {
    fontSize: 14,
  },
  // 하단 수직선 (::after 역할)
  lineBottom: {
    width: 2,
    flex: 1,
    backgroundColor: 'transparent',
  },

  // ─── 오른쪽: 내용 카드 ───
  contentCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    marginLeft: 4,
    // 그림자
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ─── 위험도 뱃지 ───
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // ─── 내용 텍스트 ───
  contentText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },

  // ─── 기호성 별점 ───
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  starsLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  star: {
    fontSize: 14,
  },
});
