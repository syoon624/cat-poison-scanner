/**
 * ============================================
 * User 모델 (사용자)
 * ============================================
 * 앱 사용자의 계정 정보를 저장합니다.
 * 
 * 필드:
 * - email: 로그인에 사용되는 이메일 (고유값)
 * - passwordHash: bcrypt로 해시된 비밀번호
 * - createdAt: 가입 일시 (자동 생성)
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // 사용자 이메일 - 로그인 ID로 사용
  email: {
    type: String,
    required: [true, '이메일은 필수 입력값입니다.'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, '유효한 이메일 형식을 입력해주세요.']
  },
  
  // 비밀번호 해시 - 평문 비밀번호는 저장하지 않음
  passwordHash: {
    type: String,
    required: [true, '비밀번호는 필수 입력값입니다.']
  }
}, {
  // createdAt, updatedAt 자동 생성
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
