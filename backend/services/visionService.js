/**
 * ============================================
 * Google Cloud Vision API 서비스
 * ============================================
 * 
 * Google Cloud Vision API를 호출하여 이미지를 분석합니다.
 * 
 * 두 가지 분석 모드를 제공합니다:
 * 
 * 1. 라벨 감지 (LABEL_DETECTION)
 *    - 이미지 속 객체/식물/사물을 식별
 *    - 예: "Lily", "Tulip", "Chocolate" 등의 라벨 반환
 *    - confidence(신뢰도) 점수와 함께 반환
 * 
 * 2. 텍스트 추출 (TEXT_DETECTION / OCR)
 *    - 이미지 속 텍스트를 인식하여 문자열로 반환
 *    - 성분표, 제품 라벨 등의 텍스트 추출에 사용
 * 
 * API 문서: https://cloud.google.com/vision/docs/reference/rest
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Google Cloud Vision API 엔드포인트 (REST API)
const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

/**
 * 이미지 파일을 base64로 인코딩
 * Vision API는 base64 인코딩된 이미지 데이터를 요구합니다.
 * 
 * @param {string} filePath - 로컬 이미지 파일 경로
 * @returns {string} base64 인코딩된 이미지 문자열
 */
const encodeImageToBase64 = (filePath) => {
  const absolutePath = path.resolve(filePath);
  const imageBuffer = fs.readFileSync(absolutePath);
  return imageBuffer.toString('base64');
};

/**
 * 이미지에서 객체/식물/사물 라벨을 감지합니다.
 * 
 * 처리 흐름:
 * 1. 이미지를 base64로 인코딩
 * 2. Vision API에 LABEL_DETECTION + WEB_DETECTION 요청
 * 3. 감지된 라벨 목록과 신뢰도를 반환
 * 
 * @param {string} imagePath - 분석할 이미지 파일의 로컬 경로
 * @returns {Promise<Object>} 감지 결과
 *   - labels: [{ name, score, mid }] 라벨 목록
 *   - webEntities: [{ description, score }] 웹 엔티티 (더 정확한 식별)
 *   - bestGuess: 가장 유력한 식별 결과
 */
const detectLabels = async (imagePath) => {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  
  // API 키 미설정 시 에러
  if (!apiKey) {
    throw new Error('GOOGLE_CLOUD_VISION_API_KEY가 설정되지 않았습니다. .env 파일을 확인해주세요.');
  }

  // 이미지를 base64로 인코딩
  const imageBase64 = encodeImageToBase64(imagePath);

  // Vision API 요청 본문 구성
  // LABEL_DETECTION: 일반적인 객체/식물/사물 라벨
  // WEB_DETECTION: 웹에서 비슷한 이미지를 검색하여 더 정확한 식별
  const requestBody = {
    requests: [
      {
        image: {
          content: imageBase64
        },
        features: [
          {
            type: 'LABEL_DETECTION',
            maxResults: 15   // 최대 15개 라벨
          },
          {
            type: 'WEB_DETECTION',
            maxResults: 10   // 최대 10개 웹 엔티티
          }
        ]
      }
    ]
  };

  console.log('🔍 Vision API 라벨 감지 요청 중...');

  // Vision API 호출
  const response = await axios.post(
    `${VISION_API_URL}?key=${apiKey}`,
    requestBody,
    { timeout: 15000 }
  );

  // 응답 파싱
  const annotations = response.data.responses[0];

  // 라벨 감지 결과 추출
  const labels = (annotations.labelAnnotations || []).map(label => ({
    name: label.description,           // 라벨 이름 (예: "Lily", "Plant")
    score: label.score,                 // 신뢰도 (0.0 ~ 1.0)
    mid: label.mid                      // Google Knowledge Graph ID
  }));

  // 웹 감지 결과 추출 (더 구체적인 식별 정보)
  const webDetection = annotations.webDetection || {};
  const webEntities = (webDetection.webEntities || []).map(entity => ({
    description: entity.description,    // 엔티티 이름
    score: entity.score                 // 관련성 점수
  }));

  // 최적 추측 라벨 (Vision API가 가장 유력하다고 판단한 결과)
  const bestGuessLabels = webDetection.bestGuessLabels || [];
  const bestGuess = bestGuessLabels.length > 0
    ? bestGuessLabels[0].label
    : (labels.length > 0 ? labels[0].name : 'Unknown');

  console.log(`✅ Vision API 감지 완료 - Best Guess: "${bestGuess}", 라벨 ${labels.length}개`);

  return {
    labels,
    webEntities,
    bestGuess
  };
};

/**
 * 이미지에서 텍스트를 추출합니다 (OCR).
 * 성분표, 제품 라벨 등의 텍스트를 인식합니다.
 * 
 * 처리 흐름:
 * 1. 이미지를 base64로 인코딩
 * 2. Vision API에 TEXT_DETECTION 요청
 * 3. 추출된 전체 텍스트와 개별 단어/블록 반환
 * 
 * @param {string} imagePath - 분석할 이미지 파일의 로컬 경로
 * @returns {Promise<Object>} OCR 결과
 *   - fullText: 추출된 전체 텍스트
 *   - blocks: 개별 텍스트 블록 배열
 */
const extractText = async (imagePath) => {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_CLOUD_VISION_API_KEY가 설정되지 않았습니다. .env 파일을 확인해주세요.');
  }

  const imageBase64 = encodeImageToBase64(imagePath);

  // Vision API 요청 - TEXT_DETECTION (OCR)
  // DOCUMENT_TEXT_DETECTION은 긴 문서에 더 적합하지만,
  // 성분표는 비교적 짧은 텍스트이므로 TEXT_DETECTION 사용
  const requestBody = {
    requests: [
      {
        image: {
          content: imageBase64
        },
        features: [
          {
            type: 'TEXT_DETECTION'
          }
        ],
        // 한국어 + 영어 텍스트 힌트 (성분표에 혼용될 수 있음)
        imageContext: {
          languageHints: ['ko', 'en']
        }
      }
    ]
  };

  console.log('📝 Vision API OCR 텍스트 추출 요청 중...');

  const response = await axios.post(
    `${VISION_API_URL}?key=${apiKey}`,
    requestBody,
    { timeout: 15000 }
  );

  const annotations = response.data.responses[0];
  const textAnnotations = annotations.textAnnotations || [];

  // 첫 번째 항목이 전체 텍스트, 나머지는 개별 단어/블록
  const fullText = textAnnotations.length > 0
    ? textAnnotations[0].description
    : '';

  // 개별 텍스트 블록 (위치 정보 포함)
  const blocks = textAnnotations.slice(1).map(annotation => ({
    text: annotation.description,
    bounds: annotation.boundingPoly
  }));

  console.log(`✅ Vision API OCR 완료 - 추출된 텍스트 길이: ${fullText.length}자`);

  return {
    fullText: fullText.trim(),
    blocks
  };
};

module.exports = {
  detectLabels,
  extractText
};
