/**
 * ============================================
 * TimelineDetailModal - 타임라인 상세 보기 모달
 * ============================================
 * 타임라인 카드 클릭 시 상세 정보를 표시합니다.
 * 스캔 결과(사물/식물, 성분표), 메모 편집 등을 지원합니다.
 */

import { useState } from 'react';
import { getRiskColor, getTypeColor } from '../styles/colors';
import { updateTimelineEntry } from '../services/api';
import './TimelineDetailModal.css';

const TYPE_LABELS = {
  PLANT: '🌿 식물/사물 스캔',
  INGREDIENT: '🏷️ 성분표 스캔',
  CHAT: '💬 냥챗 질의',
  SYMPTOM: '🤒 증상 기록',
  HOSPITAL: '🏥 병원 방문',
};

const RISK_LABELS = {
  TOXIC: '🚨 위험',
  WARNING: '⚠️ 주의',
  SAFE: '✅ 안전',
  NONE: '',
};

export default function TimelineDetailModal({ item, onClose, onUpdate }) {
  const [memo, setMemo] = useState(item.memo || '');
  const [isSaving, setIsSaving] = useState(false);
  const [memoSaved, setMemoSaved] = useState(true);

  const riskColor = getRiskColor(item.riskLevel);
  const typeColor = getTypeColor(item.type);
  const scanData = item.scanData;
  const isOCR = item.type === 'INGREDIENT';
  const isPlant = item.type === 'PLANT';
  const hasScanData = scanData && (isOCR || isPlant);

  const formatDate = (ts) =>
    new Date(ts).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
      weekday: 'short', hour: '2-digit', minute: '2-digit',
    });

  const handleSaveMemo = async () => {
    setIsSaving(true);
    try {
      const res = await updateTimelineEntry(item._id, { memo });
      if (res.success && onUpdate) {
        onUpdate({ ...item, memo });
      }
      setMemoSaved(true);
    } catch (err) {
      console.error('메모 저장 실패:', err);
      alert('메모 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="detail-header" style={{ borderBottom: `3px solid ${typeColor}` }}>
          <span className="detail-type" style={{ color: typeColor }}>
            {TYPE_LABELS[item.type] || '📌 기록'}
          </span>
          {item.riskLevel && item.riskLevel !== 'NONE' && (
            <span className="detail-risk" style={{ background: riskColor.light, color: riskColor.main }}>
              {RISK_LABELS[item.riskLevel]}
            </span>
          )}
        </div>

        {/* 시간 */}
        <p className="detail-time">{formatDate(item.timestamp)}</p>

        {/* 요약 내용 */}
        <div className="detail-summary">
          <p>{item.content}</p>
        </div>

        {/* 스캔 상세: 사물/식물 */}
        {isPlant && scanData && (
          <div className="detail-section">
            <h4>스캔 결과</h4>
            <div className="scan-info-grid">
              <div className="scan-info-item">
                <span className="scan-label">식별된 항목</span>
                <span className="scan-value">{scanData.identifiedItem || '-'}</span>
              </div>
              {scanData.confidence > 0 && (
                <div className="scan-info-item">
                  <span className="scan-label">신뢰도</span>
                  <span className="scan-value">{(scanData.confidence * 100).toFixed(0)}%</span>
                </div>
              )}
              {scanData.category && scanData.category !== 'UNKNOWN' && (
                <div className="scan-info-item">
                  <span className="scan-label">분류</span>
                  <span className="scan-value">{scanData.category}</span>
                </div>
              )}
            </div>
            {scanData.details && (
              <div className="scan-details-box">
                <p>{scanData.details}</p>
              </div>
            )}
            {scanData.symptoms && scanData.symptoms.length > 0 && (
              <div className="scan-symptoms">
                <span className="scan-label">주의 증상</span>
                <div className="symptom-tags">
                  {scanData.symptoms.map((s, i) => (
                    <span key={i} className="symptom-tag">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {scanData.advice && (
              <div className="scan-advice">
                <span className="scan-label">조치 안내</span>
                <p>{scanData.advice}</p>
              </div>
            )}
          </div>
        )}

        {/* 스캔 상세: 성분표 OCR */}
        {isOCR && scanData && (
          <div className="detail-section">
            <h4>성분 분석 결과</h4>
            {scanData.extractedText && (
              <div className="ocr-text-box">
                <span className="scan-label">추출된 텍스트</span>
                <pre className="ocr-text">{scanData.extractedText}</pre>
              </div>
            )}
            {scanData.detectedHazards && scanData.detectedHazards.length > 0 && (
              <div className="hazard-list">
                <span className="scan-label">검출된 유해 성분</span>
                {scanData.detectedHazards.map((h, i) => (
                  <div key={i} className="hazard-item" style={{ borderLeft: `3px solid ${getRiskColor(h.riskLevel).main}` }}>
                    <strong>{h.ingredient}</strong>
                    <p>{h.details}</p>
                    {h.symptoms && h.symptoms.length > 0 && (
                      <div className="symptom-tags">
                        {h.symptoms.map((s, j) => <span key={j} className="symptom-tag">{s}</span>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {scanData.safeIngredients && scanData.safeIngredients.length > 0 && (
              <div className="safe-list">
                <span className="scan-label">안전 성분</span>
                <div className="safe-tags">
                  {scanData.safeIngredients.map((s, i) => (
                    <span key={i} className="safe-tag">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 메모 영역 */}
        <div className="detail-section">
          <h4>메모</h4>
          <textarea
            className="memo-input"
            placeholder="추가 메모를 입력하세요... (증상 경과, 수의사 소견 등)"
            value={memo}
            onChange={(e) => { setMemo(e.target.value); setMemoSaved(false); }}
            rows={3}
          />
          {!memoSaved && (
            <button className="memo-save-btn" onClick={handleSaveMemo} disabled={isSaving}>
              {isSaving ? '저장 중...' : '메모 저장'}
            </button>
          )}
        </div>

        {/* 닫기 */}
        <button className="detail-close-btn" onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}
