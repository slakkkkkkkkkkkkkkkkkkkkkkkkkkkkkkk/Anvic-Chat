import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { useSettings } from '@/hooks/useSettings';

interface SexyModeButtonProps {
  onToggle?: (enabled: boolean) => void;
  size?: number;
  style?: any;
}

export default function SexyModeButton({ onToggle, size = 24, style }: SexyModeButtonProps) {
  const { settings, updateSettings } = useSettings();

  const handleToggle = async () => {
    const newValue = !settings.sexyModeEnabled;
    await updateSettings({ sexyModeEnabled: newValue });
    onToggle?.(newValue);
  };

  return (
    <TouchableOpacity 
      onPress={handleToggle}
      style={[styles.container, style]}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconContainer, 
        { 
          width: size, 
          height: size,
          borderColor: settings.sexyModeEnabled ? '#FF6B6B' : '#666666',
          borderWidth: 2,
        }
      ]}>
        <View style={[
          styles.innerIcon,
          {
            backgroundColor: settings.sexyModeEnabled ? '#FF6B6B' : 'transparent',
            width: size * 0.4,
            height: size * 0.4,
          }
        ]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
  iconContainer: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  innerIcon: {
    borderRadius: 4,
  },
});