/**
 * ============================================
 * Auth Controller - 인증 컨트롤러
 * ============================================
 * 
 * Google OAuth 소셜 로그인을 처리합니다.
 * 
 * 흐름:
 * 1. 프론트엔드에서 Google Identity Services로 ID 토큰 획득
 * 2. POST /api/auth/google 으로 ID 토큰 전송
 * 3. google-auth-library로 토큰 검증
 * 4. User 찾기 or 새로 생성 (upsert)
 * 5. JWT 발급하여 반환
 */

const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Cat = require('../models/Cat');
const ScanLog = require('../models/ScanLog');
const { JWT_SECRET } = require('../middleware/auth');

// Google OAuth 클라이언트 (토큰 검증용)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

/**
 * JWT 토큰 생성 헬퍼
 * @param {string} userId - MongoDB User _id
 * @returns {string} 서명된 JWT (7일 유효)
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

/**
 * POST /api/auth/google
 * Google ID 토큰으로 로그인/회원가입
 * 
 * @param {string} req.body.idToken - Google Identity Services에서 받은 credential
 * @returns {Object} { success, token, user }
 */
const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google ID 토큰이 필요합니다.'
      });
    }

    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        message: 'GOOGLE_CLIENT_ID가 서버에 설정되지 않았습니다.'
      });
    }

    // Google 토큰 검증
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const { sub: googleId, email, name, picture } = payload;
    console.log(`🔑 Google 로그인 시도 - ${email} (${name})`);

    // 기존 사용자 찾기 or 새로 생성
    let user = await User.findOne({ googleId });

    if (!user) {
      // 같은 이메일로 가입된 계정이 있는지 확인
      user = await User.findOne({ email });
      if (user) {
        // 기존 이메일 계정에 Google ID 연결
        user.googleId = googleId;
        user.displayName = user.displayName || name;
        user.profileImage = user.profileImage || picture;
        await user.save();
        console.log(`🔗 기존 계정에 Google 연결: ${email}`);
      } else {
        // 완전 새로운 사용자 생성
        user = await User.create({
          email,
          googleId,
          displayName: name || email.split('@')[0],
          profileImage: picture || '',
        });
        console.log(`✨ 새 사용자 생성: ${email}`);

        // 기본 고양이 프로필 생성 (첫 가입 시)
        await Cat.create({
          userId: user._id,
          name: '우리 고양이',
          birthDate: null,
          weight: null,
          preExistingConditions: [],
        });
        console.log(`🐱 기본 고양이 프로필 생성 완료`);
      }
    }

    // JWT 발급
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
        profileImage: user.profileImage,
      }
    });

  } catch (error) {
    console.error('Google 로그인 에러:', error);

    if (error.message?.includes('Token used too late') || error.message?.includes('Invalid token')) {
      return res.status(401).json({
        success: false,
        message: 'Google 토큰이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.'
      });
    }

    res.status(500).json({
      success: false,
      message: '로그인 처리 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

/**
 * GET /api/auth/me
 * 현재 로그인한 사용자 정보 조회
 * (JWT 토큰으로 인증된 요청)
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash').lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      }
    });
  } catch (error) {
    console.error('사용자 정보 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '사용자 정보를 불러올 수 없습니다.'
    });
  }
};

/**
 * DELETE /api/auth/account
 * 계정 삭제 (탈퇴)
 * 관련된 고양이 프로필, 타임라인 기록도 함께 삭제
 */
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // 관련 데이터 일괄 삭제
    const cats = await Cat.find({ userId }).lean();
    const catIds = cats.map(c => c._id);

    await ScanLog.deleteMany({ $or: [{ userId }, { catId: { $in: catIds } }] });
    await Cat.deleteMany({ userId });
    await User.findByIdAndDelete(userId);

    console.log(`🗑️ 계정 삭제 완료: ${req.user.email} (고양이 ${catIds.length}마리, 기록 삭제)`);

    res.json({
      success: true,
      message: '계정이 삭제되었습니다. 모든 데이터가 제거되었습니다.'
    });
  } catch (error) {
    console.error('계정 삭제 에러:', error);
    res.status(500).json({
      success: false,
      message: '계정 삭제 중 오류가 발생했습니다.'
    });
  }
};

module.exports = { googleLogin, getMe, deleteAccount };
