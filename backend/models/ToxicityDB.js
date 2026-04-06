/**
 * ============================================
 * ToxicityDB 모델 (독성 물질 사전)
 * ============================================
 * 고양이에게 유해한 식물, 식품, 화학물질의
 * 독성 정보를 저장하는 데이터베이스입니다.
 * 
 * Vision API/OCR로 인식된 물질명을 이 DB와 대조하여
 * 독성 여부를 판단합니다.
 * 
 * 활용 흐름:
 * 1. 스캔 → 물질명 인식
 * 2. ToxicityDB에서 itemName 또는 aliases로 검색
 * 3. 매칭 결과의 toxicityLevel을 기반으로 위험도 판정
 * 4. symptoms 필드로 예상 증상 안내
 */

const mongoose = require('mongoose');

const toxicityDBSchema = new mongoose.Schema({
  // 물질 이름 (영문 표준명)
  itemName: {
    type: String,
    required: [true, '물질 이름은 필수입니다.'],
    unique: true,
    trim: true
  },
  
  // 한글 이름 - 한국어 사용자를 위한 표시명
  itemNameKo: {
    type: String,
    default: null,
    trim: true
  },
  
  // 동의어/별칭 리스트 (검색 정확도 향상용)
  // 예: 'Xylitol' → ['자일리톨', 'sugar alcohol', 'E967']
  aliases: {
    type: [String],
    default: []
  },
  
  // 물질 분류
  category: {
    type: String,
    required: true,
    enum: {
      values: ['PLANT', 'FOOD', 'CHEMICAL'],
      message: '{VALUE}은(는) 유효하지 않은 카테고리입니다.'
    }
  },
  
  // 독성 수준
  // HIGH: 소량으로도 치명적 (예: 백합)
  // MEDIUM: 다량 섭취 시 위험 (예: 카페인)
  // LOW: 경미한 증상 유발 가능 (예: 카모마일)
  toxicityLevel: {
    type: String,
    required: true,
    enum: {
      values: ['HIGH', 'MEDIUM', 'LOW'],
      message: '{VALUE}은(는) 유효하지 않은 독성 수준입니다.'
    }
  },
  
  // 예상 증상 목록 (한글 + 영문 혼용 가능)
  symptoms: {
    type: [String],
    default: []
  },
  
  // 상세 설명 (추가 참고 정보)
  description: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// 텍스트 검색을 위한 인덱스 (물질명 + 별칭에서 검색)
toxicityDBSchema.index({ itemName: 'text', aliases: 'text', itemNameKo: 'text' });

module.exports = mongoose.model('ToxicityDB', toxicityDBSchema);
