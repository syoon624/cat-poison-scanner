/**
 * ============================================
 * Multer 파일 업로드 미들웨어
 * ============================================
 * 메모리 스토리지를 사용하여 디스크에 파일을 저장하지 않습니다.
 * req.file.buffer에 이미지 바이너리가 담깁니다.
 * 
 * 설정:
 * - 저장: 메모리 (Buffer)
 * - 허용 형식: jpeg, jpg, png, gif, webp
 * - 최대 크기: 10MB
 */

const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`지원하지 않는 파일 형식입니다: ${file.mimetype}. (jpeg, png, gif, webp만 허용)`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

module.exports = upload;
