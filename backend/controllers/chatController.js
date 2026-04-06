/**
 * ============================================
 * Chat Controller - AI 챗봇 컨트롤러
 * ============================================
 * 
 * '냥챗' 기능을 담당합니다.
 * 사용자가 텍스트로 독성 물질에 대해 질문하면,
 * ToxicityDB를 참조하여 답변을 생성합니다.
 * 
 * 처리 흐름:
 * 1. 사용자 메시지 수신
 * 2. 메시지에서 물질명 키워드 추출
 * 3. ToxicityDB에서 해당 물질 검색
 * 4. 검색 결과를 기반으로 응답 생성
 * 
 * [현재 Phase 1]
 * OpenAI API 연동 전이므로 키워드 매칭 기반
 * Mock 응답을 제공합니다.
 */

const ToxicityDB = require('../models/ToxicityDB');

/**
 * POST /api/chat/ask
 * 텍스트 기반 독성 물질 질의 처리
 * 
 * @param {string} req.body.message - 사용자의 질문 메시지
 * 
 * @returns {Object} 챗봇 응답
 * - success: boolean
 * - answer: 챗봇의 답변 텍스트
 * - relatedItems: 관련된 독성 DB 항목들
 * - disclaimer: 법적 고지
 */
const askChat = async (req, res) => {
  try {
    const { message } = req.body;

    // 메시지 유효성 검증
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '질문 메시지를 입력해주세요.'
      });
    }

    console.log(`💬 챗봇 질의 수신: "${message}"`);

    // ============================================
    // ToxicityDB 검색 시도
    // 우선 DB에서 키워드 매칭을 시도하고,
    // DB에 데이터가 없으면 Mock 응답을 반환
    // ============================================

    let answer;
    let relatedItems = [];

    try {
      // MongoDB 텍스트 검색으로 관련 독성 물질 조회
      relatedItems = await ToxicityDB.find(
        { $text: { $search: message } },
        { score: { $meta: 'textScore' } }
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(5)
      .lean();
    } catch (dbError) {
      // DB 연결 실패 시에도 Mock 응답은 제공
      console.log('DB 검색 실패, Mock 응답으로 대체:', dbError.message);
    }

    if (relatedItems.length > 0) {
      // DB에서 관련 항목을 찾은 경우 → DB 기반 응답 생성
      answer = generateDBBasedAnswer(message, relatedItems);
    } else {
      // DB에 없는 경우 → Mock 키워드 매칭 응답
      answer = generateMockAnswer(message);
    }

    // 법적 고지
    const legalDisclaimer = '⚠️ 본 정보는 참고용이며, 정확한 진단과 처방은 수의사와 상담하십시오.';

    res.json({
      success: true,
      question: message,
      answer,
      relatedItems: relatedItems.map(item => ({
        name: item.itemName,
        nameKo: item.itemNameKo,
        category: item.category,
        toxicityLevel: item.toxicityLevel,
        symptoms: item.symptoms
      })),
      disclaimer: legalDisclaimer
    });

  } catch (error) {
    console.error('챗봇 처리 에러:', error);
    res.status(500).json({
      success: false,
      message: '질문 처리 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

/**
 * ToxicityDB 검색 결과를 기반으로 답변 텍스트 생성
 * 
 * @param {string} question - 사용자 질문
 * @param {Array} items - DB에서 검색된 독성 물질 목록
 * @returns {string} 구조화된 답변 텍스트
 */
const generateDBBasedAnswer = (question, items) => {
  const topItem = items[0];
  
  // 독성 수준에 따른 경고 메시지 분기
  const levelMessages = {
    HIGH: '🚨 매우 위험합니다!',
    MEDIUM: '⚠️ 주의가 필요합니다.',
    LOW: '💛 경미한 수준이지만 주의하세요.'
  };

  let answer = `${levelMessages[topItem.toxicityLevel] || ''}\n\n`;
  answer += `"${topItem.itemNameKo || topItem.itemName}"은(는) 고양이에게 `;
  answer += `독성 수준 [${topItem.toxicityLevel}]로 분류되어 있습니다.\n\n`;

  if (topItem.symptoms && topItem.symptoms.length > 0) {
    answer += `예상 증상: ${topItem.symptoms.join(', ')}\n\n`;
  }

  if (topItem.description) {
    answer += `${topItem.description}\n`;
  }

  return answer;
};

/**
 * Mock 키워드 매칭 기반 응답 생성
 * DB에 데이터가 없거나 연결 실패 시 사용되는 폴백 응답
 * 
 * @param {string} message - 사용자 메시지
 * @returns {string} Mock 답변 텍스트
 */
const generateMockAnswer = (message) => {
  const lowerMessage = message.toLowerCase();

  // 키워드별 미리 정의된 응답 매핑
  const keywordResponses = {
    '백합': '🚨 백합(Lily)은 고양이에게 매우 위험한 식물입니다! 꽃가루, 잎, 줄기 모두 독성이 있으며, 소량 섭취만으로도 급성 신부전을 유발할 수 있습니다. 즉시 수의사에게 연락하세요.',
    'lily': '🚨 백합(Lily)은 고양이에게 매우 위험한 식물입니다! 소량 섭취만으로도 급성 신부전을 유발할 수 있습니다.',
    '초콜릿': '🚨 초콜릿에는 테오브로민이 포함되어 있어 고양이에게 위험합니다. 구토, 설사, 심박수 증가, 발작 등을 유발할 수 있습니다.',
    'chocolate': '🚨 초콜릿(Chocolate)은 테오브로민 성분으로 인해 고양이에게 독성이 있습니다.',
    '양파': '🚨 양파는 고양이의 적혈구를 파괴하여 빈혈을 유발합니다. 생양파, 양파 가루 모두 위험합니다.',
    '포도': '⚠️ 포도와 건포도는 고양이에게 신부전을 유발할 수 있습니다. 급여를 삼가해주세요.',
    '자일리톨': '🚨 자일리톨은 고양이에게 저혈당과 간 손상을 유발할 수 있는 매우 위험한 성분입니다.',
    '참치': '💛 참치 자체는 독성이 없지만, 너무 자주 급여하면 수은 중독이나 영양 불균형이 발생할 수 있습니다. 간식으로 소량만 급여하세요.',
    '닭고기': '✅ 익힌 닭고기는 고양이에게 안전하고 좋은 단백질 공급원입니다. 단, 뼈와 양념은 제거해주세요.',
    '안전': '✅ 고양이에게 안전한 식품으로는 익힌 닭고기, 연어, 호박, 당근 등이 있습니다.'
  };

  // 키워드 매칭 시도
  for (const [keyword, response] of Object.entries(keywordResponses)) {
    if (lowerMessage.includes(keyword)) {
      return response;
    }
  }

  // 매칭되는 키워드가 없는 경우 기본 응답
  return `🐱 "${message}"에 대해 분석 중입니다.\n\n현재 해당 물질에 대한 정보가 독성 데이터베이스에 등록되어 있지 않습니다. 더 정확한 정보를 위해 수의사와 상담하시는 것을 권장합니다.\n\n궁금한 식물이나 식품이 있다면 이름을 입력해주세요!`;
};

module.exports = { askChat };
