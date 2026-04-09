/**
 * ============================================
 * Scan Controller - 이미지 분석 컨트롤러
 * ============================================
 * 
 * 두 가지 스캔 모드를 지원합니다:
 * 
 * 1. 'object' 모드 (사물/식물 스캔):
 *    - Google Vision API로 이미지 속 객체/식물을 식별
 *    - 식별된 물질명을 ToxicityDB와 대조
 *    - OpenAI로 교차 검증하여 정밀 독성 판단
 * 
 * 2. 'ocr' 모드 (성분표 스캔):
 *    - Google Vision API로 텍스트를 추출 (OCR)
 *    - OpenAI로 추출된 성분을 파싱하고 유해 성분 검출
 * 
 * [Phase 4] 실제 API 연동 완료
 * - Vision API 실패 시 "인식할 수 없음" 반환 (Mock 데이터 사용하지 않음)
 * - OpenAI 키 미설정 시 ToxicityDB 매칭만으로 판단
 */

const ToxicityDB = require('../models/ToxicityDB');
const { detectLabels, extractText } = require('../services/visionService');
const { analyzeToxicity, analyzeIngredients } = require('../services/openaiService');

/**
 * POST /api/scan/image
 * 이미지를 분석하여 독성 여부를 판별합니다.
 * 
 * 처리 흐름:
 * ┌─────────────────────────────────────────────────┐
 * │ 1. 이미지 업로드 (Multer)                         │
 * │ 2. Vision API 호출 (object: 라벨감지 / ocr: 텍스트추출) │
 * │ 3. ToxicityDB 대조 (키워드 매칭)                   │
 * │ 4. OpenAI 교차 검증 (정밀 판단)                     │
 * │ 5. 결과 반환 (riskLevel + 상세 정보)               │
 * └─────────────────────────────────────────────────┘
 * 
 * @param {File} req.file - Multer로 업로드된 이미지 파일
 * @param {string} req.body.scanType - 스캔 모드 ('object' | 'ocr')
 */
const scanImage = async (req, res) => {
  try {
    // ─── 1. 입력 유효성 검증 ───
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '이미지 파일이 필요합니다.'
      });
    }

    const { scanType } = req.body;
    if (!scanType || !['object', 'ocr'].includes(scanType)) {
      return res.status(400).json({
        success: false,
        message: "scanType은 'object' 또는 'ocr'이어야 합니다."
      });
    }

    console.log(`📸 스캔 요청 수신 - 모드: ${scanType}, 크기: ${(req.file.size / 1024).toFixed(1)}KB`);

    let result;

    // ─── 2. 스캔 모드별 처리 분기 (메모리 Buffer 전달) ───
    if (scanType === 'object') {
      result = await handleObjectScan(req.file.buffer);
    } else {
      result = await handleOCRScan(req.file.buffer);
    }

    const legalDisclaimer = '⚠️ 본 결과는 참고용이며, 최종 판단 및 응급 상황은 수의사와 상담하십시오.';

    res.json({
      success: true,
      scanType,
      result,
      disclaimer: legalDisclaimer
    });

  } catch (error) {
    console.error('스캔 처리 에러:', error);
    res.status(500).json({
      success: false,
      message: '이미지 분석 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

/**
 * ============================================
 * 사물/식물 스캔 처리 (object 모드)
 * ============================================
 * 
 * 흐름:
 * 1. Vision API → 라벨 감지 (식물/사물 식별)
 * 2. ToxicityDB → 식별된 물질명으로 검색
 * 3. OpenAI → DB 결과 + Vision 라벨로 정밀 판단
 * 4. 폴백: Vision API 실패 → "인식할 수 없음" / OpenAI 실패 → DB만 사용
 * 
 * @param {Buffer} imageBuffer - 업로드된 이미지 Buffer
 * @returns {Object} 분석 결과
 */
const handleObjectScan = async (imageBuffer) => {
  // ─── Step 1: Vision API 라벨 감지 ───
  let visionResult;
  try {
    visionResult = await detectLabels(imageBuffer);
  } catch (visionError) {
    console.warn('⚠️ Vision API 호출 실패:', visionError.message);
    return {
      identifiedItem: '인식할 수 없음',
      riskLevel: 'UNKNOWN',
      confidence: 0,
      details: '이미지를 분석할 수 없습니다. Vision API에 연결할 수 없거나 API 키가 설정되지 않았습니다. 잠시 후 다시 시도해주세요.',
      symptoms: [],
      category: 'UNKNOWN',
      source: 'error-vision-unavailable'
    };
  }

  // ─── Step 2: ToxicityDB에서 매칭 검색 ───
  // Vision API가 감지한 라벨 + 웹 엔티티 이름으로 DB를 검색
  const allNames = [
    visionResult.bestGuess,
    ...visionResult.labels.map(l => l.name),
    ...visionResult.webEntities.filter(e => e.description).map(e => e.description)
  ];

  let dbMatch = null;
  try {
    // 각 이름으로 ToxicityDB를 순회 검색
    // itemName, aliases, itemNameKo 필드에서 대소문자 무시하여 매칭
    for (const name of allNames) {
      if (!name) continue;
      const match = await ToxicityDB.findOne({
        $or: [
          { itemName: { $regex: new RegExp(name, 'i') } },
          { itemNameKo: { $regex: new RegExp(name, 'i') } },
          { aliases: { $elemMatch: { $regex: new RegExp(name, 'i') } } }
        ]
      }).lean();
      if (match) {
        dbMatch = match;
        console.log(`🔍 ToxicityDB 매칭 성공: "${name}" → ${match.itemNameKo || match.itemName} [${match.toxicityLevel}]`);
        break;
      }
    }
  } catch (dbError) {
    console.warn('⚠️ ToxicityDB 검색 실패:', dbError.message);
  }

  // ─── Step 3: OpenAI 교차 검증 (정밀 판단) ───
  let aiAnalysis;
  try {
    aiAnalysis = await analyzeToxicity(
      visionResult.bestGuess,
      visionResult.labels,
      dbMatch
    );
  } catch (aiError) {
    console.warn('⚠️ OpenAI 분석 실패, DB/Vision 결과만 사용:', aiError.message);
    aiAnalysis = null;
  }

  // ─── Step 4: 최종 결과 조합 ───
  // 우선순위: OpenAI 분석 > ToxicityDB > Vision API 라벨
  if (aiAnalysis) {
    // OpenAI 분석 성공 → 가장 정밀한 결과
    return {
      identifiedItem: `${aiAnalysis.itemName} (${aiAnalysis.itemNameEn || visionResult.bestGuess})`,
      riskLevel: aiAnalysis.riskLevel,
      confidence: visionResult.labels[0]?.score || 0.8,
      details: aiAnalysis.description,
      symptoms: aiAnalysis.symptoms || [],
      advice: aiAnalysis.advice,
      category: dbMatch?.category || 'UNKNOWN',
      source: 'vision+openai+db'
    };
  } else if (dbMatch) {
    // OpenAI 실패, DB 매칭 성공 → DB 기반 결과
    const riskMapping = { HIGH: 'TOXIC', MEDIUM: 'WARNING', LOW: 'SAFE' };
    return {
      identifiedItem: `${dbMatch.itemNameKo || dbMatch.itemName} (${dbMatch.itemName})`,
      riskLevel: riskMapping[dbMatch.toxicityLevel] || 'WARNING',
      confidence: visionResult.labels[0]?.score || 0.7,
      details: dbMatch.description || `${dbMatch.itemNameKo}은(는) 독성 수준 [${dbMatch.toxicityLevel}]로 분류되어 있습니다.`,
      symptoms: dbMatch.symptoms || [],
      category: dbMatch.category,
      source: 'vision+db'
    };
  } else {
    // DB에도 없는 경우 → Vision 라벨만으로 기본 정보 제공
    return {
      identifiedItem: visionResult.bestGuess,
      riskLevel: 'SAFE',
      confidence: visionResult.labels[0]?.score || 0.5,
      details: `"${visionResult.bestGuess}"이(가) 감지되었습니다. 독성 데이터베이스에 등록되지 않은 항목입니다. 안전 여부가 확실하지 않은 경우 수의사와 상담하세요.`,
      symptoms: [],
      category: 'UNKNOWN',
      source: 'vision-only',
      visionLabels: visionResult.labels.slice(0, 5).map(l => l.name)
    };
  }
};

/**
 * ============================================
 * 성분표 OCR 스캔 처리 (ocr 모드)
 * ============================================
 * 
 * 흐름:
 * 1. Vision API → 텍스트 추출 (OCR)
 * 2. OpenAI → 성분 파싱 + 유해 성분 판별
 * 3. 폴백: Vision 실패 → "인식할 수 없음" / OpenAI 실패 → DB 키워드 매칭
 * 
 * @param {Buffer} imageBuffer - 업로드된 이미지 Buffer
 * @returns {Object} 성분 분석 결과
 */
const handleOCRScan = async (imageBuffer) => {
  // ─── Step 1: Vision API OCR 텍스트 추출 ───
  let ocrResult;
  try {
    ocrResult = await extractText(imageBuffer);
  } catch (visionError) {
    console.warn('⚠️ Vision API OCR 실패:', visionError.message);
    return {
      extractedText: '',
      overallRiskLevel: 'UNKNOWN',
      totalIngredients: 0,
      safeIngredients: [],
      detectedHazards: [],
      details: '성분표를 분석할 수 없습니다. Vision API에 연결할 수 없거나 API 키가 설정되지 않았습니다. 잠시 후 다시 시도해주세요.',
      source: 'error-vision-unavailable'
    };
  }

  // 텍스트가 추출되지 않은 경우
  if (!ocrResult.fullText || ocrResult.fullText.length < 3) {
    return {
      extractedText: ocrResult.fullText || '',
      overallRiskLevel: 'SAFE',
      totalIngredients: 0,
      safeIngredients: [],
      detectedHazards: [],
      details: '이미지에서 텍스트를 추출하지 못했습니다. 성분표가 잘 보이도록 다시 촬영해주세요.',
      source: 'vision-ocr-empty'
    };
  }

  // ─── Step 2: ToxicityDB 전체 항목 로드 (OpenAI에 참고 정보로 전달) ───
  let dbItems = [];
  try {
    dbItems = await ToxicityDB.find({}).lean();
  } catch (dbError) {
    console.warn('⚠️ ToxicityDB 로드 실패:', dbError.message);
  }

  // ─── Step 3: OpenAI 성분 분석 ───
  let aiAnalysis;
  try {
    aiAnalysis = await analyzeIngredients(ocrResult.fullText, dbItems);
  } catch (aiError) {
    console.warn('⚠️ OpenAI 성분 분석 실패, DB 키워드 매칭으로 대체:', aiError.message);
    aiAnalysis = null;
  }

  // ─── Step 4: 결과 조합 ───
  if (aiAnalysis) {
    // OpenAI 분석 성공 → 가장 정밀한 결과
    return {
      extractedText: ocrResult.fullText,
      overallRiskLevel: aiAnalysis.overallRiskLevel,
      totalIngredients: (aiAnalysis.ingredients || []).length,
      safeIngredients: aiAnalysis.safeIngredients || [],
      detectedHazards: (aiAnalysis.detectedHazards || []).map(h => ({
        ingredient: h.ingredient,
        riskLevel: h.riskLevel,
        details: h.reason,
        symptoms: h.symptoms || []
      })),
      details: aiAnalysis.summary,
      source: 'vision-ocr+openai'
    };
  } else {
    // OpenAI 실패 → 추출된 텍스트에서 DB 키워드 직접 매칭
    return await fallbackOCRAnalysis(ocrResult.fullText, dbItems);
  }
};

/**
 * OpenAI 실패 시 폴백: ToxicityDB 키워드 매칭으로 성분 분석
 * 추출된 텍스트에서 DB에 등록된 유해 물질명을 직접 검색합니다.
 * 
 * @param {string} text - OCR로 추출된 텍스트
 * @param {Array} dbItems - ToxicityDB 전체 항목
 * @returns {Object} 분석 결과
 */
const fallbackOCRAnalysis = async (text, dbItems) => {
  const lowerText = text.toLowerCase();
  const detectedHazards = [];

  // DB의 각 항목에 대해 텍스트에서 키워드 매칭
  for (const item of dbItems) {
    // 물질명, 한글명, 별칭 모두를 검색 대상으로 사용
    const searchTerms = [
      item.itemName.toLowerCase(),
      (item.itemNameKo || '').toLowerCase(),
      ...item.aliases.map(a => a.toLowerCase())
    ].filter(t => t.length > 1); // 1글자 이하는 오탐 방지를 위해 제외

    for (const term of searchTerms) {
      if (lowerText.includes(term)) {
        const riskMapping = { HIGH: 'TOXIC', MEDIUM: 'WARNING', LOW: 'SAFE' };
        detectedHazards.push({
          ingredient: item.itemNameKo || item.itemName,
          riskLevel: riskMapping[item.toxicityLevel] || 'WARNING',
          details: item.description || `${item.itemNameKo}은(는) 고양이에게 독성 수준 [${item.toxicityLevel}]입니다.`,
          symptoms: item.symptoms || []
        });
        break; // 같은 항목이 여러 별칭으로 중복 감지되지 않도록
      }
    }
  }

  // 전체 위험도 결정 (하나라도 TOXIC이면 전체 TOXIC)
  let overallRisk = 'SAFE';
  if (detectedHazards.some(h => h.riskLevel === 'TOXIC')) {
    overallRisk = 'TOXIC';
  } else if (detectedHazards.some(h => h.riskLevel === 'WARNING')) {
    overallRisk = 'WARNING';
  }

  return {
    extractedText: text,
    overallRiskLevel: overallRisk,
    totalIngredients: 0, // 키워드 매칭에서는 전체 성분 파싱 불가
    safeIngredients: [],
    detectedHazards,
    details: detectedHazards.length > 0
      ? `${detectedHazards.length}개의 유해 성분이 검출되었습니다. (DB 키워드 매칭)`
      : '유해 성분이 검출되지 않았습니다.',
    source: 'vision-ocr+db-fallback'
  };
};

module.exports = { scanImage };
