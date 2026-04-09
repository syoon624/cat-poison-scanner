/**
 * ============================================
 * Timeline Router - 건강 타임라인 API 라우트
 * ============================================
 * 
 * GET    /api/timeline/:catId  - 특정 고양이의 타임라인 조회
 * POST   /api/timeline         - 새 타임라인 기록 추가
 * PUT    /api/timeline/:id     - 타임라인 기록 수정
 * DELETE /api/timeline/:id     - 타임라인 기록 삭제
 * 
 * 모든 엔드포인트는 인증 필수 (authMiddleware)
 */

const express = require('express');
const router = express.Router();
const {
  getTimeline,
  addTimelineEntry,
  updateTimelineEntry,
  deleteTimelineEntry
} = require('../controllers/timelineController');
const { authMiddleware } = require('../middleware/auth');

router.get('/:catId', authMiddleware, getTimeline);
router.post('/', authMiddleware, addTimelineEntry);
router.put('/:id', authMiddleware, updateTimelineEntry);
router.delete('/:id', authMiddleware, deleteTimelineEntry);

module.exports = router;
