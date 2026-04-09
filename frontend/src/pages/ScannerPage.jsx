/**
 * ============================================
 * ScannerPage - 복합 스캐너 페이지 (PWA 웹 버전)
 * ============================================
 * 
 * 웹 카메라 또는 파일 선택으로 이미지를 캡처하고,
 * 서버에 전송하여 독성 분석 결과를 표시합니다.
 * 
 * React Native의 expo-camera 대신 Web Camera API
 * (navigator.mediaDevices.getUserMedia)를 사용합니다.
 */

import { useState, useRef, useCallback } from 'react';
import { scanImage } from '../services/api';
import useStore from '../store/useStore';
import ScanResultCard from '../components/ScanResultCard';
import './ScannerPage.css';

export default function ScannerPage() {
  // ─── 로컬 상태 ───
  const [scanType, setScanType] = useState('object');
  const [capturedImage, setCapturedImage] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // ─── Zustand 전역 상태 ───
  const { scanResult, setScanResult, isScanning, setIsScanning, clearScanResult } = useStore();

  /**
   * 웹 카메라 시작
   * navigator.mediaDevices.getUserMedia로 후면 카메라 요청
   */
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error('카메라 접근 실패:', err);
      alert('카메라 접근 권한이 필요합니다. 브라우저 설정을 확인해주세요.');
    }
  }, []);

  /**
   * 카메라 정지
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  /**
   * 카메라에서 캡처하여 분석
   * canvas에 현재 프레임을 그리고 Blob으로 변환
   */
  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setCapturedImage(url);
      stopCamera();
      await analyzeImage(new File([blob], 'capture.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.8);
  }, [stopCamera]);

  /**
   * 파일 선택(갤러리)으로 이미지 분석
   */
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setCapturedImage(url);
    stopCamera();
    analyzeImage(file);
  };

  /**
   * 서버에 이미지 분석 요청
   * 서버 연결 실패 시 Mock 결과 사용
   */
  const analyzeImage = async (imageFile) => {
    setIsScanning(true);
    clearScanResult();
    try {
      const result = await scanImage(imageFile, scanType);
      setScanResult(result);
      setShowResult(true);
    } catch (error) {
      console.log('서버 연결 실패, Mock 결과 사용:', error.message);
      const mockResult = scanType === 'object'
        ? {
            success: true, scanType: 'object',
            result: {
              identifiedItem: '백합 (Lily)', riskLevel: 'TOXIC', confidence: 0.92,
              details: '백합은 고양이에게 매우 위험한 식물입니다. 소량 섭취만으로도 급성 신부전을 유발할 수 있습니다.',
              symptoms: ['구토', '식욕 부진', '무기력', '신부전'], category: 'PLANT',
            },
            disclaimer: '⚠️ 본 결과는 참고용이며, 최종 판단 및 응급 상황은 수의사와 상담하십시오.',
          }
        : {
            success: true, scanType: 'ocr',
            result: {
              extractedText: '닭고기, 현미, 연어유, 타우린, 양파 가루', overallRiskLevel: 'TOXIC',
              safeIngredients: ['닭고기', '현미', '연어유', '타우린'],
              detectedHazards: [{
                ingredient: '양파 가루', riskLevel: 'TOXIC',
                details: '양파는 고양이의 적혈구를 파괴합니다.', symptoms: ['빈혈', '무기력'],
              }],
            },
            disclaimer: '⚠️ 본 결과는 참고용이며, 최종 판단 및 응급 상황은 수의사와 상담하십시오.',
          };
      setScanResult(mockResult);
      setShowResult(true);
    } finally {
      setIsScanning(false);
    }
  };

  /** 결과 모달 닫기 */
  const closeResult = () => {
    setShowResult(false);
    setCapturedImage(null);
    clearScanResult();
  };

  return (
    <div className="scanner-page">
      {/* 카메라/이미지 프리뷰 영역 */}
      <div className="camera-area">
        {cameraActive ? (
          <video ref={videoRef} autoPlay playsInline className="camera-video" />
        ) : capturedImage ? (
          <img src={capturedImage} alt="캡처된 이미지" className="captured-image" />
        ) : (
          <div className="camera-placeholder">
            <span className="placeholder-icon">📷</span>
            <p>카메라를 시작하거나 갤러리에서 선택하세요</p>
          </div>
        )}

        {/* 스캔 가이드 프레임 */}
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
      </div>

      {/* 하단 컨트롤 */}
      <div className="controls">
        {/* 스캔 모드 토글 */}
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

        {/* 버튼 행 */}
        <div className="button-row">
          <label className="side-btn">
            <span>🖼️</span>
            <span className="side-label">갤러리</span>
            <input type="file" accept="image/*" onChange={handleFileSelect} hidden />
          </label>

          {cameraActive ? (
            <button className="capture-btn" onClick={captureAndAnalyze} disabled={isScanning}>
              {isScanning ? <div className="spinner" /> : <div className="capture-inner" />}
            </button>
          ) : (
            <button className="capture-btn" onClick={startCamera} disabled={isScanning}>
              {isScanning ? <div className="spinner" /> : <span className="camera-icon">📷</span>}
            </button>
          )}

          <div className="side-btn">
            <span>🐱</span>
            <span className="side-label">나비</span>
          </div>
        </div>

        <p className="disclaimer">
          ⚠️ 본 결과는 참고용이며, 최종 판단 및 응급 상황은 수의사와 상담하십시오.
        </p>
      </div>

      {/* 결과 모달 */}
      {showResult && scanResult && (
        <div className="modal-overlay" onClick={closeResult}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {capturedImage && <img src={capturedImage} alt="분석 이미지" className="preview-image" />}
            <ScanResultCard result={scanResult} />
            <button className="close-btn" onClick={closeResult}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}
