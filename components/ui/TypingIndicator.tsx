import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useSettings } from '@/hooks/useSettings';
import { Themes } from '@/constants/Themes';

interface TypingIndicatorProps {
  isTyping: boolean;
  userName?: string;
  style?: any;
}

export default function TypingIndicator({ isTyping, userName = 'Alguém', style }: TypingIndicatorProps) {
  const { settings } = useSettings();
  const currentTheme = Themes[settings.theme];
  
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isTyping) {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Dot animation sequence
      const createDotAnimation = (dot: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const animation = Animated.parallel([
        createDotAnimation(dot1, 0),
        createDotAnimation(dot2, 150),
        createDotAnimation(dot3, 300),
      ]);

      animation.start();

      return () => {
        animation.stop();
        dot1.setValue(0);
        dot2.setValue(0);
        dot3.setValue(0);
      };
    } else {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isTyping, dot1, dot2, dot3, fadeAnim]);

  if (!isTyping) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { backgroundColor: currentTheme.surface, opacity: fadeAnim },
        style
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.typingText, { color: currentTheme.textSecondary }]}>
          {userName} está digitando
        </Text>
        <View style={styles.dotsContainer}>
          <Animated.View
            style={[
              styles.dot,
              { backgroundColor: currentTheme.primary },
              {
                transform: [
                  {
                    scale: dot1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.3],
                    }),
                  },
                ],
                opacity: dot1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              { backgroundColor: currentTheme.primary },
              {
                transform: [
                  {
                    scale: dot2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.3],
                    }),
                  },
                ],
                opacity: dot2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              { backgroundColor: currentTheme.primary },
              {
                transform: [
                  {
                    scale: dot3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.3],
                    }),
                  },
                ],
                opacity: dot3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
              },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    maxWidth: '70%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 14,
    marginRight: 8,
    fontStyle: 'italic',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});