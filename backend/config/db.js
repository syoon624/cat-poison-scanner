/**
 * ============================================
 * MongoDB 데이터베이스 연결 설정
 * ============================================
 * Mongoose를 사용하여 MongoDB에 연결합니다.
 * 
 * 지원 환경:
 * - 로컬 MongoDB (mongodb://localhost:27017/purrfectscan)
 * - MongoDB Atlas (클라우드 호스팅)
 */

const mongoose = require('mongoose');

/**
 * MongoDB에 연결하는 비동기 함수
 * 
 * 연결 옵션:
 * - 자동 인덱스 생성 활성화
 * - 서버 선택 타임아웃 5초
 * 
 * @returns {Promise<void>}
 * @throws {Error} 연결 실패 시 에러를 throw합니다
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/purrfectscan');
    
    console.log(`✅ MongoDB 연결 성공: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB 연결 실패: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
