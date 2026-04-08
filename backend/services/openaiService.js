/**
 * ============================================
 * OpenAI API 서비스
 * ============================================
 * 
 * OpenAI API를 호출하여 다음 기능을 수행합니다:
 * 
 * 1. 독성 판단 (analyzeToxicity)
 *    - Vision API로 식별된 물질명 + ToxicityDB 데이터를 조합
 *    - OpenAI가 교차 검증하여 정밀한 독성 판단을 수행
 *    - 한국어로 사용자 친화적인 설명 생성
 * 
 * 2. 성분표 분석 (analyzeIngredients)
 *    - OCR로 추출된 성분 텍스트를 파싱
 *    - 각 성분의 고양이 독성 여부를 판단
 *    - 유해 성분과 안전 성분을 분류하여 반환
 * 
 * 3. 챗봇 응답 (generateChatResponse)
 *    - 사용자 질문에 대해 ToxicityDB를 참조하여 답변 생성
 *    - 고양이 건강에 특화된 전문 지식 기반 응답
 * 
 * 모델: gpt-4o-mini (비용 효율 + 충분한 성능)
 */

const OpenAI = require('openai');

/**
 * OpenAI 클라이언트 인스턴스 생성
 * .env의 OPENAI_API_KEY를 자동으로 사용
 */
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY가 설정되지 않았습니다. .env 파일을 확인해주세요.');
  }
  return new OpenAI({ apiKey });
};

// 공통 시스템 프롬프트 - 모든 OpenAI 호출에 사용되는 역할 설정
const SYSTEM_PROMPT = `당신은 고양이 독성 물질 전문가 AI입니다. 이름은 "냥박사"입니다.

역할:
- 식물, 음식, 화학물질이 고양이에게 미치는 독성 여부를 정확하게 판단합니다.
- 과학적 근거를 기반으로 답변하되, 보호자가 이해하기 쉬운 한국어로 설명합니다.
- 위험한 물질에 대해서는 즉각적인 경고와 함께 예상 증상을 안내합니다.
- 안전한 물질에 대해서도 주의사항이 있다면 함께 안내합니다.

규칙:
1. 모든 응답은 한국어로 작성합니다.
2. 확실하지 않은 경우 "수의사와 상담하세요"를 반드시 안내합니다.
3. 위험도를 반드시 명시합니다: SAFE(안전) / WARNING(주의) / TOXIC(위험)
4. 절대 의료 행위를 대체하지 않으며, 참고 정보임을 명시합니다.`;

/**
 * Vision API로 식별된 물질의 독성을 정밀 분석합니다.
 * 
 * ToxicityDB에 있는 데이터와 OpenAI의 지식을 교차 검증하여
 * 더 정확하고 상세한 독성 판단을 제공합니다.
 * 
 * @param {string} identifiedItem - Vision API가 식별한 물질명 (예: "Lily")
 * @param {Array} visionLabels - Vision API 라벨 목록 [{name, score}]
 * @param {Object|null} dbMatch - ToxicityDB에서 매칭된 항목 (없으면 null)
 * @returns {Promise<Object>} 분석 결과
 *   - riskLevel: 'SAFE' | 'WARNING' | 'TOXIC'
 *   - itemName: 물질 이름 (한글)
 *   - description: 상세 설명
 *   - symptoms: 예상 증상 배열
 *   - advice: 보호자 행동 지침
 */
const analyzeToxicity = async (identifiedItem, visionLabels, dbMatch) => {
  const openai = getOpenAIClient();

  // ToxicityDB 매칭 정보를 프롬프트에 포함
  const dbInfo = dbMatch
    ? `\n[내부 독성 DB 참조]\n이름: ${dbMatch.itemNameKo || dbMatch.itemName}\n독성 수준: ${dbMatch.toxicityLevel}\n카테고리: ${dbMatch.category}\n증상: ${dbMatch.symptoms.join(', ')}\n설명: ${dbMatch.description}`
    : '\n[내부 독성 DB에 해당 물질 정보 없음]';

  // Vision API 라벨 정보를 문맥에 포함
  const labelsInfo = visionLabels
    .slice(0, 8)
    .map(l => `${l.name} (${Math.round(l.score * 100)}%)`)
    .join(', ');

  const userPrompt = `다음 이미지 분석 결과를 바탕으로 고양이에 대한 독성을 판단해주세요.

[Vision API 식별 결과]
주요 식별: ${identifiedItem}
감지된 라벨: ${labelsInfo}
${dbInfo}

다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):
{
  "riskLevel": "SAFE 또는 WARNING 또는 TOXIC",
  "itemName": "물질의 한글 이름",
  "itemNameEn": "영문 이름",
  "description": "고양이에게 미치는 영향 상세 설명 (2~3문장)",
  "symptoms": ["예상 증상1", "예상 증상2"],
  "advice": "보호자 행동 지침 (1~2문장)",
  "confidence": "판단 확신도 (high/medium/low)"
}`;

  console.log('🤖 OpenAI 독성 분석 요청 중...');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.3,       // 낮은 온도 → 일관성 있는 판단
    max_tokens: 500,
    response_format: { type: 'json_object' }
  });

  const result = JSON.parse(completion.choices[0].message.content);
  console.log(`✅ OpenAI 독성 분석 완료 - ${result.itemName}: [${result.riskLevel}]`);

  return result;
};

/**
 * OCR로 추출된 성분표 텍스트를 분석하여
 * 고양이에게 유해한 성분을 검출합니다.
 * 
 * 처리 흐름:
 * 1. 추출된 텍스트에서 성분명을 파싱
 * 2. 각 성분의 독성 여부를 OpenAI가 판단
 * 3. 유해/안전 성분을 분류하여 반환
 * 
 * @param {string} extractedText - OCR로 추출된 성분표 텍스트
 * @param {Array} dbItems - ToxicityDB의 전체 항목 (교차 검증용)
 * @returns {Promise<Object>} 성분 분석 결과
 *   - overallRiskLevel: 전체 위험도
 *   - ingredients: 파싱된 전체 성분 목록
 *   - safeIngredients: 안전한 성분 배열
 *   - detectedHazards: 유해 성분 상세 배열
 *   - summary: 전체 요약 텍스트
 */
const analyzeIngredients = async (extractedText, dbItems = []) => {
  const openai = getOpenAIClient();

  // ToxicityDB에 등록된 물질명 목록을 프롬프트에 포함
  // OpenAI가 이 목록을 참조하여 더 정확한 매칭 수행
  const knownToxicItems = dbItems
    .map(item => `${item.itemNameKo || item.itemName}(${item.toxicityLevel})`)
    .join(', ');

  const userPrompt = `다음은 고양이 사료/간식 제품의 성분표에서 OCR로 추출한 텍스트입니다.
이 성분들을 분석하여 고양이에게 유해한 성분이 있는지 판별해주세요.

[추출된 성분표 텍스트]
${extractedText}

[내부 독성 DB에 등록된 유해 물질 목록 (참고용)]
${knownToxicItems || '(등록된 항목 없음)'}

다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):
{
  "overallRiskLevel": "SAFE 또는 WARNING 또는 TOXIC",
  "ingredients": ["파싱된 성분1", "파싱된 성분2", ...],
  "safeIngredients": ["안전한 성분1", "안전한 성분2", ...],
  "detectedHazards": [
    {
      "ingredient": "유해 성분 이름",
      "riskLevel": "WARNING 또는 TOXIC",
      "reason": "위험한 이유 설명",
      "symptoms": ["예상 증상1", "예상 증상2"]
    }
  ],
  "summary": "전체 분석 요약 (1~2문장, 한국어)"
}`;

  console.log('🤖 OpenAI 성분표 분석 요청 중...');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.2,       // 매우 낮은 온도 → 성분 판단의 정확성 우선
    max_tokens: 800,
    response_format: { type: 'json_object' }
  });

  const result = JSON.parse(completion.choices[0].message.content);
  console.log(`✅ OpenAI 성분 분석 완료 - 전체 위험도: [${result.overallRiskLevel}], 유해 성분: ${result.detectedHazards.length}건`);

  return result;
};

/**
 * 사용자의 질문에 대해 챗봇 응답을 생성합니다.
 * ToxicityDB 데이터를 참조하여 정확한 정보를 제공합니다.
 * 
 * @param {string} userMessage - 사용자 질문 메시지
 * @param {Array} relatedDbItems - 질문과 관련된 ToxicityDB 항목들
 * @param {Array} chatHistory - 이전 대화 기록 (컨텍스트 유지용)
 * @returns {Promise<Object>} 챗봇 응답
 *   - answer: 답변 텍스트
 *   - mentionedItems: 답변에서 언급된 물질 목록
 *   - riskMentioned: 답변에서 언급된 최고 위험도
 */
const generateChatResponse = async (userMessage, relatedDbItems = [], chatHistory = []) => {
  const openai = getOpenAIClient();

  // ToxicityDB 관련 항목을 컨텍스트로 전달
  let dbContext = '';
  if (relatedDbItems.length > 0) {
    dbContext = '\n\n[관련 독성 DB 데이터]\n';
    dbContext += relatedDbItems.map(item =>
      `- ${item.itemNameKo || item.itemName} (${item.category}, ${item.toxicityLevel}): 증상=${item.symptoms.join(',')}. ${item.description || ''}`
    ).join('\n');
  }

  // 대화 메시지 구성
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT + dbContext },
  ];

  // 이전 대화 기록 추가 (최대 10턴, 컨텍스트 유지)
  const recentHistory = chatHistory.slice(-10);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.role === 'bot' ? 'assistant' : 'user',
      content: msg.message
    });
  }

  // 현재 사용자 메시지 추가
  messages.push({ role: 'user', content: userMessage });

  console.log(`💬 OpenAI 챗봇 응답 생성 중... (질문: "${userMessage}")`);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.5,       // 중간 온도 → 자연스러운 대화 + 정확성 균형
    max_tokens: 600,
  });

  const answer = completion.choices[0].message.content;
  console.log('✅ OpenAI 챗봇 응답 생성 완료');

  return {
    answer,
    model: completion.model,
    usage: completion.usage
  };
};

module.exports = {
  analyzeToxicity,
  analyzeIngredients,
  generateChatResponse
};
