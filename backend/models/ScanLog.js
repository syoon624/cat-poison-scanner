/**
 * ============================================
 * ScanLog 모델 (스캔/이벤트 기록)
 * ============================================
 * 타임라인 캘린더의 핵심 데이터 모델입니다.
 * 스캔 결과, 챗봇 질의, 증상 기록, 병원 방문 등
 * 모든 이벤트를 통합적으로 저장합니다.
 * 
 * type 분류:
 * - PLANT: 식물/사물 스캔 결과
 * - INGREDIENT: 성분표 OCR 스캔 결과
 * - CHAT: 챗봇 질의 기록
 * - SYMPTOM: 건강 이상 증상 기록 (사용자 수동 입력)
 * - HOSPITAL: 병원 방문 기록
 * 
 * riskLevel 분류:
 * - SAFE: 안전 (초록색 표시)
 * - WARNING: 주의 필요 (노란색 표시)
 * - TOXIC: 위험/독성 (빨간색 표시)
 * - NONE: 해당 없음 (증상/병원 기록 등)
 */

const mongoose = require('mongoose');

const scanLogSchema = new mongoose.Schema({
  // 기록 소유자(User) 참조
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '사용자 ID는 필수입니다.']
  },
  
  // 대상 고양이(Cat) 참조
  catId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cat',
    required: [true, '고양이 ID는 필수입니다.']
  },
  
  // 이벤트 유형 구분
  type: {
    type: String,
    required: true,
    enum: {
      values: ['PLANT', 'INGREDIENT', 'CHAT', 'SYMPTOM', 'HOSPITAL'],
      message: '{VALUE}은(는) 유효하지 않은 타입입니다.'
    }
  },
  
  // 이벤트 내용 (스캔된 물질 이름, 증상 메모, 챗봇 질문 등)
  content: {
    type: String,
    required: [true, '내용은 필수 입력값입니다.'],
    trim: true
  },
  
  // 위험도 레벨 - UI에서 색상 피드백에 사용
  riskLevel: {
    type: String,
    enum: ['SAFE', 'WARNING', 'TOXIC', 'NONE'],
    default: 'NONE'
  },
  
  // 촬영된 이미지 URL (클라우드 스토리지 또는 로컬 경로)
  imageUrl: {
    type: String,
    default: null
  },
  
  // 기호성 별점 (1~5) - 사료/간식 급여 후 기록
  // null이면 별점 미기록 상태
  palatabilityRating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  
  // 이벤트 발생 시각
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 특정 고양이의 타임라인 조회를 위한 인덱스
// catId + timestamp 복합 인덱스로 시간순 조회 최적화
scanLogSchema.index({ catId: 1, timestamp: -1 });

module.exports = mongoose.model('ScanLog', scanLogSchema);
