/**
 * ============================================
 * TimelinePage - 타임라인 건강 기록 페이지 (PWA 웹 버전)
 * ============================================
 * 인증된 사용자의 고양이별 타임라인을 표시합니다.
 * Mock 데이터 없이 실제 DB 데이터만 사용.
 * 기록 추가, 수정, 삭제 기능 포함.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getTimeline, addTimelineEntry, deleteTimelineEntry } from '../services/api';
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

  const loadTimeline = useCallback(async () => {
    if (!selectedCat?._id) return;
    setTimelineLoading(true);
    try {
      const response = await getTimeline(selectedCat._id);
      if (response.success) {
        setTimelineData(response.timeline);
      }
    } catch (err) {
      console.error('타임라인 로드 실패:', err);
      setTimelineData([]);
    } finally {
      setTimelineLoading(false);
    }
  }, [selectedCat?._id, setTimelineData, setTimelineLoading]);

  useEffect(() => { loadTimeline(); }, [loadTimeline]);

  const handleAddEntry = async () => {
    if (!newEntry.content.trim()) { alert('내용을 입력해주세요.'); return; }
    if (!selectedCat?._id) { alert('먼저 고양이를 등록해주세요.'); return; }

    try {
      const result = await addTimelineEntry({ catId: selectedCat._id, ...newEntry });
      if (result.success) {
        addToStore(result.entry);
      }
    } catch (e) {
      console.error('타임라인 저장 실패:', e.message);
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    }
    setShowAddModal(false);
    setNewEntry({ type: 'SYMPTOM', content: '', riskLevel: 'NONE' });
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('이 기록을 삭제할까요?')) return;
    try {
      await deleteTimelineEntry(entryId);
      setTimelineData(timelineData.filter(item => item._id !== entryId));
    } catch (err) {
      console.error('기록 삭제 실패:', err);
      alert('삭제에 실패했습니다.');
    }
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
      <div className="tl-header">
        <div>
          <h2>📅 {selectedCat?.name || '고양이'}의 타임라인</h2>
          <p>{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
        </div>
        <button className="add-btn" onClick={() => setShowAddModal(true)}>+ 기록</button>
      </div>

      <div className="filter-bar">
        {filterOptions.map((f) => (
          <button
            key={f.key}
            className={`filter-chip ${activeFilter === f.key ? 'active' : ''}`}
            onClick={() => setActiveFilter(f.key)}
          >{f.icon} {f.label}</button>
        ))}
      </div>

      <div className="tl-body">
        {isTimelineLoading ? (
          <div className="tl-empty">
            <div className="tl-spinner" />
            <p>기록을 불러오는 중...</p>
          </div>
        ) : !selectedCat ? (
          <div className="tl-empty">
            <span>🐱</span>
            <p>먼저 고양이를 등록해주세요</p>
            <small>설정 탭에서 고양이를 추가할 수 있습니다</small>
          </div>
        ) : groupedData.length === 0 ? (
          <div className="tl-empty">
            <span>📝</span>
            <p>기록이 없습니다</p>
            <small>스캔 결과나 증상을 기록해보세요</small>
          </div>
        ) : (
          groupedData.map((group) => (
            <TimelineDateGroup
              key={group.date}
              date={group.date}
              items={group.items}
              isToday={group.isToday}
              onDelete={handleDeleteEntry}
            />
          ))
        )}
      </div>

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
