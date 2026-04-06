/**
 * ============================================
 * ChatScreen - 냥챗 (AI 챗봇) 화면
 * ============================================
 * 
 * 텍스트 기반으로 독성 물질을 검색하거나
 * 급여 가능 여부를 물어볼 수 있는 채팅 화면입니다.
 * 
 * 기능:
 * - 자연어로 독성 물질 질의
 * - 채팅 히스토리 관리
 * - 관련 독성 DB 항목 표시
 * - 타임라인 자동 연동 지원
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { COLORS, getRiskColor } from '../styles/colors';
import { askChat } from '../services/api';
import useStore from '../store/useStore';

export default function ChatScreen() {
  // ─── 로컬 상태 ───
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);

  // ─── 전역 상태 (Zustand) ───
  const {
    chatHistory,
    addChatMessage,
    isChatLoading,
    setChatLoading,
  } = useStore();

  /**
   * 새 메시지 추가 시 FlatList를 자동으로 하단 스크롤
   */
  useEffect(() => {
    if (chatHistory.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatHistory.length]);

  /**
   * 메시지 전송 처리
   * 1. 사용자 메시지를 히스토리에 추가
   * 2. 서버에 질의 전송
   * 3. 응답을 히스토리에 추가
   */
  const handleSend = async () => {
    const message = inputText.trim();
    if (!message || isChatLoading) return;

    // 입력 필드 초기화
    setInputText('');

    // 사용자 메시지 추가
    addChatMessage({ role: 'user', message });

    // 서버에 질의 전송
    setChatLoading(true);
    try {
      const response = await askChat(message);

      // 봇 응답 추가
      addChatMessage({
        role: 'bot',
        message: response.answer,
        relatedItems: response.relatedItems || [],
        disclaimer: response.disclaimer,
      });
    } catch (error) {
      console.log('챗봇 서버 연결 실패, Mock 응답 사용:', error.message);

      // 서버 미연결 시 로컬 Mock 응답
      const mockAnswer = getLocalMockAnswer(message);
      addChatMessage({
        role: 'bot',
        message: mockAnswer,
        disclaimer: '⚠️ 본 정보는 참고용이며, 정확한 진단과 처방은 수의사와 상담하십시오.',
      });
    } finally {
      setChatLoading(false);
    }
  };

  /**
   * 로컬 Mock 응답 생성 (서버 미연결 시)
   * @param {string} message - 사용자 메시지
   * @returns {string} Mock 답변
   */
  const getLocalMockAnswer = (message) => {
    const lower = message.toLowerCase();
    if (lower.includes('백합') || lower.includes('lily')) {
      return '🚨 백합(Lily)은 고양이에게 매우 위험한 식물입니다!\n\n꽃가루, 잎, 줄기 모두 독성이 있으며, 소량 섭취만으로도 급성 신부전을 유발할 수 있습니다.\n\n예상 증상: 구토, 식욕 부진, 무기력, 신부전\n\n⚠️ 즉시 수의사에게 연락하세요!';
    }
    if (lower.includes('초콜릿') || lower.includes('chocolate')) {
      return '🚨 초콜릿은 고양이에게 위험합니다!\n\n테오브로민 성분이 포함되어 있어 심혈관계와 신경계에 심각한 영향을 줄 수 있습니다.\n\n예상 증상: 구토, 설사, 심박수 증가, 발작';
    }
    if (lower.includes('닭고기') || lower.includes('chicken')) {
      return '✅ 익힌 닭고기는 고양이에게 안전합니다!\n\n좋은 단백질 공급원으로, 간식이나 토핑으로 적합합니다.\n\n⚠️ 단, 뼈와 양념은 반드시 제거해주세요.';
    }
    return `🐱 "${message}"에 대해 분석 중입니다.\n\n현재 해당 물질에 대한 정보가 데이터베이스에 등록되어 있지 않습니다.\n\n정확한 정보를 위해 수의사와 상담하시는 것을 권장합니다.`;
  };

  /**
   * 빠른 질문 버튼 클릭 처리
   * @param {string} question - 미리 정의된 질문 텍스트
   */
  const handleQuickQuestion = (question) => {
    setInputText(question);
  };

  /**
   * 채팅 메시지 버블 렌더링
   * 사용자/봇 메시지를 각각 다른 스타일로 표시
   */
  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.botBubble
      ]}>
        {/* 봇 메시지 아이콘 */}
        {!isUser && <Text style={styles.botIcon}>🐱</Text>}

        {/* 메시지 내용 */}
        <View style={[
          styles.messageContent,
          isUser ? styles.userContent : styles.botContent
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userText : styles.botText
          ]}>
            {item.message}
          </Text>

          {/* 관련 독성 DB 항목 표시 (봇 응답에만) */}
          {item.relatedItems && item.relatedItems.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.relatedTitle}>📋 관련 독성 정보:</Text>
              {item.relatedItems.map((ri, idx) => (
                <View key={idx} style={styles.relatedItem}>
                  <View style={[
                    styles.toxicityBadge,
                    { backgroundColor: getRiskColor(
                      ri.toxicityLevel === 'HIGH' ? 'TOXIC' : 
                      ri.toxicityLevel === 'MEDIUM' ? 'WARNING' : 'SAFE'
                    ).light }
                  ]}>
                    <Text style={[
                      styles.toxicityText,
                      { color: getRiskColor(
                        ri.toxicityLevel === 'HIGH' ? 'TOXIC' : 
                        ri.toxicityLevel === 'MEDIUM' ? 'WARNING' : 'SAFE'
                      ).main }
                    ]}>
                      {ri.nameKo || ri.name} [{ri.toxicityLevel}]
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* 법적 고지 (봇 응답에만) */}
          {item.disclaimer && (
            <Text style={styles.disclaimerText}>{item.disclaimer}</Text>
          )}

          {/* 타임스탬프 */}
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* 채팅 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🐱 냥챗</Text>
        <Text style={styles.headerSubtitle}>독성 물질에 대해 물어보세요</Text>
      </View>

      {/* 채팅 히스토리가 비어있을 때 표시되는 안내 화면 */}
      {chatHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>냥챗에 오신 걸 환영합니다!</Text>
          <Text style={styles.emptyDesc}>
            고양이에게 위험한 물질이 궁금하신가요?{'\n'}
            아래 예시 질문을 눌러보세요!
          </Text>

          {/* 빠른 질문 버튼들 */}
          <View style={styles.quickQuestions}>
            {[
              '백합이 고양이에게 위험한가요?',
              '초콜릿을 먹어도 되나요?',
              '닭고기는 안전한가요?',
              '양파 가루가 포함된 간식',
            ].map((q, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.quickButton}
                onPress={() => handleQuickQuestion(q)}
              >
                <Text style={styles.quickButtonText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        /* 채팅 메시지 목록 */
        <FlatList
          ref={flatListRef}
          data={chatHistory}
          renderItem={renderMessage}
          keyExtractor={(item, index) => `msg_${index}`}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* 로딩 인디케이터 (봇 응답 대기 중) */}
      {isChatLoading && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>🐱 냥챗이 생각 중...</Text>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      )}

      {/* 메시지 입력 바 */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="질문을 입력하세요..."
          placeholderTextColor={COLORS.textLight}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          multiline={false}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isChatLoading}
        >
          <Text style={styles.sendButtonText}>전송</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ============================================
// 스타일 정의
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ─── 헤더 ───
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },

  // ─── 빈 상태 (대화 시작 전) ───
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },

  // ─── 빠른 질문 버튼 ───
  quickQuestions: {
    width: '100%',
  },
  quickButton: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickButtonText: {
    fontSize: 14,
    color: COLORS.primary,
  },

  // ─── 채팅 목록 ───
  chatList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  // ─── 메시지 버블 ───
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
  },
  botBubble: {
    alignSelf: 'flex-start',
  },
  botIcon: {
    fontSize: 28,
    marginRight: 8,
    marginTop: 4,
  },
  messageContent: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  userContent: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  botContent: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: COLORS.white,
  },
  botText: {
    color: COLORS.text,
  },

  // ─── 관련 독성 정보 ───
  relatedSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  relatedTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  relatedItem: {
    marginBottom: 4,
  },
  toxicityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  toxicityText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ─── 법적 고지 ───
  disclaimerText: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 8,
    fontStyle: 'italic',
  },

  // ─── 타임스탬프 ───
  timestamp: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 6,
    textAlign: 'right',
  },

  // ─── 타이핑 인디케이터 ───
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  typingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  // ─── 입력 바 ───
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: 20,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  sendButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
