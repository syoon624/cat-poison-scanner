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
 *    - 독성 여부 및 위험도를 반환
 * 
 * 2. 'ocr' 모드 (성분표 스캔):
 *    - Google Vision API로 텍스트를 추출 (OCR)
 *    - 추출된 텍스트에서 성분명을 파싱
 *    - 각 성분을 ToxicityDB와 대조하여 유해 성분 검출
 * 
 * [현재 Phase 1]
 * Vision API 연동 전이므로 Mock 데이터를 반환합니다.
 * 프론트엔드에서 이미지 업로드 테스트를 진행할 수 있도록
 * 실제 API 응답 형식과 동일한 구조의 Mock 응답을 제공합니다.
 */

const ToxicityDB = require('../models/ToxicityDB');

/**
 * POST /api/scan/image
 * 이미지를 분석하여 독성 여부를 판별합니다.
 * 
 * @param {File} req.file - Multer로 업로드된 이미지 파일
 * @param {string} req.body.scanType - 스캔 모드 ('object' | 'ocr')
 * 
 * @returns {Object} 분석 결과
 * - success: boolean
 * - scanType: 사용된 스캔 모드
 * - result: 분석 결과 상세
 *   - identifiedItem: 식별된 물질명 (object 모드)
 *   - extractedText: 추출된 텍스트 (ocr 모드)
 *   - riskLevel: 위험도 ('SAFE' | 'WARNING' | 'TOXIC')
 *   - details: 상세 설명
 *   - symptoms: 예상 증상 목록 (해당 시)
 */
const scanImage = async (req, res) => {
  try {
    // 이미지 파일 존재 여부 확인
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '이미지 파일이 필요합니다.'
      });
    }

    // 스캔 타입 확인 ('object' 또는 'ocr')
    const { scanType } = req.body;
    if (!scanType || !['object', 'ocr'].includes(scanType)) {
      return res.status(400).json({
        success: false,
        message: "scanType은 'object' 또는 'ocr'이어야 합니다."
      });
    }

    console.log(`📸 스캔 요청 수신 - 모드: ${scanType}, 파일: ${req.file.filename}`);

    // ============================================
    // [Mock 응답] Phase 1에서는 Mock 데이터 반환
    // TODO: Phase 2+에서 Google Vision API 연동
    // ============================================

    let result;

    if (scanType === 'object') {
      // ---- 사물/식물 스캔 Mock 응답 ----
      // 실제로는 Vision API가 이미지를 분석하여 물질명을 반환
      result = await getMockObjectScanResult();
    } else {
      // ---- 성분표 OCR Mock 응답 ----
      // 실제로는 Vision API가 텍스트를 추출하고 파싱
      result = await getMockOCRScanResult();
    }

    // 법적 고지 문구 추가 (모든 스캔 결과에 포함)
    const legalDisclaimer = '⚠️ 본 결과는 참고용이며, 최종 판단 및 응급 상황은 수의사와 상담하십시오.';

    res.json({
      success: true,
      scanType,
      imageUrl: `/uploads/${req.file.filename}`,
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
 * 사물/식물 스캔 Mock 결과 생성
 * 랜덤으로 다양한 위험도의 결과를 반환하여 프론트엔드 테스트 지원
 */
const getMockObjectScanResult = async () => {
  // Mock 시나리오 목록 - 다양한 위험도를 테스트할 수 있도록 구성
  const mockScenarios = [
    {
      identifiedItem: 'Lily (백합)',
      riskLevel: 'TOXIC',
      confidence: 0.92,
      details: '백합은 고양이에게 매우 위험한 식물입니다. 꽃가루, 잎, 줄기 모두 독성이 있으며, 소량 섭취만으로도 급성 신부전을 유발할 수 있습니다.',
      symptoms: ['구토', '식욕 부진', '무기력', '신부전', '사망 가능'],
      category: 'PLANT'
    },
    {
      identifiedItem: 'Spider Plant (접란)',
      riskLevel: 'SAFE',
      confidence: 0.88,
      details: '접란(Spider Plant)은 고양이에게 안전한 식물입니다. 간혹 잎을 씹을 수 있으나 독성은 없습니다.',
      symptoms: [],
      category: 'PLANT'
    },
    {
      identifiedItem: 'Aloe Vera (알로에)',
      riskLevel: 'WARNING',
      confidence: 0.85,
      details: '알로에는 고양이가 섭취할 경우 경미한 위장 장애를 일으킬 수 있습니다. 대량 섭취 시 주의가 필요합니다.',
      symptoms: ['구토', '설사', '무기력'],
      category: 'PLANT'
    }
  ];

  // 랜덤 시나리오 선택
  const randomIndex = Math.floor(Math.random() * mockScenarios.length);
  return mockScenarios[randomIndex];
};

/**
 * 성분표 OCR Mock 결과 생성
 * 실제 사료/간식 성분표를 시뮬레이션
 */
const getMockOCRScanResult = async () => {
  // Mock OCR 추출 텍스트 (실제 사료 성분표 형식)
  const mockExtractedText = '닭고기, 현미, 연어유, 타우린, 비타민E, 양파 가루, 자일리톨';

  // 검출된 유해 성분 목록
  const detectedHazards = [
    {
      ingredient: '양파 가루',
      riskLevel: 'TOXIC',
      details: '양파는 고양이의 적혈구를 파괴하여 빈혈을 유발합니다. 가루 형태도 동일하게 위험합니다.',
      symptoms: ['빈혈', '무기력', '식욕 부진', '황달']
    },
    {
      ingredient: '자일리톨',
      riskLevel: 'TOXIC',
      details: '자일리톨은 고양이에게 저혈당과 간 손상을 유발할 수 있는 매우 위험한 성분입니다.',
      symptoms: ['저혈당', '구토', '간부전', '발작']
    }
  ];

  // 안전한 성분 목록
  const safeIngredients = ['닭고기', '현미', '연어유', '타우린', '비타민E'];

  // 전체 위험도 판정 (하나라도 TOXIC이면 전체 TOXIC)
  const overallRisk = detectedHazards.length > 0 ? 'TOXIC' : 'SAFE';

  return {
    extractedText: mockExtractedText,
    overallRiskLevel: overallRisk,
    totalIngredients: safeIngredients.length + detectedHazards.length,
    safeIngredients,
    detectedHazards,
    details: detectedHazards.length > 0
      ? `${detectedHazards.length}개의 유해 성분이 검출되었습니다. 이 제품의 급여를 삼가해주세요.`
      : '유해 성분이 검출되지 않았습니다. 안전한 제품으로 판단됩니다.'
  };
};

module.exports = { scanImage };
