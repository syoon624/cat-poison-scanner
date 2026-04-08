/**
 * ============================================
 * PurrfectScan Backend - 메인 서버 진입점
 * ============================================
 * 반려묘 안전/건강 복합 관리 앱의 Express 서버입니다.
 * 
 * 주요 기능:
 * - 이미지 스캔 API (사물/식물 인식, OCR 성분표 분석)
 * - AI 챗봇 API (독성 물질 질의응답)
 * - 타임라인 API (건강 기록 관리)
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// .env 파일에서 환경 변수 로드
dotenv.config();

const app = express();

// ============================================
// 미들웨어 설정
// ============================================

// CORS 설정 - 모든 출처에서의 요청 허용 (개발 단계)
app.use(cors());

// JSON 요청 바디 파싱 (최대 10MB)
app.use(express.json({ limit: '10mb' }));

// URL-encoded 요청 바디 파싱
app.use(express.urlencoded({ extended: true }));

// 업로드된 파일을 정적 파일로 서빙
app.use('/uploads', express.static('uploads'));

// ============================================
// API 라우트 등록
// ============================================

// 스캔 관련 API (이미지 분석, OCR)
app.use('/api/scan', require('./routes/scan'));

// 챗봇 관련 API (독성 물질 질의)
app.use('/api/chat', require('./routes/chat'));

// 타임라인 관련 API (건강 기록 관리)
app.use('/api/timeline', require('./routes/timeline'));

// ============================================
// 헬스 체크 엔드포인트
// ============================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'PurrfectScan API 서버가 정상 동작 중입니다.',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// 404 핸들러 - 등록되지 않은 라우트
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `요청한 경로를 찾을 수 없습니다: ${req.method} ${req.originalUrl}`
  });
});

// ============================================
// 글로벌 에러 핸들러
// ============================================
app.use((err, req, res, next) => {
  console.error('서버 에러:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '서버 내부 오류가 발생했습니다.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// 서버 시작
// ============================================
const PORT = process.env.PORT || 5000;

/**
 * 서버 부팅 순서:
 * 1. MongoDB 연결 시도
 * 2. 연결 성공 시 Express 서버 시작
 * 3. 연결 실패 시 에러 로그 출력 후 종료
 */
const startServer = async () => {
  // MongoDB 연결 시도 (실패해도 서버는 시작 - 컨트롤러에 폴백 로직 있음)
  try {
    await connectDB();
  } catch (error) {
    console.warn('⚠️ MongoDB 연결 실패 - Mock 모드로 동작합니다:', error.message);
    console.warn('   (MongoDB 없이도 API 테스트 가능합니다)');
  }

  // Express 서버 리스닝 시작
  app.listen(PORT, () => {
    console.log(`🐱 PurrfectScan 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📍 챗봇 테스트: POST http://localhost:${PORT}/api/chat/ask`);
    console.log(`🌍 환경: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();

module.exports = app;
