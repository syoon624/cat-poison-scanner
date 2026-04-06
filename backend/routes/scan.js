/**
 * ============================================
 * Scan Router - 이미지 스캔 API 라우트
 * ============================================
 * 
 * POST /api/scan/image
 * - 이미지 파일을 업로드하여 독성 분석 수행
 * - Multer 미들웨어로 파일 처리 후 컨트롤러에 전달
 * - scanType: 'object' (사물/식물) 또는 'ocr' (성분표)
 */

const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { scanImage } = require('../controllers/scanController');

/**
 * POST /api/scan/image
 * 
 * Form-Data:
 * - image: File (이미지 파일, 최대 10MB)
 * - scanType: String ('object' | 'ocr')
 * 
 * upload.single('image'): 'image' 필드명으로 단일 파일 업로드 처리
 */
router.post('/image', upload.single('image'), scanImage);

module.exports = router;
