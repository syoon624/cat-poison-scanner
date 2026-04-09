/**
 * ============================================
 * ScannerPage - 복합 스캐너 페이지 (PWA 웹 버전)
 * ============================================
 * 
 * 플로우:
 * 1. 페이지 진입 → "카메라 시작" 영역 표시
 * 2. 탭하면 카메라 켜짐 → 실시간 프리뷰 전체 화면
 * 3. 캡처 버튼 누르면 스냅샷 (갤러리 저장 없음, canvas → blob)
 * 4. 스냅샷 이미지를 서버에 전송 → 분석 결과 모달
 * 5. 모달 닫으면 다시 카메라 프리뷰로 복귀
 *
 * ⚠️ video 요소는 항상 DOM에 존재해야 합니다 (조건부 렌더링 X).
 *    React의 조건부 렌더링 + ref 타이밍 문제로,
 *    video가 DOM에 없을 때 srcObject를 설정하면 카메라가 표시되지 않습니다.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { scanImage, addTimelineEntry } from '../services/api';
import useStore from '../store/useStore';
import ScanResultCard from '../components/ScanResultCard';
import './ScannerPage.css';

export default function ScannerPage() {
  const [scanType, setScanType] = useState('object');
  const [capturedImage, setCapturedImage] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [savedToTimeline, setSavedToTimeline] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const { scanResult, setScanResult, isScanning, setIsScanning, clearScanResult, selectedCat, addTimelineEntry: addToStore } = useStore();

  // 페이지 떠날 때 카메라 정리
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  /**
   * cameraActive가 true로 바뀌면, video 요소에 스트림을 연결
   * video는 항상 DOM에 있으므로 ref가 null일 일이 없음
   */
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.onloadedmetadata = () => setCameraReady(true);
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive]);

  /** 카메라 시작 */
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;
      setCapturedImage(null);
      setCameraActive(true);
    } catch (err) {
      console.error('카메라 접근 실패:', err);
      alert('카메라 접근 권한이 필요합니다.\n브라우저 설정에서 카메라를 허용해주세요.');
    }
  }, []);

  /** 카메라 정지 */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraReady(false);
  }, []);

  /**
   * 스냅샷 캡처 → 분석
   * canvas로 현재 프레임을 캡처하여 Blob으로 변환 (갤러리 저장 없음)
   */
  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !cameraReady) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    stopCamera();

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setCapturedImage(url);
      await analyzeImage(new File([blob], 'capture.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.8);
  }, [cameraReady, stopCamera]);

  /** 갤러리 파일 선택 → 분석 */
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopCamera();
    const url = URL.createObjectURL(file);
    setCapturedImage(url);
    analyzeImage(file);
  };

  /** 서버에 이미지 분석 요청 */
  const analyzeImage = async (imageFile) => {
    setIsScanning(true);
    clearScanResult();
    try {
      const result = await scanImage(imageFile, scanType);
      setScanResult(result);
      setShowResult(true);
    } catch (error) {
      console.error('서버 연결 실패:', error.message);
      const errorResult = {
        success: false,
        scanType,
        result: {
          identifiedItem: '인식할 수 없음',
          riskLevel: 'UNKNOWN',
          confidence: 0,
          details: '서버에 연결할 수 없습니다. 네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요.',
          symptoms: [],
          category: 'UNKNOWN',
        },
        disclaimer: '⚠️ 본 결과는 참고용이며, 최종 판단 및 응급 상황은 수의사와 상담하십시오.',
      };
      setScanResult(errorResult);
      setShowResult(true);
    } finally {
      setIsScanning(false);
    }
  };

  /** 스캔 결과를 타임라인에 저장 */
  const saveToTimeline = async () => {
    if (!selectedCat?._id || !scanResult?.result) return;

    const data = scanResult.result;
    const isOCR = scanResult.scanType === 'ocr';
    const type = isOCR ? 'INGREDIENT' : 'PLANT';
    const content = isOCR
      ? `성분표 스캔 - ${data.overallRiskLevel === 'TOXIC' ? '위험 성분 검출' : data.overallRiskLevel === 'WARNING' ? '주의 성분 검출' : '안전'}`
      : `${data.identifiedItem || '인식할 수 없음'} 스캔`;
    const riskLevel = isOCR ? (data.overallRiskLevel || 'NONE') : (data.riskLevel || 'NONE');

    try {
      const result = await addTimelineEntry({
        catId: selectedCat._id,
        type,
        content,
        riskLevel,
        imageUrl: scanResult.imageUrl || null,
      });
      if (result.success) {
        addToStore(result.entry);
        setSavedToTimeline(true);
      }
    } catch (err) {
      console.error('타임라인 저장 실패:', err);
      alert('타임라인 저장에 실패했습니다.');
    }
  };

  /** 결과 닫기 → 카메라 다시 시작 */
  const closeResult = () => {
    setShowResult(false);
    setCapturedImage(null);
    clearScanResult();
    setSavedToTimeline(false);
    startCamera();
  };

  return (
    <div className="scanner-page">
      {/* ─── 카메라/이미지 프리뷰 영역 ─── */}
      <div className="camera-area">
        {/*
          video 요소는 항상 DOM에 존재.
          cameraActive가 false일 때는 CSS로 숨김 처리.
          이렇게 해야 ref 타이밍 문제 없이 srcObject 설정 가능.
        */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="camera-video"
          style={{ display: cameraActive ? 'block' : 'none' }}
        />

        {/* 카메라 활성: 스캔 가이드 오버레이 */}
        {cameraActive && (
          <div className="scan-overlay">
            <div className="scan-frame">
              <div className="corner top-left" />
              <div className="corner top-right" />
              <div className="corner bottom-left" />
              <div className="corner bottom-right" />
            </div>
            <p className="guide-text">
              {scanType === 'object'
                ? '🌿 식물/사물을 프레임 안에 맞춰주세요'
                : '📋 성분표를 프레임 안에 맞춰주세요'}
            </p>
          </div>
        )}

        {/* 캡처된 이미지 (분석 중일 때 표시) */}
        {!cameraActive && capturedImage && (
          <img src={capturedImage} alt="캡처 이미지" className="captured-image" />
        )}

        {/* 초기 상태: 카메라 시작 유도 */}
        {!cameraActive && !capturedImage && (
          <div className="camera-placeholder" onClick={startCamera}>
            <span className="placeholder-icon">📷</span>
            <p className="placeholder-title">탭하여 카메라 시작</p>
            <p className="placeholder-desc">식물, 사물, 성분표를 스캔하세요</p>
          </div>
        )}

        {/* 분석 중 오버레이 */}
        {isScanning && (
          <div className="scanning-overlay">
            <div className="scanning-spinner" />
            <p>분석 중...</p>
          </div>
        )}
      </div>

      {/* ─── 하단 컨트롤 ─── */}
      <div className="controls">
        <div className="mode-selector">
          <button
            className={`mode-btn ${scanType === 'object' ? 'active' : ''}`}
            onClick={() => setScanType('object')}
          >🌿 사물/식물</button>
          <button
            className={`mode-btn ${scanType === 'ocr' ? 'active' : ''}`}
            onClick={() => setScanType('ocr')}
          >📋 성분표</button>
        </div>

        <div className="button-row">
          <label className="side-btn">
            <span>🖼️</span>
            <span className="side-label">갤러리</span>
            <input type="file" accept="image/*" onChange={handleFileSelect} hidden />
          </label>

          {cameraActive ? (
            <button
              className="capture-btn capturing"
              onClick={captureAndAnalyze}
              disabled={isScanning || !cameraReady}
            >
              {isScanning ? <div className="spinner" /> : <div className="capture-inner" />}
            </button>
          ) : (
            <button className="capture-btn" onClick={startCamera} disabled={isScanning}>
              {isScanning ? <div className="spinner" /> : <span className="camera-icon">📷</span>}
            </button>
          )}

          <div className="side-btn">
            <span>🐱</span>
            <span className="side-label">{selectedCat?.name || '고양이'}</span>
          </div>
        </div>

        <p className="disclaimer">
          ⚠️ 본 결과는 참고용이며, 최종 판단 및 응급 상황은 수의사와 상담하십시오.
        </p>
      </div>

      {/* ─── 결과 모달 ─── */}
      {showResult && scanResult && (
        <div className="modal-overlay" onClick={closeResult}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {capturedImage && <img src={capturedImage} alt="분석 이미지" className="preview-image" />}
            <ScanResultCard result={scanResult} />
            <div className="result-actions">
              {scanResult.result?.riskLevel !== 'UNKNOWN' && selectedCat && (
                <button
                  className={`save-timeline-btn ${savedToTimeline ? 'saved' : ''}`}
                  onClick={saveToTimeline}
                  disabled={savedToTimeline}
                >
                  {savedToTimeline ? '✅ 저장됨' : '📅 타임라인에 저장'}
                </button>
              )}
              <button className="close-btn" onClick={closeResult}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
