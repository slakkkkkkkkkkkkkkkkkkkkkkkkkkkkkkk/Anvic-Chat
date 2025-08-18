import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useSettings } from '@/hooks/useSettings';
import { Themes } from '@/constants/Themes';

interface ReadStatusIndicatorProps {
  status: 'sending' | 'sent' | 'delivered' | 'read';
  style?: any;
}

export default function ReadStatusIndicator({ status, style }: ReadStatusIndicatorProps) {
  const { settings } = useSettings();
  const currentTheme = Themes[settings.theme];

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return (
          <MaterialIcons 
            name="schedule" 
            size={14} 
            color={currentTheme.textMuted} 
          />
        );
      case 'sent':
        return (
          <MaterialIcons 
            name="done" 
            size={14} 
            color={currentTheme.textMuted} 
          />
        );
      case 'delivered':
        return (
          <View style={styles.doubleCheck}>
            <MaterialIcons 
              name="done" 
              size={14} 
              color={currentTheme.textMuted}
              style={styles.firstCheck}
            />
            <MaterialIcons 
              name="done" 
              size={14} 
              color={currentTheme.textMuted}
              style={styles.secondCheck}
            />
          </View>
        );
      case 'read':
        return (
          <View style={styles.doubleCheck}>
            <MaterialIcons 
              name="done" 
              size={14} 
              color={Colors.primary}
              style={styles.firstCheck}
            />
            <MaterialIcons 
              name="done" 
              size={14} 
              color={Colors.primary}
              style={styles.secondCheck}
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {getStatusIcon()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  doubleCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    width: 18,
    height: 14,
  },
  firstCheck: {
    position: 'absolute',
    left: 0,
  },
  secondCheck: {
    position: 'absolute',
    left: 6,
  },
});