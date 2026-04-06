/**
 * ============================================
 * Timeline Controller - 타임라인 기록 컨트롤러
 * ============================================
 * 
 * 반려묘의 건강 타임라인을 관리합니다.
 * 스캔 결과, 증상 기록, 병원 방문 등의 이벤트를
 * 시간순으로 조회하고 추가할 수 있습니다.
 * 
 * 타임라인 연동 흐름:
 * - 자동 연동: 스캐너/챗봇에서 위험 감지 시 사용자 승인 후 자동 추가
 * - 수동 추가: 증상 기록, 병원 방문 등 직접 입력
 */

const ScanLog = require('../models/ScanLog');

/**
 * GET /api/timeline/:catId
 * 특정 고양이의 타임라인 기록을 시간순으로 조회
 * 
 * @param {string} req.params.catId - 조회할 고양이의 ObjectId
 * @param {string} req.query.startDate - 조회 시작일 (선택, ISO 8601)
 * @param {string} req.query.endDate - 조회 종료일 (선택, ISO 8601)
 * @param {string} req.query.type - 필터링할 이벤트 유형 (선택)
 * 
 * @returns {Object} 타임라인 기록 목록
 */
const getTimeline = async (req, res) => {
  try {
    const { catId } = req.params;
    const { startDate, endDate, type } = req.query;

    // catId 유효성 기본 검사
    if (!catId) {
      return res.status(400).json({
        success: false,
        message: '고양이 ID가 필요합니다.'
      });
    }

    console.log(`📅 타임라인 조회 - catId: ${catId}`);

    // ============================================
    // DB 조회 시도, 실패 시 Mock 데이터 반환
    // ============================================

    let logs;

    try {
      // 쿼리 필터 구성
      const filter = { catId };

      // 날짜 범위 필터 (선택사항)
      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate);
        if (endDate) filter.timestamp.$lte = new Date(endDate);
      }

      // 이벤트 유형 필터 (선택사항)
      if (type) {
        filter.type = type.toUpperCase();
      }

      // 시간 역순으로 정렬하여 최신 기록부터 조회
      logs = await ScanLog.find(filter)
        .sort({ timestamp: -1 })
        .limit(50)
        .lean();
    } catch (dbError) {
      console.log('DB 조회 실패, Mock 데이터 반환:', dbError.message);
      logs = null;
    }

    // DB에 데이터가 없거나 조회 실패 시 Mock 데이터 반환
    if (!logs || logs.length === 0) {
      logs = getMockTimelineData(catId);
    }

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
 * 
 * 스캐너/챗봇의 자동 연동 또는 사용자의 수동 입력으로 호출됩니다.
 * 
 * @param {string} req.body.userId - 사용자 ID
 * @param {string} req.body.catId - 고양이 ID
 * @param {string} req.body.type - 이벤트 유형 ('PLANT'|'INGREDIENT'|'CHAT'|'SYMPTOM'|'HOSPITAL')
 * @param {string} req.body.content - 이벤트 내용
 * @param {string} req.body.riskLevel - 위험도 ('SAFE'|'WARNING'|'TOXIC'|'NONE')
 * @param {string} [req.body.imageUrl] - 이미지 URL (선택)
 * @param {number} [req.body.palatabilityRating] - 기호성 별점 1~5 (선택)
 */
const addTimelineEntry = async (req, res) => {
  try {
    const { userId, catId, type, content, riskLevel, imageUrl, palatabilityRating } = req.body;

    // 필수 필드 검증
    if (!catId || !type || !content) {
      return res.status(400).json({
        success: false,
        message: 'catId, type, content는 필수 입력값입니다.'
      });
    }

    // type 유효성 검증
    const validTypes = ['PLANT', 'INGREDIENT', 'CHAT', 'SYMPTOM', 'HOSPITAL'];
    if (!validTypes.includes(type.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `유효하지 않은 type입니다. 허용값: ${validTypes.join(', ')}`
      });
    }

    console.log(`📝 타임라인 기록 추가 - type: ${type}, content: ${content}`);

    // ============================================
    // DB 저장 시도, 실패 시 Mock 응답 반환
    // ============================================

    let newLog;

    try {
      newLog = await ScanLog.create({
        userId: userId || '000000000000000000000000',
        catId,
        type: type.toUpperCase(),
        content,
        riskLevel: riskLevel || 'NONE',
        imageUrl: imageUrl || null,
        palatabilityRating: palatabilityRating || null,
        timestamp: new Date()
      });
    } catch (dbError) {
      console.log('DB 저장 실패, Mock 응답 반환:', dbError.message);
      // Mock 응답 생성
      newLog = {
        _id: 'mock_' + Date.now(),
        userId: userId || '000000000000000000000000',
        catId,
        type: type.toUpperCase(),
        content,
        riskLevel: riskLevel || 'NONE',
        imageUrl: imageUrl || null,
        palatabilityRating: palatabilityRating || null,
        timestamp: new Date()
      };
    }

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
 * Mock 타임라인 데이터 생성
 * DB가 비어있거나 연결 실패 시 프론트엔드 테스트용 데이터 제공
 * 
 * 실제 사용 시나리오를 반영한 샘플 타임라인:
 * 백합 스캔(위험) → 구토 증상 기록 → 병원 방문 → 사료 급여
 * 
 * @param {string} catId - 고양이 ID
 * @returns {Array} Mock 타임라인 기록 배열
 */
const getMockTimelineData = (catId) => {
  const now = new Date();

  return [
    {
      _id: 'mock_1',
      catId,
      type: 'PLANT',
      content: '백합 (Lily) - 거실에서 발견',
      riskLevel: 'TOXIC',
      imageUrl: null,
      timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000) // 6시간 전
    },
    {
      _id: 'mock_2',
      catId,
      type: 'SYMPTOM',
      content: '구토 증상 발견 - 2회',
      riskLevel: 'NONE',
      imageUrl: null,
      timestamp: new Date(now.getTime() - 4.5 * 60 * 60 * 1000) // 4.5시간 전
    },
    {
      _id: 'mock_3',
      catId,
      type: 'HOSPITAL',
      content: '동물병원 방문 - 수액 처치 완료',
      riskLevel: 'NONE',
      imageUrl: null,
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000) // 3시간 전
    },
    {
      _id: 'mock_4',
      catId,
      type: 'INGREDIENT',
      content: '오리젠 캣&키튼 사료 성분 스캔 - 안전',
      riskLevel: 'SAFE',
      imageUrl: null,
      palatabilityRating: 4,
      timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000) // 1시간 전
    },
    {
      _id: 'mock_5',
      catId,
      type: 'CHAT',
      content: '"참치캔 급여해도 될까요?" 질의',
      riskLevel: 'WARNING',
      imageUrl: null,
      timestamp: new Date(now.getTime() - 0.5 * 60 * 60 * 1000) // 30분 전
    }
  ];
};

module.exports = { getTimeline, addTimelineEntry };
