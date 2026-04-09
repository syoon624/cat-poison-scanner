/**
 * ============================================
 * TimelinePage - 타임라인 건강 기록 페이지 (PWA 웹 버전)
 * ============================================
 * React Native FlatList → HTML div + map으로 변환
 * Modal → CSS 기반 모달로 변환
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getTimeline, addTimelineEntry } from '../services/api';
import useStore from '../store/useStore';
import TimelineItem from '../components/TimelineItem';
import TimelineDateGroup from '../components/TimelineDateGroup';
import './TimelinePage.css';

export default function TimelinePage() {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState({ type: 'SYMPTOM', content: '', riskLevel: 'NONE' });

  const {
    timelineData, setTimelineData,
    addTimelineEntry: addToStore,
    isTimelineLoading, setTimelineLoading,
    selectedCat,
  } = useStore();

  useEffect(() => { loadTimeline(); }, []);

  const loadTimeline = async () => {
    setTimelineLoading(true);
    try {
      const response = await getTimeline(selectedCat._id);
      if (response.success) setTimelineData(response.timeline);
    } catch {
      setTimelineData(getMockTimeline());
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleAddEntry = async () => {
    if (!newEntry.content.trim()) { alert('내용을 입력해주세요.'); return; }
    try {
      await addTimelineEntry({ catId: selectedCat._id, ...newEntry });
    } catch (e) { console.log('서버 저장 실패, 로컬 추가:', e.message); }
    addToStore({
      _id: 'local_' + Date.now(), catId: selectedCat._id,
      ...newEntry, timestamp: new Date().toISOString(),
    });
    setShowAddModal(false);
    setNewEntry({ type: 'SYMPTOM', content: '', riskLevel: 'NONE' });
  };

  const filteredData = activeFilter === 'ALL'
    ? timelineData : timelineData.filter((i) => i.type === activeFilter);

  const groupedData = useMemo(() => {
    const groups = {};
    const today = new Date().toISOString().split('T')[0];
    filteredData.forEach((item) => {
      const dateKey = new Date(item.timestamp).toISOString().split('T')[0];
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    });
    return Object.keys(groups)
      .sort((a, b) => new Date(b) - new Date(a))
      .map((date) => ({
        date,
        items: groups[date].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
        isToday: date === today,
      }));
  }, [filteredData]);

  const getMockTimeline = () => {
    const now = new Date();
    const DAY = 86400000;
    return [
      { _id: 'mock_1', type: 'PLANT', content: '백합 (Lily) - 거실에서 발견', riskLevel: 'TOXIC', timestamp: new Date(now - 6*3600000).toISOString() },
      { _id: 'mock_2', type: 'SYMPTOM', content: '구토 증상 발견 - 2회', riskLevel: 'NONE', timestamp: new Date(now - 4.5*3600000).toISOString() },
      { _id: 'mock_3', type: 'HOSPITAL', content: '동물병원 방문 - 수액 처치 완료', riskLevel: 'NONE', timestamp: new Date(now - 3*3600000).toISOString() },
      { _id: 'mock_4', type: 'INGREDIENT', content: '오리젠 캣&키튼 사료 성분 스캔 - 안전', riskLevel: 'SAFE', palatabilityRating: 4, timestamp: new Date(now - DAY - 2*3600000).toISOString() },
      { _id: 'mock_5', type: 'CHAT', content: '"참치캔 급여해도 될까요?" 질의', riskLevel: 'WARNING', timestamp: new Date(now - DAY - 5*3600000).toISOString() },
      { _id: 'mock_6', type: 'INGREDIENT', content: '츄르 참치맛 성분표 스캔 - 안전', riskLevel: 'SAFE', palatabilityRating: 5, timestamp: new Date(now - DAY - 8*3600000).toISOString() },
      { _id: 'mock_7', type: 'PLANT', content: '접란 (Spider Plant) - 베란다에서 스캔', riskLevel: 'SAFE', timestamp: new Date(now - 3*DAY - 4*3600000).toISOString() },
      { _id: 'mock_8', type: 'SYMPTOM', content: '식욕 정상, 활동량 양호', riskLevel: 'NONE', timestamp: new Date(now - 3*DAY - 10*3600000).toISOString() },
    ];
  };

  const filterOptions = [
    { key: 'ALL', label: '전체', icon: '📋' },
    { key: 'PLANT', label: '식물', icon: '🌿' },
    { key: 'INGREDIENT', label: '성분', icon: '🏷️' },
    { key: 'SYMPTOM', label: '증상', icon: '🤒' },
    { key: 'HOSPITAL', label: '병원', icon: '🏥' },
    { key: 'CHAT', label: '챗봇', icon: '💬' },
  ];

  const entryTypes = [
    { key: 'SYMPTOM', label: '🤒 증상 기록' },
    { key: 'HOSPITAL', label: '🏥 병원 방문' },
    { key: 'PLANT', label: '🌿 식물/사물' },
    { key: 'INGREDIENT', label: '🏷️ 사료/간식' },
  ];

  return (
    <div className="timeline-page">
      {/* 헤더 */}
      <div className="tl-header">
        <div>
          <h2>📅 {selectedCat.name}의 타임라인</h2>
          <p>{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
        </div>
        <button className="add-btn" onClick={() => setShowAddModal(true)}>+ 기록</button>
      </div>

      {/* 필터 바 */}
      <div className="filter-bar">
        {filterOptions.map((f) => (
          <button
            key={f.key}
            className={`filter-chip ${activeFilter === f.key ? 'active' : ''}`}
            onClick={() => setActiveFilter(f.key)}
          >{f.icon} {f.label}</button>
        ))}
      </div>

      {/* 타임라인 목록 */}
      <div className="tl-body">
        {groupedData.length === 0 ? (
          <div className="tl-empty">
            <span>📝</span>
            <p>기록이 없습니다</p>
            <small>스캔 결과나 증상을 기록해보세요</small>
          </div>
        ) : (
          groupedData.map((group) => (
            <TimelineDateGroup key={group.date} date={group.date} items={group.items} isToday={group.isToday} />
          ))
        )}
      </div>

      {/* 기록 추가 모달 */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>📝 새 기록 추가</h3>
            <label className="modal-label">기록 유형</label>
            <div className="type-selector">
              {entryTypes.map((t) => (
                <button
                  key={t.key}
                  className={`type-option ${newEntry.type === t.key ? 'active' : ''}`}
                  onClick={() => setNewEntry({ ...newEntry, type: t.key })}
                >{t.label}</button>
              ))}
            </div>
            <label className="modal-label">내용</label>
            <textarea
              className="modal-input"
              placeholder="기록 내용을 입력하세요..."
              value={newEntry.content}
              onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
              rows={3}
            />
            <div className="modal-buttons">
              <button className="cancel-btn" onClick={() => setShowAddModal(false)}>취소</button>
              <button className="save-btn" onClick={handleAddEntry}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
