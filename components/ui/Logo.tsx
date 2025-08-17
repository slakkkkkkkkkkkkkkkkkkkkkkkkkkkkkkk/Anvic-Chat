import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

interface LogoProps {
  size?: number;
  style?: any;
}

const Logo: React.FC<LogoProps> = ({ size = 120, style }) => {
  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri: 'https://cdn-ai.onspace.ai/onspace/project/image/VJ6xPwy5YEJJnwQo4nrm6M/logo.png' }}
        style={[styles.logo, { width: size, height: size }]}
        contentFit="contain"
        cachePolicy="memory-disk"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    borderRadius: 12,
  },
});

export default Logo;