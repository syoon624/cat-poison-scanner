/**
 * ============================================
 * ScanResultCard - 스캔 결과 표시 카드 컴포넌트
 * ============================================
 * 
 * 스캔 분석 결과를 직관적인 카드 UI로 표시합니다.
 * 위험도(Safe/Warning/Toxic)에 따라 색상이 변경됩니다.
 * 
 * Props:
 * @param {Object} result - 서버로부터 받은 스캔 결과 객체
 * @param {string} result.scanType - 'object' | 'ocr'
 * @param {Object} result.result - 상세 분석 결과
 * @param {string} result.disclaimer - 법적 고지 문구
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, getRiskColor } from '../styles/colors';

export default function ScanResultCard({ result }) {
  if (!result || !result.result) return null;

  const { scanType, result: scanData, disclaimer } = result;

  // ────────────────────────────────────────
  // 사물/식물 스캔 결과 (object 모드)
  // ────────────────────────────────────────
  if (scanType === 'object') {
    const riskColor = getRiskColor(scanData.riskLevel);

    return (
      <View style={styles.card}>
        {/* 위험도 배너 - 상단에 크게 표시 */}
        <View style={[styles.riskBanner, { backgroundColor: riskColor.light }]}>
          <Text style={[styles.riskIcon, { color: riskColor.main }]}>
            {scanData.riskLevel === 'TOXIC' ? '🚨' :
             scanData.riskLevel === 'WARNING' ? '⚠️' : '✅'}
          </Text>
          <Text style={[styles.riskLabel, { color: riskColor.main }]}>
            {scanData.riskLevel === 'TOXIC' ? '위험' :
             scanData.riskLevel === 'WARNING' ? '주의' : '안전'}
          </Text>
        </View>

        {/* 식별된 물질 이름 */}
        <Text style={styles.itemName}>{scanData.identifiedItem}</Text>

        {/* 인식 신뢰도 */}
        {scanData.confidence && (
          <Text style={styles.confidence}>
            인식 신뢰도: {Math.round(scanData.confidence * 100)}%
          </Text>
        )}

        {/* 상세 설명 */}
        <Text style={styles.details}>{scanData.details}</Text>

        {/* 예상 증상 목록 */}
        {scanData.symptoms && scanData.symptoms.length > 0 && (
          <View style={styles.symptomsSection}>
            <Text style={styles.sectionTitle}>🏥 예상 증상</Text>
            <View style={styles.symptomsGrid}>
              {scanData.symptoms.map((symptom, idx) => (
                <View key={idx} style={[styles.symptomChip, { backgroundColor: riskColor.light }]}>
                  <Text style={[styles.symptomText, { color: riskColor.main }]}>
                    {symptom}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 법적 고지 */}
        {disclaimer && <Text style={styles.disclaimer}>{disclaimer}</Text>}
      </View>
    );
  }

  // ────────────────────────────────────────
  // 성분표 OCR 스캔 결과 (ocr 모드)
  // ────────────────────────────────────────
  if (scanType === 'ocr') {
    const overallColor = getRiskColor(scanData.overallRiskLevel);

    return (
      <View style={styles.card}>
        {/* 전체 위험도 배너 */}
        <View style={[styles.riskBanner, { backgroundColor: overallColor.light }]}>
          <Text style={[styles.riskIcon, { color: overallColor.main }]}>
            {scanData.overallRiskLevel === 'TOXIC' ? '🚨' :
             scanData.overallRiskLevel === 'WARNING' ? '⚠️' : '✅'}
          </Text>
          <Text style={[styles.riskLabel, { color: overallColor.main }]}>
            {scanData.overallRiskLevel === 'TOXIC' ? '유해 성분 검출!' :
             scanData.overallRiskLevel === 'WARNING' ? '주의 필요' : '안전한 제품'}
          </Text>
        </View>

        {/* OCR로 추출된 원문 텍스트 */}
        <View style={styles.extractedSection}>
          <Text style={styles.sectionTitle}>📝 추출된 성분표</Text>
          <Text style={styles.extractedText}>{scanData.extractedText}</Text>
        </View>

        {/* 검출된 유해 성분 목록 */}
        {scanData.detectedHazards && scanData.detectedHazards.length > 0 && (
          <View style={styles.hazardSection}>
            <Text style={styles.sectionTitle}>
              🚨 유해 성분 ({scanData.detectedHazards.length}건)
            </Text>
            {scanData.detectedHazards.map((hazard, idx) => {
              const hazardColor = getRiskColor(hazard.riskLevel);
              return (
                <View key={idx} style={[styles.hazardCard, { borderLeftColor: hazardColor.main }]}>
                  <Text style={[styles.hazardName, { color: hazardColor.main }]}>
                    {hazard.ingredient}
                  </Text>
                  <Text style={styles.hazardDetails}>{hazard.details}</Text>
                  {hazard.symptoms && (
                    <View style={styles.symptomsGrid}>
                      {hazard.symptoms.map((s, i) => (
                        <View key={i} style={[styles.symptomChip, { backgroundColor: hazardColor.light }]}>
                          <Text style={[styles.symptomText, { color: hazardColor.main }]}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* 안전한 성분 목록 */}
        {scanData.safeIngredients && scanData.safeIngredients.length > 0 && (
          <View style={styles.safeSection}>
            <Text style={styles.sectionTitle}>
              ✅ 안전한 성분 ({scanData.safeIngredients.length}건)
            </Text>
            <View style={styles.symptomsGrid}>
              {scanData.safeIngredients.map((ing, idx) => (
                <View key={idx} style={[styles.symptomChip, { backgroundColor: COLORS.safeLight }]}>
                  <Text style={[styles.symptomText, { color: COLORS.safe }]}>{ing}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 법적 고지 */}
        {disclaimer && <Text style={styles.disclaimer}>{disclaimer}</Text>}
      </View>
    );
  }

  return null;
}

// ============================================
// 스타일 정의
// ============================================
const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
  },

  // ─── 위험도 배너 ───
  riskBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  riskIcon: {
    fontSize: 28,
  },
  riskLabel: {
    fontSize: 22,
    fontWeight: 'bold',
  },

  // ─── 물질 정보 ───
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  confidence: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  details: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 16,
  },

  // ─── 증상 섹션 ───
  symptomsSection: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  symptomChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  symptomText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ─── OCR 추출 텍스트 ───
  extractedSection: {
    marginBottom: 16,
  },
  extractedText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    lineHeight: 20,
  },

  // ─── 유해 성분 카드 ───
  hazardSection: {
    marginBottom: 16,
  },
  hazardCard: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  hazardName: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  hazardDetails: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 8,
  },

  // ─── 안전 성분 ───
  safeSection: {
    marginBottom: 16,
  },

  // ─── 법적 고지 ───
  disclaimer: {
    fontSize: 11,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
    lineHeight: 16,
  },
});
