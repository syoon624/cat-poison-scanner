# 🐱 PurrfectScan - 반려묘 안전/건강 복합 관리 앱

식물, 사물, 사료/간식 성분표를 스캔하여 반려묘에게 유해한 성분을 판별하고, 해당 스캔 기록과 건강 이상 증상을 타임라인 캘린더 형태로 관리하는 올인원 iOS 모바일 앱입니다.

## 🏗️ 프로젝트 구조

```
catpoison/
├── backend/               # Node.js + Express 백엔드 서버
│   ├── config/            # DB 연결 설정
│   ├── controllers/       # API 비즈니스 로직
│   ├── data/              # 독성 DB 시드 데이터
│   ├── middleware/         # Multer 파일 업로드 등
│   ├── models/            # MongoDB Mongoose 모델
│   ├── routes/            # Express 라우트
│   └── server.js          # 서버 진입점
├── frontend/              # React Native + Expo 프론트엔드
│   ├── src/
│   │   ├── components/    # 재사용 가능한 UI 컴포넌트
│   │   ├── navigation/    # React Navigation 설정
│   │   ├── screens/       # 화면 컴포넌트
│   │   ├── services/      # API 통신 모듈
│   │   ├── store/         # Zustand 상태 관리
│   │   └── styles/        # 공통 스타일/컬러
│   └── App.js             # 앱 진입점
└── README.md
```

## 🛠️ 기술 스택

| 구분 | 기술 |
|------|------|
| **Frontend** | React Native, Expo, React Navigation, Zustand |
| **Backend** | Node.js, Express.js, Multer |
| **Database** | MongoDB (Mongoose) |
| **AI/API** | Google Cloud Vision API, OpenAI API |
| **Camera** | expo-camera, expo-image-picker |

## 🚀 시작하기

### 사전 요구사항
- Node.js v20+
- MongoDB (로컬 또는 Atlas)
- Expo CLI

### 백엔드 실행
```bash
cd backend
cp .env.example .env    # 환경 변수 설정
npm install
npm run seed            # 독성 DB 초기 데이터 삽입
npm run dev             # 개발 서버 실행 (포트 5000)
```

### 프론트엔드 실행
```bash
cd frontend
npm install
npx expo start          # Expo 개발 서버 실행
```

## 📱 핵심 기능

### 1. 복합 스캐너
- 🌿 **사물/식물 스캔**: 카메라로 식물/사물 촬영 → Vision API 분석 → 독성 DB 대조
- 📋 **성분표 OCR**: 제품 성분표 촬영 → 텍스트 추출 → 유해 성분 검출
- 🚦 **3단계 위험도 피드백**: Safe(초록) / Warning(주황) / Toxic(네온 레드)

### 2. 냥챗 (AI 챗봇)
- 💬 텍스트로 독성 물질 검색
- 🧠 자연어 분석 기반 답변 생성
- 📚 독성 DB 참조 결과 제공

### 3. 타임라인 건강 캘린더
- 📅 날짜별 그룹화된 수직 트리 타임라인 UI
- 🔗 스캔/챗봇 결과 자동 연동
- ⭐ 사료/간식 기호성(별점) 기록
- ✏️ 수동 증상/병원 방문 기록

## 📡 API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/scan/image` | 이미지 분석 (사물/성분표) |
| POST | `/api/chat/ask` | 텍스트 기반 독성 질의 |
| GET | `/api/timeline/:catId` | 타임라인 기록 조회 |
| POST | `/api/timeline` | 타임라인 기록 추가 |
| GET | `/api/health` | 서버 상태 확인 |

## ⚖️ 법적 고지

> ⚠️ 본 앱의 분석 결과는 참고용이며, 최종 판단 및 응급 상황은 반드시 수의사와 상담하십시오.

## 📄 라이선스

MIT License
