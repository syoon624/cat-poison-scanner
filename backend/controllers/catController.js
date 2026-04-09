/**
 * ============================================
 * Cat Controller - 고양이 프로필 CRUD 컨트롤러
 * ============================================
 * 
 * 인증된 사용자의 고양이 프로필을 관리합니다.
 * 모든 엔드포인트는 authMiddleware를 통해 보호됩니다.
 */

const Cat = require('../models/Cat');

/**
 * GET /api/cats
 * 로그인한 사용자의 고양이 목록 조회
 */
const getCats = async (req, res) => {
  try {
    const cats = await Cat.find({ userId: req.user._id })
      .sort({ createdAt: 1 })
      .lean();

    res.json({ success: true, cats });
  } catch (error) {
    console.error('고양이 목록 조회 에러:', error);
    res.status(500).json({ success: false, message: '고양이 목록을 불러올 수 없습니다.' });
  }
};

/**
 * POST /api/cats
 * 새 고양이 프로필 생성
 */
const createCat = async (req, res) => {
  try {
    const { name, birthDate, weight, preExistingConditions } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: '고양이 이름은 필수입니다.' });
    }

    const cat = await Cat.create({
      userId: req.user._id,
      name: name.trim(),
      birthDate: birthDate || null,
      weight: weight || null,
      preExistingConditions: preExistingConditions || [],
    });

    console.log(`🐱 고양이 프로필 생성: ${cat.name} (${req.user.email})`);
    res.status(201).json({ success: true, cat });
  } catch (error) {
    console.error('고양이 생성 에러:', error);
    res.status(500).json({ success: false, message: '고양이 프로필 생성에 실패했습니다.' });
  }
};

/**
 * PUT /api/cats/:id
 * 고양이 프로필 수정 (소유자 검증)
 */
const updateCat = async (req, res) => {
  try {
    const cat = await Cat.findOne({ _id: req.params.id, userId: req.user._id });
    if (!cat) {
      return res.status(404).json({ success: false, message: '고양이를 찾을 수 없습니다.' });
    }

    const { name, birthDate, weight, preExistingConditions } = req.body;
    if (name !== undefined) cat.name = name.trim();
    if (birthDate !== undefined) cat.birthDate = birthDate;
    if (weight !== undefined) cat.weight = weight;
    if (preExistingConditions !== undefined) cat.preExistingConditions = preExistingConditions;

    await cat.save();
    console.log(`🐱 고양이 프로필 수정: ${cat.name}`);
    res.json({ success: true, cat });
  } catch (error) {
    console.error('고양이 수정 에러:', error);
    res.status(500).json({ success: false, message: '고양이 프로필 수정에 실패했습니다.' });
  }
};

/**
 * DELETE /api/cats/:id
 * 고양이 프로필 삭제 (소유자 검증)
 */
const deleteCat = async (req, res) => {
  try {
    const cat = await Cat.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!cat) {
      return res.status(404).json({ success: false, message: '고양이를 찾을 수 없습니다.' });
    }

    console.log(`🗑️ 고양이 프로필 삭제: ${cat.name}`);
    res.json({ success: true, message: `${cat.name} 프로필이 삭제되었습니다.` });
  } catch (error) {
    console.error('고양이 삭제 에러:', error);
    res.status(500).json({ success: false, message: '고양이 프로필 삭제에 실패했습니다.' });
  }
};

module.exports = { getCats, createCat, updateCat, deleteCat };
