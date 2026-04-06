/**
 * ============================================
 * ToxicityDB 시드 데이터
 * ============================================
 * 
 * 고양이에게 유해한 물질의 초기 데이터를 MongoDB에 삽입합니다.
 * 
 * 실행 방법:
 *   cd backend && npm run seed
 * 
 * 카테고리:
 * - PLANT: 식물류
 * - FOOD: 식품/식재료
 * - CHEMICAL: 화학물질/약품
 * 
 * 참고 자료:
 * - ASPCA Animal Poison Control
 * - Pet Poison Helpline
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ToxicityDB = require('../models/ToxicityDB');

dotenv.config();

// ============================================
// 시드 데이터 정의
// ============================================
const toxicityData = [
  // ─────────── 식물류 (PLANT) ───────────
  {
    itemName: 'Lily',
    itemNameKo: '백합',
    aliases: ['백합', '나리', 'Easter lily', 'Tiger lily', 'Asiatic lily', 'Day lily'],
    category: 'PLANT',
    toxicityLevel: 'HIGH',
    symptoms: ['구토', '식욕 부진', '무기력', '급성 신부전', '사망 가능'],
    description: '백합은 고양이에게 가장 위험한 식물 중 하나입니다. 꽃가루, 잎, 줄기, 꽃 모두 독성이 있으며, 극소량 섭취만으로도 치명적인 신부전을 유발할 수 있습니다.'
  },
  {
    itemName: 'Tulip',
    itemNameKo: '튤립',
    aliases: ['튤립', 'Tulipa'],
    category: 'PLANT',
    toxicityLevel: 'MEDIUM',
    symptoms: ['구토', '설사', '과다 침흘림', '식욕 부진'],
    description: '튤립의 구근(알뿌리)에 독성이 가장 높으며, 꽃과 잎에도 독소가 포함되어 있습니다.'
  },
  {
    itemName: 'Aloe Vera',
    itemNameKo: '알로에',
    aliases: ['알로에', '알로에 베라', 'Aloe'],
    category: 'PLANT',
    toxicityLevel: 'MEDIUM',
    symptoms: ['구토', '설사', '무기력', '떨림'],
    description: '알로에 젤의 라텍스 성분(안트라퀴논)이 고양이에게 위장 장애를 유발할 수 있습니다.'
  },
  {
    itemName: 'Pothos',
    itemNameKo: '포토스 (스킨답서스)',
    aliases: ['포토스', '스킨답서스', "Devil's Ivy", 'Golden Pothos'],
    category: 'PLANT',
    toxicityLevel: 'MEDIUM',
    symptoms: ['구강 자극', '과다 침흘림', '구토', '삼키기 어려움'],
    description: '칼슘 옥살레이트 결정을 포함하고 있어 구강과 위장에 자극을 줄 수 있습니다.'
  },
  {
    itemName: 'Spider Plant',
    itemNameKo: '접란',
    aliases: ['접란', '거미식물', 'Chlorophytum comosum'],
    category: 'PLANT',
    toxicityLevel: 'LOW',
    symptoms: ['경미한 위장 불편'],
    description: '접란은 고양이에게 비교적 안전한 식물입니다. 간혹 씹을 수 있으나 심각한 독성은 없습니다.'
  },
  {
    itemName: 'Sago Palm',
    itemNameKo: '소철',
    aliases: ['소철', '사고야자', 'Cycas revoluta'],
    category: 'PLANT',
    toxicityLevel: 'HIGH',
    symptoms: ['구토', '설사', '간부전', '사망 가능'],
    description: '소철의 모든 부분이 독성이 있으며, 특히 씨앗에 사이카신(cycasin)이 높은 농도로 포함되어 있어 간부전을 유발합니다.'
  },
  {
    itemName: 'Azalea',
    itemNameKo: '진달래/철쭉',
    aliases: ['진달래', '철쭉', 'Rhododendron'],
    category: 'PLANT',
    toxicityLevel: 'HIGH',
    symptoms: ['구토', '설사', '과다 침흘림', '심박수 이상', '혼수'],
    description: '그라야노톡신(grayanotoxin)을 포함하고 있어 심장과 신경계에 영향을 미칩니다.'
  },

  // ─────────── 식품류 (FOOD) ───────────
  {
    itemName: 'Chocolate',
    itemNameKo: '초콜릿',
    aliases: ['초콜릿', '초코', 'Cocoa', '카카오', 'Theobromine'],
    category: 'FOOD',
    toxicityLevel: 'HIGH',
    symptoms: ['구토', '설사', '심박수 증가', '떨림', '발작', '사망 가능'],
    description: '초콜릿에 포함된 테오브로민은 고양이가 대사하기 매우 어려우며, 다크 초콜릿일수록 위험성이 높습니다.'
  },
  {
    itemName: 'Onion',
    itemNameKo: '양파',
    aliases: ['양파', '양파 가루', 'Onion powder', 'Allium cepa', '파'],
    category: 'FOOD',
    toxicityLevel: 'HIGH',
    symptoms: ['빈혈', '무기력', '식욕 부진', '황달', '호흡 곤란'],
    description: '양파, 마늘, 부추 등 알리움(Allium) 계열 식물은 고양이의 적혈구를 파괴하여 하인즈체 빈혈을 유발합니다.'
  },
  {
    itemName: 'Garlic',
    itemNameKo: '마늘',
    aliases: ['마늘', '마늘 가루', 'Garlic powder', 'Allium sativum'],
    category: 'FOOD',
    toxicityLevel: 'HIGH',
    symptoms: ['빈혈', '무기력', '식욕 부진', '구토'],
    description: '마늘은 양파보다 5배 이상 독성이 강한 것으로 알려져 있습니다. 가루 형태도 동일하게 위험합니다.'
  },
  {
    itemName: 'Grape',
    itemNameKo: '포도',
    aliases: ['포도', '건포도', 'Raisin', 'Grape', '머루포도'],
    category: 'FOOD',
    toxicityLevel: 'HIGH',
    symptoms: ['구토', '설사', '식욕 부진', '급성 신부전'],
    description: '포도와 건포도는 고양이에게 급성 신부전을 유발할 수 있습니다. 정확한 독성 물질은 아직 밝혀지지 않았습니다.'
  },
  {
    itemName: 'Xylitol',
    itemNameKo: '자일리톨',
    aliases: ['자일리톨', 'E967', 'Birch sugar', '자일리톨 껌'],
    category: 'FOOD',
    toxicityLevel: 'HIGH',
    symptoms: ['저혈당', '구토', '간부전', '발작', '혼수'],
    description: '자일리톨은 인슐린 분비를 급격히 촉진하여 심각한 저혈당을 유발하며, 간 손상도 일으킬 수 있습니다.'
  },
  {
    itemName: 'Caffeine',
    itemNameKo: '카페인',
    aliases: ['카페인', '커피', 'Coffee', '에너지드링크', '차', 'Tea'],
    category: 'FOOD',
    toxicityLevel: 'MEDIUM',
    symptoms: ['과잉 행동', '심박수 증가', '떨림', '발작'],
    description: '카페인은 고양이에게 심혈관계와 신경계에 자극을 줄 수 있습니다.'
  },
  {
    itemName: 'Alcohol',
    itemNameKo: '알코올',
    aliases: ['알코올', '술', 'Ethanol', '맥주', '와인'],
    category: 'FOOD',
    toxicityLevel: 'HIGH',
    symptoms: ['구토', '설사', '호흡 곤란', '혼수', '사망 가능'],
    description: '고양이는 체중이 적어 소량의 알코올만으로도 심각한 중독 증상을 보일 수 있습니다.'
  },
  {
    itemName: 'Raw Egg',
    itemNameKo: '날달걀',
    aliases: ['날달걀', '생달걀', 'Raw egg'],
    category: 'FOOD',
    toxicityLevel: 'LOW',
    symptoms: ['식중독', '비오틴 결핍'],
    description: '날달걀의 아비딘 성분이 비오틴(비타민 B7) 흡수를 방해할 수 있으며, 살모넬라 감염 위험이 있습니다.'
  },

  // ─────────── 화학물질 (CHEMICAL) ───────────
  {
    itemName: 'Permethrin',
    itemNameKo: '퍼메트린',
    aliases: ['퍼메트린', 'Permethrin', '벼룩약', '개 벼룩약'],
    category: 'CHEMICAL',
    toxicityLevel: 'HIGH',
    symptoms: ['떨림', '발작', '과다 침흘림', '사망 가능'],
    description: '개용 벼룩 방지 약품에 흔히 포함된 퍼메트린은 고양이에게 매우 치명적입니다. 절대 고양이에게 사용하지 마세요.'
  },
  {
    itemName: 'Essential Oil',
    itemNameKo: '에센셜 오일',
    aliases: ['에센셜 오일', '아로마 오일', '티트리 오일', 'Tea tree oil', '유칼립투스 오일'],
    category: 'CHEMICAL',
    toxicityLevel: 'MEDIUM',
    symptoms: ['구토', '떨림', '간 손상', '호흡 곤란'],
    description: '많은 에센셜 오일(특히 티트리, 유칼립투스, 페퍼민트)은 고양이에게 독성이 있습니다. 디퓨저 사용 시에도 주의가 필요합니다.'
  },
  {
    itemName: 'Acetaminophen',
    itemNameKo: '아세트아미노펜 (타이레놀)',
    aliases: ['아세트아미노펜', '타이레놀', 'Tylenol', 'Paracetamol'],
    category: 'CHEMICAL',
    toxicityLevel: 'HIGH',
    symptoms: ['메트헤모글로빈혈증', '간부전', '호흡 곤란', '사망 가능'],
    description: '타이레놀(아세트아미노펜)은 고양이에게 절대 투여해서는 안 되는 약물입니다. 1알만으로도 치명적일 수 있습니다.'
  }
];

// ============================================
// 시드 실행 함수
// ============================================

/**
 * MongoDB에 독성 데이터를 초기 삽입합니다.
 * 기존 데이터를 모두 삭제한 후 새로 삽입합니다.
 */
const seedDB = async () => {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/purrfectscan');
    console.log('✅ MongoDB 연결 성공');

    // 기존 독성 데이터 전체 삭제
    await ToxicityDB.deleteMany({});
    console.log('🗑️  기존 독성 데이터 삭제 완료');

    // 새 독성 데이터 삽입
    const result = await ToxicityDB.insertMany(toxicityData);
    console.log(`🌱 ${result.length}개의 독성 데이터가 성공적으로 삽입되었습니다.`);

    // 삽입된 데이터 요약 출력
    console.log('\n📋 삽입된 항목 목록:');
    result.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.itemNameKo} (${item.itemName}) - [${item.toxicityLevel}] ${item.category}`);
    });

    // 연결 종료
    await mongoose.disconnect();
    console.log('\n✅ 시드 완료 및 연결 종료');
    process.exit(0);

  } catch (error) {
    console.error('❌ 시드 실행 실패:', error.message);
    process.exit(1);
  }
};

// 직접 실행 시 시드 함수 호출
seedDB();

module.exports = toxicityData;
