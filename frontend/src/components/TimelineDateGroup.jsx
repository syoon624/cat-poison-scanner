/**
 * ============================================
 * TimelineDateGroup - 날짜별 그룹 (PWA 웹 버전)
 * ============================================
 */

import TimelineItem from './TimelineItem';
import './TimelineDateGroup.css';

export default function TimelineDateGroup({ date, items, isToday, onDelete, onSelect }) {
  const formatDateHeader = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      month: 'long', day: 'numeric', weekday: 'short',
    });
  };

  return (
    <div className="date-group">
      <div className="date-header">
        {isToday && <span className="today-badge">오늘</span>}
        <span className={`date-text ${isToday ? 'today' : ''}`}>{formatDateHeader(date)}</span>
        <span className="count-badge">{items.length}건</span>
      </div>
      <div className="items-container">
        {items.map((item, idx) => (
          <TimelineItem key={item._id} item={item} isFirst={idx === 0} isLast={idx === items.length - 1} onDelete={onDelete} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
