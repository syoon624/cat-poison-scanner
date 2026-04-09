/**
 * ============================================
 * Auth Controller - 인증 컨트롤러
 * ============================================
 * 
 * 두 가지 인증 방식을 지원합니다:
 * 
 * 1. 이메일/비밀번호 회원가입·로그인
 *    - POST /api/auth/register (회원가입)
 *    - POST /api/auth/login    (로그인)
 * 
 * 2. Google OAuth 소셜 로그인
 *    - POST /api/auth/google   (Google ID 토큰 → JWT)
 * 
 * 공통: JWT 발급 → 프론트엔드에서 localStorage에 저장
 */

const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Cat = require('../models/Cat');
const ScanLog = require('../models/ScanLog');
const { JWT_SECRET } = require('../middleware/auth');

// bcrypt 해싱 비용 (높을수록 느리지만 안전)
const SALT_ROUNDS = 10;

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
 * POST /api/auth/register
 * 이메일/비밀번호 회원가입
 * 
 * @param {string} req.body.email - 이메일 주소
 * @param {string} req.body.password - 비밀번호 (최소 6자)
 * @param {string} [req.body.displayName] - 표시 이름 (선택)
 * @returns {Object} { success, token, user }
 */
const register = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    // 입력값 검증
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호는 필수입니다.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '비밀번호는 최소 6자 이상이어야 합니다.'
      });
    }

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: '이미 가입된 이메일입니다. 로그인해주세요.'
      });
    }

    // 비밀번호 해싱
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // 사용자 생성
    const user = await User.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      displayName: (displayName || email.split('@')[0]).trim(),
    });

    console.log(`✨ 이메일 회원가입: ${user.email}`);

    // 기본 고양이 프로필 생성
    await Cat.create({
      userId: user._id,
      name: '우리 고양이',
      birthDate: null,
      weight: null,
      preExistingConditions: [],
    });
    console.log(`🐱 기본 고양이 프로필 생성 완료`);

    // JWT 발급
    const token = generateToken(user._id);

    res.status(201).json({
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
    console.error('회원가입 에러:', error);

    // Mongoose 유효성 검증 에러 처리
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(' ')
      });
    }

    res.status(500).json({
      success: false,
      message: '회원가입 처리 중 오류가 발생했습니다.'
    });
  }
};

/**
 * POST /api/auth/login
 * 이메일/비밀번호 로그인
 * 
 * @param {string} req.body.email - 이메일 주소
 * @param {string} req.body.password - 비밀번호
 * @returns {Object} { success, token, user }
 */
const emailLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 입력해주세요.'
      });
    }

    // 사용자 조회
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // 소셜 로그인 전용 계정인 경우 (비밀번호 없음)
    if (!user.passwordHash) {
      return res.status(401).json({
        success: false,
        message: '이 계정은 Google 로그인으로 가입되었습니다. Google로 로그인해주세요.'
      });
    }

    // 비밀번호 검증
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    console.log(`🔑 이메일 로그인: ${user.email}`);

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
    console.error('로그인 에러:', error);
    res.status(500).json({
      success: false,
      message: '로그인 처리 중 오류가 발생했습니다.'
    });
  }
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

module.exports = { register, emailLogin, googleLogin, getMe, deleteAccount };
