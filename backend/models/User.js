/**
 * ============================================
 * User 모델 (사용자)
 * ============================================
 * 앱 사용자의 계정 정보를 저장합니다.
 * Google OAuth 소셜 로그인을 지원합니다.
 * 
 * 필드:
 * - email: 이메일 (Google 계정 이메일, 고유값)
 * - googleId: Google OAuth 고유 ID
 * - displayName: 사용자 표시 이름
 * - profileImage: Google 프로필 이미지 URL
 * - passwordHash: 비밀번호 해시 (소셜 로그인 시 불필요)
 * - createdAt/updatedAt: 자동 생성 타임스탬프
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // 사용자 이메일 - Google 계정 이메일
  email: {
    type: String,
    required: [true, '이메일은 필수 입력값입니다.'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, '유효한 이메일 형식을 입력해주세요.']
  },

  // Google OAuth 고유 ID - 소셜 로그인 식별용
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },

  // 사용자 표시 이름 (Google 프로필 이름)
  displayName: {
    type: String,
    trim: true,
    default: ''
  },

  // Google 프로필 이미지 URL
  profileImage: {
    type: String,
    default: ''
  },

  // 비밀번호 해시 - 소셜 로그인 사용자는 null
  passwordHash: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
