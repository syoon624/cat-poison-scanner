/**
 * ============================================
 * TimelineItem - 타임라인 개별 항목 (PWA 웹 버전)
 * ============================================
 * 수직 트리 구조의 타임라인 이벤트를 표시합니다.
 */

import { getRiskColor, getTypeColor } from '../styles/colors';
import './TimelineItem.css';

export default function TimelineItem({ item, isFirst, isLast }) {
  const typeColor = getTypeColor(item.type);
  const riskColor = getRiskColor(item.riskLevel);

  const getTypeIcon = (type) => ({ PLANT: '🌿', INGREDIENT: '🏷️', CHAT: '💬', SYMPTOM: '🤒', HOSPITAL: '🏥' }[type] || '📌');
  const getTypeLabel = (type) => ({ PLANT: '식물/사물 스캔', INGREDIENT: '성분표 스캔', CHAT: '냥챗 질의', SYMPTOM: '증상 기록', HOSPITAL: '병원 방문' }[type] || '기록');

  const formatTime = (ts) => new Date(ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

  const renderStars = (rating) => {
    if (!rating) return null;
    return (
      <div className="stars">
        <span className="stars-label">기호성: </span>
        {[1,2,3,4,5].map((s) => <span key={s} className="star">{s <= rating ? '⭐' : '☆'}</span>)}
      </div>
    );
  };

  return (
    <div className="tl-item">
      {/* 시간 열 */}
      <div className="time-col">
        <span className="time-text">{formatTime(item.timestamp)}</span>
      </div>

      {/* 연결선 + 노드 */}
      <div className="line-col">
        <div className={`line-top ${!isFirst ? 'visible' : ''}`} />
        <div className="node" style={{ background: typeColor }}>
          <span>{getTypeIcon(item.type)}</span>
        </div>
        <div className={`line-bottom ${!isLast ? 'visible' : ''}`} />
      </div>

      {/* 내용 카드 */}
      <div
        className="content-card"
        style={item.riskLevel !== 'NONE' ? { borderLeft: `3px solid ${riskColor.main}` } : {}}
      >
        <div className="card-header">
          <span className="type-label" style={{ color: typeColor }}>{getTypeLabel(item.type)}</span>
          {item.riskLevel && item.riskLevel !== 'NONE' && (
            <span className="risk-badge" style={{ background: riskColor.light, color: riskColor.main }}>
              {item.riskLevel === 'TOXIC' ? '위험' : item.riskLevel === 'WARNING' ? '주의' : '안전'}
            </span>
          )}
        </div>
        <p className="content-text">{item.content}</p>
        {renderStars(item.palatabilityRating)}
      </div>
    </div>
  );
}
