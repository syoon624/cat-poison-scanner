/**
 * ============================================
 * TimelineScreen - 타임라인 기반 건강 캘린더 화면
 * ============================================
 * 
 * 반려묘의 건강 이벤트를 시간순으로 표시하는 화면입니다.
 * 수직 트리 구조의 타임라인 UI로 사건의 흐름을 시각화합니다.
 * 
 * 기능:
 * - 타임라인 기록 시간순 조회
 * - 이벤트 타입별 필터링
 * - 수동 기록 추가 (증상, 병원 방문 등)
 * - 기호성(별점) 기록
 * - 위험도별 컬러 코딩
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { COLORS, getRiskColor, getTypeColor } from '../styles/colors';
import { getTimeline, addTimelineEntry } from '../services/api';
import useStore from '../store/useStore';
import TimelineItem from '../components/TimelineItem';

export default function TimelineScreen() {
  // ─── 로컬 상태 ───
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 활성 필터
  const [showAddModal, setShowAddModal] = useState(false); // 기록 추가 모달
  const [newEntry, setNewEntry] = useState({
    type: 'SYMPTOM',
    content: '',
    riskLevel: 'NONE',
  });

  // ─── 전역 상태 (Zustand) ───
  const {
    timelineData,
    setTimelineData,
    addTimelineEntry: addToStore,
    isTimelineLoading,
    setTimelineLoading,
    selectedCat,
  } = useStore();

  /**
   * 컴포넌트 마운트 시 타임라인 데이터 로드
   */
  useEffect(() => {
    loadTimeline();
  }, []);

  /**
   * 서버에서 타임라인 데이터 조회
   * 서버 연결 실패 시 Mock 데이터를 사용
   */
  const loadTimeline = async () => {
    setTimelineLoading(true);
    try {
      const response = await getTimeline(selectedCat._id);
      if (response.success) {
        setTimelineData(response.timeline);
      }
    } catch (error) {
      console.log('타임라인 서버 연결 실패, Mock 데이터 사용:', error.message);
      // Mock 타임라인 데이터 (개발용)
      setTimelineData(getMockTimeline());
    } finally {
      setTimelineLoading(false);
    }
  };

  /**
   * 당겨서 새로고침 핸들러
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTimeline();
    setRefreshing(false);
  }, []);

  /**
   * 새 타임라인 기록 추가 처리
   */
  const handleAddEntry = async () => {
    if (!newEntry.content.trim()) {
      Alert.alert('알림', '내용을 입력해주세요.');
      return;
    }

    try {
      const entryData = {
        catId: selectedCat._id,
        type: newEntry.type,
        content: newEntry.content,
        riskLevel: newEntry.riskLevel,
      };

      await addTimelineEntry(entryData);
    } catch (error) {
      console.log('서버 저장 실패, 로컬에만 추가:', error.message);
    }

    // 로컬 상태에 즉시 추가 (서버 응답과 관계없이)
    addToStore({
      _id: 'local_' + Date.now(),
      catId: selectedCat._id,
      type: newEntry.type,
      content: newEntry.content,
      riskLevel: newEntry.riskLevel,
      timestamp: new Date().toISOString(),
    });

    // 모달 닫기 및 입력 초기화
    setShowAddModal(false);
    setNewEntry({ type: 'SYMPTOM', content: '', riskLevel: 'NONE' });
  };

  /**
   * 타입 필터에 따라 타임라인 데이터 필터링
   */
  const filteredData = activeFilter === 'ALL'
    ? timelineData
    : timelineData.filter(item => item.type === activeFilter);

  /**
   * Mock 타임라인 데이터 생성 (서버 미연결 시)
   */
  const getMockTimeline = () => {
    const now = new Date();
    return [
      {
        _id: 'mock_1',
        type: 'PLANT',
        content: '백합 (Lily) - 거실에서 발견',
        riskLevel: 'TOXIC',
        timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: 'mock_2',
        type: 'SYMPTOM',
        content: '구토 증상 발견 - 2회',
        riskLevel: 'NONE',
        timestamp: new Date(now.getTime() - 4.5 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: 'mock_3',
        type: 'HOSPITAL',
        content: '동물병원 방문 - 수액 처치 완료',
        riskLevel: 'NONE',
        timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: 'mock_4',
        type: 'INGREDIENT',
        content: '오리젠 캣&키튼 사료 성분 스캔 - 안전',
        riskLevel: 'SAFE',
        palatabilityRating: 4,
        timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: 'mock_5',
        type: 'CHAT',
        content: '"참치캔 급여해도 될까요?" 질의',
        riskLevel: 'WARNING',
        timestamp: new Date(now.getTime() - 0.5 * 60 * 60 * 1000).toISOString(),
      },
    ];
  };

  // ─── 이벤트 유형 필터 버튼 목록 ───
  const filterOptions = [
    { key: 'ALL', label: '전체', icon: '📋' },
    { key: 'PLANT', label: '식물', icon: '🌿' },
    { key: 'INGREDIENT', label: '성분', icon: '🏷️' },
    { key: 'SYMPTOM', label: '증상', icon: '🤒' },
    { key: 'HOSPITAL', label: '병원', icon: '🏥' },
    { key: 'CHAT', label: '챗봇', icon: '💬' },
  ];

  // ─── 기록 추가 시 선택 가능한 이벤트 유형 ───
  const entryTypes = [
    { key: 'SYMPTOM', label: '🤒 증상 기록' },
    { key: 'HOSPITAL', label: '🏥 병원 방문' },
    { key: 'PLANT', label: '🌿 식물/사물' },
    { key: 'INGREDIENT', label: '🏷️ 사료/간식' },
  ];

  return (
    <View style={styles.container}>
      {/* 헤더 - 고양이 이름 + 날짜 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>📅 {selectedCat.name}의 타임라인</Text>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('ko-KR', {
              year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
            })}
          </Text>
        </View>
        {/* 기록 추가 버튼 */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+ 기록</Text>
        </TouchableOpacity>
      </View>

      {/* 이벤트 유형 필터 바 (가로 스크롤) */}
      <View style={styles.filterBar}>
        <FlatList
          horizontal
          data={filterOptions}
          keyExtractor={item => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === item.key && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(item.key)}
            >
              <Text style={[
                styles.filterText,
                activeFilter === item.key && styles.filterTextActive,
              ]}>
                {item.icon} {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* 타임라인 목록 */}
      <FlatList
        data={filteredData}
        keyExtractor={item => item._id}
        renderItem={({ item, index }) => (
          <TimelineItem
            item={item}
            isFirst={index === 0}
            isLast={index === filteredData.length - 1}
          />
        )}
        contentContainerStyle={styles.timelineList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>기록이 없습니다</Text>
            <Text style={styles.emptySubtext}>
              스캔 결과나 증상을 기록해보세요
            </Text>
          </View>
        }
      />

      {/* 기록 추가 모달 */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📝 새 기록 추가</Text>

            {/* 이벤트 유형 선택 */}
            <Text style={styles.modalLabel}>기록 유형</Text>
            <View style={styles.typeSelector}>
              {entryTypes.map(t => (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    styles.typeOption,
                    newEntry.type === t.key && styles.typeOptionActive,
                  ]}
                  onPress={() => setNewEntry({ ...newEntry, type: t.key })}
                >
                  <Text style={[
                    styles.typeOptionText,
                    newEntry.type === t.key && styles.typeOptionTextActive,
                  ]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 내용 입력 */}
            <Text style={styles.modalLabel}>내용</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="기록 내용을 입력하세요..."
              placeholderTextColor={COLORS.textLight}
              value={newEntry.content}
              onChangeText={(text) => setNewEntry({ ...newEntry, content: text })}
              multiline
              numberOfLines={3}
            />

            {/* 버튼 그룹 */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddEntry}
              >
                <Text style={styles.saveButtonText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================
// 스타일 정의
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ─── 헤더 ───
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },

  // ─── 필터 바 ───
  filterBar: {
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },

  // ─── 타임라인 리스트 ───
  timelineList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  // ─── 빈 상태 ───
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.textLight,
  },

  // ─── 기록 추가 모달 ───
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },

  // ─── 유형 선택 ───
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  typeOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeOptionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  typeOptionTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },

  // ─── 내용 입력 ───
  modalInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },

  // ─── 모달 버튼 ───
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
});
