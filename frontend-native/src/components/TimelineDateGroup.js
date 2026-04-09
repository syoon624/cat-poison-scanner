/**
 * ============================================
 * TimelineDateGroup - 날짜별 타임라인 그룹 컴포넌트
 * ============================================
 * 
 * 타임라인 데이터를 날짜별로 묶어서 표시합니다.
 * 각 날짜 그룹은 헤더(날짜)와 하위 이벤트 목록으로 구성됩니다.
 * 
 * UI 구조:
 * ┌─ 2024년 12월 15일 (일) ─────────┐
 * │ ● [14:00] 백합 스캔 (위험)       │
 * │ │                                │
 * │ ● [15:30] 구토 증상              │
 * │ │                                │
 * │ ● [16:00] 병원 방문              │
 * └──────────────────────────────────┘
 * 
 * Props:
 * @param {string} date - 날짜 문자열 (YYYY-MM-DD)
 * @param {Array} items - 해당 날짜의 타임라인 항목 배열
 * @param {boolean} isToday - 오늘 날짜 여부
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../styles/colors';
import TimelineItem from './TimelineItem';

export default function TimelineDateGroup({ date, items, isToday }) {
  /**
   * 날짜 문자열을 한국어 형식으로 변환
   * 예: "2024-12-15" → "12월 15일 (일)"
   */
  const formatDateHeader = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  return (
    <View style={styles.container}>
      {/* ─── 날짜 헤더 ─── */}
      <View style={styles.dateHeader}>
        {/* 오늘 날짜 표시 뱃지 */}
        {isToday && (
          <View style={styles.todayBadge}>
            <Text style={styles.todayText}>오늘</Text>
          </View>
        )}
        <Text style={[styles.dateText, isToday && styles.todayDateText]}>
          {formatDateHeader(date)}
        </Text>
        {/* 이벤트 개수 표시 */}
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{items.length}건</Text>
        </View>
      </View>

      {/* ─── 해당 날짜의 타임라인 항목들 ─── */}
      <View style={styles.itemsContainer}>
        {items.map((item, index) => (
          <TimelineItem
            key={item._id}
            item={item}
            isFirst={index === 0}
            isLast={index === items.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

// ============================================
// 스타일 정의
// ============================================
const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },

  // ─── 날짜 헤더 ───
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  todayDateText: {
    color: COLORS.primary,
  },

  // ─── 오늘 뱃지 ───
  todayBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  todayText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },

  // ─── 이벤트 개수 뱃지 ───
  countBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  countText: {
    color: COLORS.textLight,
    fontSize: 11,
    fontWeight: '600',
  },

  // ─── 아이템 목록 컨테이너 ───
  itemsContainer: {
    paddingLeft: 4,
  },
});
