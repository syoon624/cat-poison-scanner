/**
 * ============================================
 * Cat 모델 (반려묘 프로필)
 * ============================================
 * 사용자가 등록한 반려묘의 정보를 저장합니다.
 * 하나의 User는 여러 마리의 Cat을 등록할 수 있습니다.
 * 
 * 필드:
 * - userId: 소유자(User)의 참조 ID
 * - name: 고양이 이름
 * - birthDate: 생년월일
 * - weight: 체중 (kg)
 * - preExistingConditions: 기저 질환 목록
 */

const mongoose = require('mongoose');

const catSchema = new mongoose.Schema({
  // 소유자(User) 참조 - User 컬렉션과 연결
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '소유자 정보는 필수입니다.']
  },
  
  // 고양이 이름
  name: {
    type: String,
    required: [true, '고양이 이름은 필수 입력값입니다.'],
    trim: true,
    maxlength: [50, '이름은 50자 이하여야 합니다.']
  },
  
  // 생년월일 - 나이 계산에 사용
  birthDate: {
    type: Date,
    default: null
  },
  
  // 체중 (kg 단위) - 독성 판단 시 체중 대비 위험도 참고 가능
  weight: {
    type: Number,
    default: null,
    min: [0, '체중은 0보다 커야 합니다.']
  },
  
  // 기저 질환 목록 (예: ['신장질환', '당뇨'])
  // 특정 질환이 있는 경우 더 주의가 필요한 성분을 강조할 수 있음
  preExistingConditions: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Cat', catSchema);
