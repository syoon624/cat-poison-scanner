/**
 * ============================================
 * Cats Router - 고양이 프로필 API 라우트
 * ============================================
 * 
 * GET    /api/cats      - 내 고양이 목록 조회
 * POST   /api/cats      - 새 고양이 등록
 * PUT    /api/cats/:id  - 고양이 정보 수정
 * DELETE /api/cats/:id  - 고양이 삭제
 * 
 * 모든 엔드포인트는 인증 필수 (authMiddleware)
 */

const express = require('express');
const router = express.Router();
const { getCats, createCat, updateCat, deleteCat } = require('../controllers/catController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, getCats);
router.post('/', authMiddleware, createCat);
router.put('/:id', authMiddleware, updateCat);
router.delete('/:id', authMiddleware, deleteCat);

module.exports = router;
