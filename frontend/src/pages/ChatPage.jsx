/**
 * ============================================
 * ChatPage - 냥챗 (AI 챗봇) 페이지 (PWA 웹 버전)
 * ============================================
 * React Native FlatList → 일반 div 스크롤로 변환
 * KeyboardAvoidingView 불필요 (웹은 자동 처리)
 */

import { useState, useRef, useEffect } from 'react';
import { COLORS, getRiskColor } from '../styles/colors';
import { askChat } from '../services/api';
import useStore from '../store/useStore';
import './ChatPage.css';

export default function ChatPage() {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  const { chatHistory, addChatMessage, isChatLoading, setChatLoading } = useStore();

  /** 새 메시지 시 자동 스크롤 */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory.length]);

  /** 메시지 전송 */
  const handleSend = async () => {
    const message = inputText.trim();
    if (!message || isChatLoading) return;

    setInputText('');
    addChatMessage({ role: 'user', message });

    setChatLoading(true);
    try {
      const response = await askChat(message);
      addChatMessage({
        role: 'bot',
        message: response.answer,
        relatedItems: response.relatedItems || [],
        disclaimer: response.disclaimer,
      });
    } catch (error) {
      console.log('챗봇 서버 연결 실패, Mock 응답 사용:', error.message);
      addChatMessage({
        role: 'bot',
        message: getLocalMockAnswer(message),
        disclaimer: '⚠️ 본 정보는 참고용이며, 정확한 진단과 처방은 수의사와 상담하십시오.',
      });
    } finally {
      setChatLoading(false);
    }
  };

  /** 로컬 Mock 응답 */
  const getLocalMockAnswer = (msg) => {
    const lower = msg.toLowerCase();
    if (lower.includes('백합') || lower.includes('lily'))
      return '🚨 백합(Lily)은 고양이에게 매우 위험한 식물입니다!\n\n꽃가루, 잎, 줄기 모두 독성이 있으며, 소량 섭취만으로도 급성 신부전을 유발할 수 있습니다.\n\n예상 증상: 구토, 식욕 부진, 무기력, 신부전\n\n⚠️ 즉시 수의사에게 연락하세요!';
    if (lower.includes('초콜릿') || lower.includes('chocolate'))
      return '🚨 초콜릿은 고양이에게 위험합니다!\n\n테오브로민 성분이 포함되어 있어 심혈관계와 신경계에 심각한 영향을 줄 수 있습니다.\n\n예상 증상: 구토, 설사, 심박수 증가, 발작';
    if (lower.includes('닭고기') || lower.includes('chicken'))
      return '✅ 익힌 닭고기는 고양이에게 안전합니다!\n\n좋은 단백질 공급원으로, 간식이나 토핑으로 적합합니다.\n\n⚠️ 단, 뼈와 양념은 반드시 제거해주세요.';
    return `🐱 "${msg}"에 대해 분석 중입니다.\n\n현재 해당 물질에 대한 정보가 데이터베이스에 등록되어 있지 않습니다.\n\n정확한 정보를 위해 수의사와 상담하시는 것을 권장합니다.`;
  };

  /** Enter 키 전송 */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    '백합이 고양이에게 위험한가요?',
    '초콜릿을 먹어도 되나요?',
    '닭고기는 안전한가요?',
    '양파 가루가 포함된 간식',
  ];

  return (
    <div className="chat-page">
      {/* 헤더 */}
      <div className="chat-header">
        <h2>🐱 냥챗</h2>
        <p>독성 물질에 대해 물어보세요</p>
      </div>

      {/* 채팅 영역 */}
      <div className="chat-body">
        {chatHistory.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">💬</span>
            <h3>냥챗에 오신 걸 환영합니다!</h3>
            <p>고양이에게 위험한 물질이 궁금하신가요?<br />아래 예시 질문을 눌러보세요!</p>
            <div className="quick-questions">
              {quickQuestions.map((q, i) => (
                <button key={i} className="quick-btn" onClick={() => setInputText(q)}>{q}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="messages">
            {chatHistory.map((item, idx) => {
              const isUser = item.role === 'user';
              return (
                <div key={idx} className={`msg-row ${isUser ? 'user' : 'bot'}`}>
                  {!isUser && <span className="bot-icon">🐱</span>}
                  <div className={`msg-bubble ${isUser ? 'user-bubble' : 'bot-bubble'}`}>
                    <p className="msg-text" style={{ whiteSpace: 'pre-wrap' }}>{item.message}</p>

                    {/* 관련 독성 정보 */}
                    {item.relatedItems?.length > 0 && (
                      <div className="related-section">
                        <p className="related-title">📋 관련 독성 정보:</p>
                        {item.relatedItems.map((ri, i) => {
                          const riskKey = ri.toxicityLevel === 'HIGH' ? 'TOXIC' : ri.toxicityLevel === 'MEDIUM' ? 'WARNING' : 'SAFE';
                          const rc = getRiskColor(riskKey);
                          return (
                            <span key={i} className="toxicity-badge" style={{ background: rc.light, color: rc.main }}>
                              {ri.nameKo || ri.name} [{ri.toxicityLevel}]
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {item.disclaimer && <p className="disclaimer-text">{item.disclaimer}</p>}
                    <span className="timestamp">
                      {new Date(item.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
        )}

        {isChatLoading && (
          <div className="typing-indicator">
            <span>🐱 냥챗이 생각 중...</span>
            <div className="typing-dots"><span /><span /><span /></div>
          </div>
        )}
      </div>

      {/* 입력 바 */}
      <div className="input-bar">
        <input
          type="text"
          className="chat-input"
          placeholder="질문을 입력하세요..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!inputText.trim() || isChatLoading}
        >전송</button>
      </div>
    </div>
  );
}
