/**
 * ============================================
 * Auth Middleware - JWT 인증 미들웨어
 * ============================================
 * 
 * Authorization 헤더의 Bearer 토큰을 검증하고,
 * 검증된 사용자 정보를 req.user에 설정합니다.
 * 
 * 사용법:
 *   router.get('/protected', authMiddleware, (req, res) => {
 *     // req.user._id, req.user.email 사용 가능
 *   });
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'purrfectscan-default-secret-change-in-production';

/**
 * 필수 인증 미들웨어
 * 유효한 JWT가 없으면 401 응답 반환
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다. 로그인해주세요.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // DB에서 사용자 존재 여부 확인 (탈퇴한 사용자 방지)
    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '존재하지 않는 사용자입니다.'
      });
    }

    // req.user에 사용자 정보 설정 (이후 컨트롤러에서 사용)
    req.user = {
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      profileImage: user.profileImage
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '인증이 만료되었습니다. 다시 로그인해주세요.'
      });
    }
    return res.status(401).json({
      success: false,
      message: '유효하지 않은 인증 토큰입니다.'
    });
  }
};

/**
 * 선택적 인증 미들웨어
 * 토큰이 있으면 검증하고 req.user를 설정하지만,
 * 없어도 요청을 거부하지 않음 (비로그인 사용 가능 API용)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).lean();

    if (user) {
      req.user = {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
        profileImage: user.profileImage
      };
    }
  } catch {
    // 토큰 검증 실패해도 무시하고 진행
  }
  next();
};

module.exports = { authMiddleware, optionalAuth, JWT_SECRET };
