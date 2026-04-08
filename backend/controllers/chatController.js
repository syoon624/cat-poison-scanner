/**
 * ============================================
 * Chat Controller - AI 챗봇 컨트롤러
 * ============================================
 * 
 * '냥챗' 기능을 담당합니다.
 * 사용자가 텍스트로 독성 물질에 대해 질문하면,
 * ToxicityDB를 참조하고 OpenAI로 답변을 생성합니다.
 * 
 * 처리 흐름 (Phase 4):
 * 1. 사용자 메시지 수신
 * 2. ToxicityDB에서 관련 항목 검색 (키워드 + 텍스트 검색)
 * 3. OpenAI API로 답변 생성 (DB 데이터를 컨텍스트로 전달)
 * 4. 폴백: OpenAI 실패 → 키워드 매칭 기반 로컬 응답
 * 
 * [Phase 4] OpenAI API 실연동
 * - OpenAI 키 미설정 시 키워드 매칭으로 폴백
 * - ToxicityDB 데이터를 프롬프트에 결합하여 정확도 향상
 */

const ToxicityDB = require('../models/ToxicityDB');
const { generateChatResponse } = require('../services/openaiService');

/**
 * POST /api/chat/ask
 * 텍스트 기반 독성 물질 질의 처리
 * 
 * @param {string} req.body.message - 사용자의 질문 메시지
 * @param {Array} [req.body.chatHistory] - 이전 대화 기록 (선택, 컨텍스트 유지용)
 * 
 * @returns {Object} 챗봇 응답
 * - success: boolean
 * - answer: 챗봇의 답변 텍스트
 * - relatedItems: 관련된 독성 DB 항목들
 * - disclaimer: 법적 고지
 * - source: 응답 생성 방식 ('openai' | 'db-keyword' | 'local-mock')
 */
const askChat = async (req, res) => {
  try {
    const { message, chatHistory } = req.body;

    // 메시지 유효성 검증
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '질문 메시지를 입력해주세요.'
      });
    }

    console.log(`💬 챗봇 질의 수신: "${message}"`);

    // ─── Step 1: ToxicityDB에서 관련 항목 검색 ───
    let relatedItems = [];
    try {
      relatedItems = await searchToxicityDB(message);
    } catch (dbError) {
      console.warn('⚠️ ToxicityDB 검색 실패:', dbError.message);
    }

    // ─── Step 2: OpenAI로 답변 생성 시도 ───
    let answer;
    let source = 'local-mock';

    try {
      const aiResponse = await generateChatResponse(
        message,
        relatedItems,
        chatHistory || []
      );
      answer = aiResponse.answer;
      source = 'openai';
      console.log(`✅ OpenAI 챗봇 응답 생성 완료 (토큰: ${aiResponse.usage?.total_tokens || '?'})`);
    } catch (aiError) {
      console.warn('⚠️ OpenAI 응답 생성 실패, 폴백 사용:', aiError.message);

      // ─── Step 3: 폴백 - DB 기반 또는 키워드 매칭 응답 ───
      if (relatedItems.length > 0) {
        answer = generateDBBasedAnswer(message, relatedItems);
        source = 'db-keyword';
      } else {
        answer = generateLocalMockAnswer(message);
        source = 'local-mock';
      }
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
      disclaimer: legalDisclaimer,
      source // 응답 출처를 명시하여 디버깅/투명성 확보
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
 * ToxicityDB에서 사용자 메시지와 관련된 항목을 검색합니다.
 * 
 * 검색 전략 (우선순위 순):
 * 1. MongoDB 텍스트 검색 ($text)
 * 2. 정규식 직접 매칭 (itemName, itemNameKo, aliases)
 * 
 * @param {string} message - 사용자 메시지
 * @returns {Array} 관련 ToxicityDB 항목 배열 (최대 5개)
 */
const searchToxicityDB = async (message) => {
  let results = [];

  // 방법 1: MongoDB 텍스트 인덱스 검색
  try {
    results = await ToxicityDB.find(
      { $text: { $search: message } },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(5)
    .lean();
  } catch (textSearchError) {
    // 텍스트 인덱스가 없거나 검색 실패 시 무시
  }

  // 방법 2: 텍스트 검색 결과가 없으면 정규식 직접 매칭
  if (results.length === 0) {
    // 메시지에서 2글자 이상 단어 추출 (한글/영문)
    const keywords = message.match(/[가-힣a-zA-Z]{2,}/g) || [];

    for (const keyword of keywords) {
      const regex = new RegExp(keyword, 'i');
      const matches = await ToxicityDB.find({
        $or: [
          { itemName: regex },
          { itemNameKo: regex },
          { aliases: { $elemMatch: regex } }
        ]
      }).limit(3).lean();

      results.push(...matches);
    }

    // 중복 제거 (같은 _id를 가진 항목)
    const seen = new Set();
    results = results.filter(item => {
      const id = item._id.toString();
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    }).slice(0, 5);
  }

  if (results.length > 0) {
    console.log(`🔍 ToxicityDB 검색 결과: ${results.length}건 (${results.map(r => r.itemNameKo || r.itemName).join(', ')})`);
  }

  return results;
};

/**
 * ToxicityDB 검색 결과를 기반으로 답변 텍스트 생성
 * OpenAI 사용 불가 시 폴백으로 사용됩니다.
 * 
 * @param {string} question - 사용자 질문
 * @param {Array} items - DB에서 검색된 독성 물질 목록
 * @returns {string} 구조화된 답변 텍스트
 */
const generateDBBasedAnswer = (question, items) => {
  const topItem = items[0];
  
  // 독성 수준에 따른 경고 아이콘
  const levelMessages = {
    HIGH: '🚨 매우 위험합니다!',
    MEDIUM: '⚠️ 주의가 필요합니다.',
    LOW: '💛 경미한 수준이지만 주의하세요.'
  };

  let answer = `${levelMessages[topItem.toxicityLevel] || ''}\n\n`;
  answer += `"${topItem.itemNameKo || topItem.itemName}"은(는) 고양이에게 `;
  answer += `독성 수준 [${topItem.toxicityLevel}]로 분류되어 있습니다.\n\n`;

  if (topItem.symptoms && topItem.symptoms.length > 0) {
    answer += `📋 예상 증상: ${topItem.symptoms.join(', ')}\n\n`;
  }

  if (topItem.description) {
    answer += `${topItem.description}\n`;
  }

  // 추가 관련 항목이 있으면 간단히 안내
  if (items.length > 1) {
    answer += `\n\n📚 관련 항목: ${items.slice(1).map(i => i.itemNameKo || i.itemName).join(', ')}`;
  }

  return answer;
};

/**
 * 로컬 Mock 키워드 매칭 응답
 * DB 연결 실패 + OpenAI 실패 시 최후의 폴백
 * 
 * @param {string} message - 사용자 메시지
 * @returns {string} Mock 답변 텍스트
 */
const generateLocalMockAnswer = (message) => {
  const lowerMessage = message.toLowerCase();

  const keywordResponses = {
    '백합': '🚨 백합(Lily)은 고양이에게 매우 위험한 식물입니다! 꽃가루, 잎, 줄기 모두 독성이 있으며, 소량 섭취만으로도 급성 신부전을 유발할 수 있습니다. 즉시 수의사에게 연락하세요.',
    'lily': '🚨 백합(Lily)은 고양이에게 매우 위험한 식물입니다!',
    '초콜릿': '🚨 초콜릿에는 테오브로민이 포함되어 있어 고양이에게 위험합니다. 구토, 설사, 심박수 증가, 발작 등을 유발할 수 있습니다.',
    '양파': '🚨 양파는 고양이의 적혈구를 파괴하여 빈혈을 유발합니다. 생양파, 양파 가루 모두 위험합니다.',
    '포도': '⚠️ 포도와 건포도는 고양이에게 신부전을 유발할 수 있습니다.',
    '자일리톨': '🚨 자일리톨은 고양이에게 저혈당과 간 손상을 유발할 수 있는 매우 위험한 성분입니다.',
    '참치': '💛 참치 자체는 독성이 없지만, 너무 자주 급여하면 수은 중독이나 영양 불균형이 발생할 수 있습니다.',
    '닭고기': '✅ 익힌 닭고기는 고양이에게 안전하고 좋은 단백질 공급원입니다. 단, 뼈와 양념은 제거해주세요.',
  };

  for (const [keyword, response] of Object.entries(keywordResponses)) {
    if (lowerMessage.includes(keyword)) {
      return response;
    }
  }

  return `🐱 "${message}"에 대해 분석 중입니다.\n\n현재 해당 물질에 대한 정보가 데이터베이스에 등록되어 있지 않습니다. 더 정확한 정보를 위해 수의사와 상담하시는 것을 권장합니다.\n\n궁금한 식물이나 식품이 있다면 이름을 입력해주세요!`;
};

module.exports = { askChat };
