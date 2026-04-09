/**
 * ============================================
 * ScanResultCard - 스캔 결과 카드 (PWA 웹 버전)
 * ============================================
 * 스캔 분석 결과를 위험도별 색상과 함께 표시합니다.
 */

import { getRiskColor } from '../styles/colors';
import './ScanResultCard.css';

export default function ScanResultCard({ result }) {
  if (!result) return null;

  const isObjectScan = result.scanType === 'object';
  const data = result.result;

  if (isObjectScan) {
    const rc = getRiskColor(data.riskLevel);
    return (
      <div className="result-card" style={{ borderLeft: `4px solid ${rc.main}` }}>
        <div className="result-header">
          <h3>{data.identifiedItem}</h3>
          <span className="risk-badge" style={{ background: rc.light, color: rc.main }}>
            {data.riskLevel === 'TOXIC' ? '🚨 위험' : data.riskLevel === 'WARNING' ? '⚠️ 주의' : '✅ 안전'}
          </span>
        </div>
        {data.confidence && (
          <div className="confidence-bar">
            <div className="confidence-fill" style={{ width: `${data.confidence * 100}%`, background: rc.main }} />
            <span>정확도 {Math.round(data.confidence * 100)}%</span>
          </div>
        )}
        <p className="result-details">{data.details}</p>
        {data.symptoms?.length > 0 && (
          <div className="symptoms">
            <strong>예상 증상:</strong>
            <div className="symptom-tags">
              {data.symptoms.map((s, i) => <span key={i} className="symptom-tag">{s}</span>)}
            </div>
          </div>
        )}
        {result.disclaimer && <p className="card-disclaimer">{result.disclaimer}</p>}
      </div>
    );
  }

  /* OCR 스캔 결과 */
  const overallRc = getRiskColor(data.overallRiskLevel);
  return (
    <div className="result-card" style={{ borderLeft: `4px solid ${overallRc.main}` }}>
      <div className="result-header">
        <h3>📋 성분표 분석 결과</h3>
        <span className="risk-badge" style={{ background: overallRc.light, color: overallRc.main }}>
          {data.overallRiskLevel === 'TOXIC' ? '🚨 위험' : data.overallRiskLevel === 'WARNING' ? '⚠️ 주의' : '✅ 안전'}
        </span>
      </div>

      {data.extractedText && (
        <div className="ocr-text">
          <strong>인식된 텍스트:</strong>
          <p>{data.extractedText}</p>
        </div>
      )}

      {data.safeIngredients?.length > 0 && (
        <div className="safe-ingredients">
          <strong>✅ 안전한 성분:</strong>
          <div className="ingredient-tags">
            {data.safeIngredients.map((s, i) => <span key={i} className="ingredient-tag safe">{s}</span>)}
          </div>
        </div>
      )}

      {data.detectedHazards?.length > 0 && (
        <div className="hazards">
          <strong>🚨 유해 성분:</strong>
          {data.detectedHazards.map((h, i) => {
            const hrc = getRiskColor(h.riskLevel);
            return (
              <div key={i} className="hazard-item" style={{ borderLeft: `3px solid ${hrc.main}` }}>
                <div className="hazard-header">
                  <span className="hazard-name">{h.ingredient}</span>
                  <span className="hazard-badge" style={{ background: hrc.light, color: hrc.main }}>
                    {h.riskLevel}
                  </span>
                </div>
                <p className="hazard-detail">{h.details}</p>
                {h.symptoms?.length > 0 && (
                  <div className="symptom-tags">
                    {h.symptoms.map((s, j) => <span key={j} className="symptom-tag">{s}</span>)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {result.disclaimer && <p className="card-disclaimer">{result.disclaimer}</p>}
    </div>
  );
}
