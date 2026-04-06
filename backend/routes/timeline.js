/**
 * ============================================
 * Timeline Router - 건강 타임라인 API 라우트
 * ============================================
 * 
 * GET  /api/timeline/:catId  - 특정 고양이의 타임라인 조회
 * POST /api/timeline         - 새 타임라인 기록 추가
 */

const express = require('express');
const router = express.Router();
const { getTimeline, addTimelineEntry } = require('../controllers/timelineController');

/**
 * GET /api/timeline/:catId
 * 
 * Params:
 * - catId: 조회할 고양이의 MongoDB ObjectId
 * 
 * Query (선택):
 * - startDate: 조회 시작일 (ISO 8601)
 * - endDate: 조회 종료일 (ISO 8601)
 * - type: 이벤트 유형 필터 ('PLANT'|'INGREDIENT'|'CHAT'|'SYMPTOM'|'HOSPITAL')
 */
router.get('/:catId', getTimeline);

/**
 * POST /api/timeline
 * 
 * JSON Body:
 * - userId: String (사용자 ID, 선택 - 인증 구현 전까지)
 * - catId: String (고양이 ID, 필수)
 * - type: String (이벤트 유형, 필수)
 * - content: String (내용, 필수)
 * - riskLevel: String (위험도, 선택, 기본값: 'NONE')
 * - imageUrl: String (이미지 URL, 선택)
 * - palatabilityRating: Number (기호성 별점 1~5, 선택)
 */
router.post('/', addTimelineEntry);

module.exports = router;
