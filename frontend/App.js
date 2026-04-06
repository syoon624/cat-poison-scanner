/**
 * ============================================
 * PurrfectScan - 메인 앱 컴포넌트
 * ============================================
 * 
 * 반려묘 안전/건강 복합 관리 앱의 최상위 컴포넌트입니다.
 * 
 * 구조:
 * - SafeAreaProvider: iOS 안전 영역 (노치, 홈 인디케이터) 관리
 * - StatusBar: 상태바 스타일 설정
 * - NavigationContainer: React Navigation 컨테이너
 * - AppNavigator: Bottom Tab 네비게이션
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      {/* iOS 상태바를 밝은 스타일로 설정 (어두운 배경에서 사용) */}
      <StatusBar style="light" />
      
      {/* React Navigation 컨테이너 */}
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
