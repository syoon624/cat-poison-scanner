/**
 * ============================================
 * Timeline Controller - 타임라인 기록 컨트롤러
 * ============================================
 * 
 * 인증된 사용자의 반려묘 건강 타임라인을 관리합니다.
 * 스캔 결과, 증상 기록, 병원 방문 등의 이벤트를
 * 시간순으로 조회·추가·수정·삭제할 수 있습니다.
 * 
 * 모든 엔드포인트는 authMiddleware를 통해
 * req.user가 설정된 상태에서 호출됩니다.
 */

const ScanLog = require('../models/ScanLog');

/**
 * GET /api/timeline/:catId
 * 특정 고양이의 타임라인 기록을 시간순으로 조회
 * 인증된 사용자의 고양이만 조회 가능 (userId 매칭)
 */
const getTimeline = async (req, res) => {
  try {
    const { catId } = req.params;
    const { startDate, endDate, type } = req.query;

    if (!catId) {
      return res.status(400).json({
        success: false,
        message: '고양이 ID가 필요합니다.'
      });
    }

    console.log(`📅 타임라인 조회 - userId: ${req.user._id}, catId: ${catId}`);

    // 쿼리 필터: 인증된 사용자 + 해당 고양이
    const filter = { userId: req.user._id, catId };

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    if (type) {
      filter.type = type.toUpperCase();
    }

    const logs = await ScanLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      catId,
      count: logs.length,
      timeline: logs
    });
  } catch (error) {
    console.error('타임라인 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '타임라인 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

/**
 * POST /api/timeline
 * 타임라인에 새 기록 추가
 * userId는 JWT에서 자동 추출 (req.user._id)
 */
const addTimelineEntry = async (req, res) => {
  try {
    const { catId, type, content, riskLevel, imageUrl, palatabilityRating, scanData, memo } = req.body;

    if (!catId || !type || !content) {
      return res.status(400).json({
        success: false,
        message: 'catId, type, content는 필수 입력값입니다.'
      });
    }

    const validTypes = ['PLANT', 'INGREDIENT', 'CHAT', 'SYMPTOM', 'HOSPITAL'];
    if (!validTypes.includes(type.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `유효하지 않은 type입니다. 허용값: ${validTypes.join(', ')}`
      });
    }

    console.log(`📝 타임라인 기록 추가 - userId: ${req.user._id}, type: ${type}`);

    const newLog = await ScanLog.create({
      userId: req.user._id,
      catId,
      type: type.toUpperCase(),
      content,
      riskLevel: riskLevel || 'NONE',
      imageUrl: imageUrl || null,
      scanData: scanData || null,
      memo: memo || '',
      palatabilityRating: palatabilityRating || null,
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: '타임라인 기록이 추가되었습니다.',
      entry: newLog
    });
  } catch (error) {
    console.error('타임라인 추가 에러:', error);
    res.status(500).json({
      success: false,
      message: '타임라인 기록 추가 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

/**
 * PUT /api/timeline/:id
 * 타임라인 기록 수정 (소유자 검증)
 */
const updateTimelineEntry = async (req, res) => {
  try {
    const log = await ScanLog.findOne({ _id: req.params.id, userId: req.user._id });
    if (!log) {
      return res.status(404).json({
        success: false,
        message: '기록을 찾을 수 없습니다.'
      });
    }

    const { content, riskLevel, type, memo } = req.body;
    if (content !== undefined) log.content = content;
    if (riskLevel !== undefined) log.riskLevel = riskLevel;
    if (type !== undefined) log.type = type.toUpperCase();
    if (memo !== undefined) log.memo = memo;

    await log.save();

    console.log(`✏️ 타임라인 기록 수정: ${log._id}`);
    res.json({ success: true, entry: log });
  } catch (error) {
    console.error('타임라인 수정 에러:', error);
    res.status(500).json({
      success: false,
      message: '기록 수정 중 오류가 발생했습니다.'
    });
  }
};

/**
 * DELETE /api/timeline/:id
 * 타임라인 기록 삭제 (소유자 검증)
 */
const deleteTimelineEntry = async (req, res) => {
  try {
    const log = await ScanLog.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!log) {
      return res.status(404).json({
        success: false,
        message: '기록을 찾을 수 없습니다.'
      });
    }

    console.log(`🗑️ 타임라인 기록 삭제: ${log._id}`);
    res.json({ success: true, message: '기록이 삭제되었습니다.' });
  } catch (error) {
    console.error('타임라인 삭제 에러:', error);
    res.status(500).json({
      success: false,
      message: '기록 삭제 중 오류가 발생했습니다.'
    });
  }
};

module.exports = { getTimeline, addTimelineEntry, updateTimelineEntry, deleteTimelineEntry };
