/**
 * ============================================
 * ScannerScreen - 복합 스캐너 화면
 * ============================================
 * 
 * 메인 스캔 기능을 제공하는 화면입니다.
 * 
 * 기능:
 * 1. 카메라 실시간 프리뷰 표시
 * 2. 사물/식물 스캔 모드 (object)
 * 3. 성분표 OCR 스캔 모드 (ocr)
 * 4. 스캔 결과를 Safe/Warning/Toxic 컬러로 피드백
 * 5. 갤러리에서 이미지 선택 지원
 * 
 * 카메라 권한:
 * - expo-camera로 iOS 카메라 접근 권한 요청
 * - 권한 거부 시 갤러리 선택으로 대체 안내
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, getRiskColor } from '../styles/colors';
import { scanImage } from '../services/api';
import useStore from '../store/useStore';
import ScanResultCard from '../components/ScanResultCard';

export default function ScannerScreen() {
  // ─── 카메라 권한 상태 ───
  const [permission, requestPermission] = useCameraPermissions();

  // ─── 로컬 상태 ───
  const [scanType, setScanType] = useState('object'); // 'object' | 'ocr'
  const [capturedImage, setCapturedImage] = useState(null); // 촬영된 이미지 URI
  const [showResult, setShowResult] = useState(false); // 결과 모달 표시 여부
  const cameraRef = useRef(null);

  // ─── 전역 상태 (Zustand) ───
  const { scanResult, setScanResult, isScanning, setIsScanning, clearScanResult } = useStore();

  /**
   * 카메라로 사진 촬영
   * CameraView의 takePictureAsync를 호출하여 이미지를 캡처합니다.
   */
  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      setIsScanning(true);
      clearScanResult();

      // 카메라로 촬영 (품질 80%, base64 미포함)
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      setCapturedImage(photo.uri);
      await analyzeImage(photo.uri);
    } catch (error) {
      console.error('촬영 에러:', error);
      Alert.alert('오류', '사진 촬영 중 문제가 발생했습니다.');
      setIsScanning(false);
    }
  };

  /**
   * 갤러리에서 이미지 선택
   * 카메라를 사용할 수 없는 경우의 대체 수단
   */
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsScanning(true);
        clearScanResult();
        setCapturedImage(result.assets[0].uri);
        await analyzeImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('갤러리 에러:', error);
      Alert.alert('오류', '이미지 선택 중 문제가 발생했습니다.');
    }
  };

  /**
   * 이미지 분석 요청
   * 서버에 이미지를 전송하고 스캔 결과를 받아옵니다.
   * 서버 연결 실패 시 Mock 결과를 사용합니다.
   * 
   * @param {string} imageUri - 분석할 이미지의 로컬 URI
   */
  const analyzeImage = async (imageUri) => {
    try {
      const result = await scanImage(imageUri, scanType);
      setScanResult(result);
      setShowResult(true);
    } catch (error) {
      console.log('서버 연결 실패, Mock 결과 사용:', error.message);

      // 서버 미연결 시 Mock 결과 (개발 단계)
      const mockResult = scanType === 'object'
        ? {
            success: true,
            scanType: 'object',
            result: {
              identifiedItem: '백합 (Lily)',
              riskLevel: 'TOXIC',
              confidence: 0.92,
              details: '백합은 고양이에게 매우 위험한 식물입니다. 소량 섭취만으로도 급성 신부전을 유발할 수 있습니다.',
              symptoms: ['구토', '식욕 부진', '무기력', '신부전'],
              category: 'PLANT',
            },
            disclaimer: '⚠️ 본 결과는 참고용이며, 최종 판단 및 응급 상황은 수의사와 상담하십시오.',
          }
        : {
            success: true,
            scanType: 'ocr',
            result: {
              extractedText: '닭고기, 현미, 연어유, 타우린, 양파 가루',
              overallRiskLevel: 'TOXIC',
              safeIngredients: ['닭고기', '현미', '연어유', '타우린'],
              detectedHazards: [{
                ingredient: '양파 가루',
                riskLevel: 'TOXIC',
                details: '양파는 고양이의 적혈구를 파괴합니다.',
                symptoms: ['빈혈', '무기력'],
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

  /**
   * 결과 모달 닫기 및 상태 초기화
   */
  const closeResult = () => {
    setShowResult(false);
    setCapturedImage(null);
    clearScanResult();
  };

  // ─── 카메라 권한 미확인 상태 ───
  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>카메라 권한 확인 중...</Text>
      </View>
    );
  }

  // ─── 카메라 권한 거부 상태 ───
  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>카메라 접근 권한이 필요합니다</Text>
        <Text style={styles.permissionDesc}>
          식물/사물 스캔과 성분표 OCR을 위해{'\n'}카메라 접근을 허용해주세요.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>권한 허용하기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.galleryFallback} onPress={pickImage}>
          <Text style={styles.galleryFallbackText}>📁 갤러리에서 선택하기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── 메인 스캐너 UI ───
  return (
    <View style={styles.container}>
      {/* 카메라 프리뷰 영역 */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        >
          {/* 스캔 가이드 프레임 오버레이 */}
          <View style={styles.overlay}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <Text style={styles.guideText}>
              {scanType === 'object'
                ? '🌿 식물/사물을 프레임 안에 맞춰주세요'
                : '📋 성분표를 프레임 안에 맞춰주세요'}
            </Text>
          </View>
        </CameraView>
      </View>

      {/* 하단 컨트롤 패널 */}
      <View style={styles.controls}>
        {/* 스캔 모드 선택 토글 */}
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              scanType === 'object' && styles.modeButtonActive,
            ]}
            onPress={() => setScanType('object')}
          >
            <Text style={[
              styles.modeText,
              scanType === 'object' && styles.modeTextActive,
            ]}>
              🌿 사물/식물
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              scanType === 'ocr' && styles.modeButtonActive,
            ]}
            onPress={() => setScanType('ocr')}
          >
            <Text style={[
              styles.modeText,
              scanType === 'ocr' && styles.modeTextActive,
            ]}>
              📋 성분표
            </Text>
          </TouchableOpacity>
        </View>

        {/* 촬영 버튼 영역 */}
        <View style={styles.buttonRow}>
          {/* 갤러리 버튼 */}
          <TouchableOpacity style={styles.sideButton} onPress={pickImage}>
            <Text style={styles.sideButtonText}>🖼️</Text>
            <Text style={styles.sideButtonLabel}>갤러리</Text>
          </TouchableOpacity>

          {/* 메인 촬영 버튼 */}
          <TouchableOpacity
            style={[styles.captureButton, isScanning && styles.captureButtonDisabled]}
            onPress={takePicture}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator size="large" color={COLORS.white} />
            ) : (
              <View style={styles.captureInner} />
            )}
          </TouchableOpacity>

          {/* 빈 공간 (레이아웃 균형용) */}
          <View style={styles.sideButton}>
            <Text style={styles.sideButtonText}>🐱</Text>
            <Text style={styles.sideButtonLabel}>나비</Text>
          </View>
        </View>

        {/* 법적 고지 문구 - 항상 노출 (명세서 요구사항) */}
        <Text style={styles.disclaimer}>
          ⚠️ 본 결과는 참고용이며, 최종 판단 및 응급 상황은 수의사와 상담하십시오.
        </Text>
      </View>

      {/* 스캔 결과 모달 */}
      <Modal
        visible={showResult && scanResult !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={closeResult}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* 촬영된 이미지 미리보기 */}
              {capturedImage && (
                <Image source={{ uri: capturedImage }} style={styles.previewImage} />
              )}

              {/* 스캔 결과 카드 컴포넌트 */}
              {scanResult && <ScanResultCard result={scanResult} />}
            </ScrollView>

            {/* 닫기 버튼 */}
            <TouchableOpacity style={styles.closeButton} onPress={closeResult}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================
// 스타일 정의
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  // ─── 카메라 권한 요청 UI ───
  permissionIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  galleryFallback: {
    padding: 12,
  },
  galleryFallbackText: {
    color: COLORS.primary,
    fontSize: 14,
  },

  // ─── 카메라 프리뷰 ───
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── 스캔 가이드 프레임 (네 모서리 표시) ───
  scanFrame: {
    width: 260,
    height: 260,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLORS.white,
  },
  topLeft: {
    top: 0, left: 0,
    borderTopWidth: 3, borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0, right: 0,
    borderTopWidth: 3, borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0, left: 0,
    borderBottomWidth: 3, borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0, right: 0,
    borderBottomWidth: 3, borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  guideText: {
    color: COLORS.white,
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  // ─── 하단 컨트롤 패널 ───
  controls: {
    backgroundColor: COLORS.surface,
    paddingTop: 16,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  // ─── 스캔 모드 토글 ───
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modeTextActive: {
    color: COLORS.white,
  },

  // ─── 촬영 버튼 행 ───
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  sideButton: {
    width: 60,
    alignItems: 'center',
  },
  sideButtonText: {
    fontSize: 28,
  },
  sideButtonLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.primaryLight,
  },
  captureButtonDisabled: {
    backgroundColor: COLORS.gray,
    borderColor: COLORS.border,
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },

  // ─── 법적 고지 ───
  disclaimer: {
    fontSize: 11,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 16,
  },

  // ─── 결과 모달 ───
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: COLORS.background,
  },
  closeButton: {
    backgroundColor: COLORS.background,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
});
