/**
 * ============================================
 * AppNavigator - 앱 네비게이션 설정
 * ============================================
 * 
 * React Navigation의 Bottom Tab Navigator를 사용하여
 * 3개의 메인 탭을 구성합니다.
 * 
 * 탭 구조:
 * 1. 🔍 스캐너 - ScannerScreen (카메라/OCR 스캔)
 * 2. 💬 냥챗   - ChatScreen (AI 챗봇)
 * 3. 📅 타임라인 - TimelineScreen (건강 기록)
 * 
 * 공통 설정:
 * - iOS 스타일의 하단 탭 바
 * - 활성 탭 색상: primary (보라색)
 * - 비활성 탭 색상: gray
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import ScannerScreen from '../screens/ScannerScreen';
import ChatScreen from '../screens/ChatScreen';
import TimelineScreen from '../screens/TimelineScreen';
import { COLORS } from '../styles/colors';

// Bottom Tab Navigator 인스턴스 생성
const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        // 탭 바 스타일
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingTop: 6,
          paddingBottom: 8,
          height: 60,
        },
        // 활성/비활성 색상
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        // 라벨 스타일
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        // 헤더 기본 숨김 (각 화면에서 커스텀 헤더 사용)
        headerShown: false,
      }}
    >
      {/* 스캐너 탭 */}
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          tabBarLabel: '스캐너',
          tabBarIcon: ({ focused, color }) => (
            <Text style={{ fontSize: 22 }}>
              {focused ? '🔍' : '🔎'}
            </Text>
          ),
        }}
      />

      {/* 냥챗 탭 */}
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarLabel: '냥챗',
          tabBarIcon: ({ focused, color }) => (
            <Text style={{ fontSize: 22 }}>
              {focused ? '🐱' : '😺'}
            </Text>
          ),
        }}
      />

      {/* 타임라인 탭 */}
      <Tab.Screen
        name="Timeline"
        component={TimelineScreen}
        options={{
          tabBarLabel: '타임라인',
          tabBarIcon: ({ focused, color }) => (
            <Text style={{ fontSize: 22 }}>
              {focused ? '📅' : '🗓️'}
            </Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
