/**
 * ============================================
 * Multer 파일 업로드 미들웨어
 * ============================================
 * 이미지 파일 업로드를 처리합니다.
 * 
 * 설정:
 * - 저장 위치: uploads/ 디렉토리
 * - 파일명: 타임스탬프 + 원본 파일명
 * - 허용 형식: jpeg, jpg, png, gif, webp
 * - 최대 크기: 10MB
 */

const multer = require('multer');
const path = require('path');

/**
 * 디스크 스토리지 설정
 * - destination: 업로드 파일이 저장될 디렉토리
 * - filename: 충돌 방지를 위해 타임스탬프를 접두사로 추가
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // 예: 1700000000000-photo.jpg
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

/**
 * 파일 필터 - 이미지 파일만 허용
 * 이미지가 아닌 파일이 업로드되면 에러를 반환합니다.
 */
const fileFilter = (req, file, cb) => {
  // 허용되는 MIME 타입 목록
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`지원하지 않는 파일 형식입니다: ${file.mimetype}. (jpeg, png, gif, webp만 허용)`), false);
  }
};

/**
 * Multer 인스턴스 생성
 * - storage: 디스크 저장소 설정
 * - fileFilter: 이미지만 허용
 * - limits.fileSize: 최대 10MB
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

module.exports = upload;
