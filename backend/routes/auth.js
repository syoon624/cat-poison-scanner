/**
 * ============================================
 * Auth Router - 인증 API 라우트
 * ============================================
 * 
 * POST   /api/auth/google  - Google OAuth 로그인/회원가입
 * GET    /api/auth/me       - 현재 사용자 정보 조회 (인증 필요)
 * DELETE /api/auth/account  - 계정 삭제 (인증 필요)
 */

const express = require('express');
const router = express.Router();
const { googleLogin, getMe, deleteAccount } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// Google 소셜 로그인 (토큰 검증 → JWT 발급)
router.post('/google', googleLogin);

// 현재 사용자 정보 (인증 필수)
router.get('/me', authMiddleware, getMe);

// 계정 삭제 (인증 필수)
router.delete('/account', authMiddleware, deleteAccount);

module.exports = router;
