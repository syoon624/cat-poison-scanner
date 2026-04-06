/**
 * ============================================
 * Chat Router - AI 챗봇 API 라우트
 * ============================================
 * 
 * POST /api/chat/ask
 * - 텍스트 기반 독성 물질 질의
 * - 사용자가 입력한 메시지를 분석하여 답변 생성
 */

const express = require('express');
const router = express.Router();
const { askChat } = require('../controllers/chatController');

/**
 * POST /api/chat/ask
 * 
 * JSON Body:
 * - message: String (사용자의 질문)
 * 
 * 예시: { "message": "고양이가 백합을 먹어도 되나요?" }
 */
router.post('/ask', askChat);

module.exports = router;
