import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
  // Presença
  showOnlineStatus: boolean;
  isOnline: boolean;
  
  // Aparência
  theme: 'light' | 'dark' | 'absolute_dark';
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  fontFamily: 'default' | 'modern' | 'classic' | 'playful';
  
  // Chat personalização
  chatWallpaper: string | null;
  chatBubbleStyle: 'default' | 'rounded' | 'square' | 'minimal';
  
  // Modo privado
  sexyModeEnabled: boolean;
  
  // Performance
  animationsEnabled: boolean;
  highQualityImages: boolean;
}

const defaultSettings: AppSettings = {
  showOnlineStatus: true,
  isOnline: true,
  theme: 'absolute_dark',
  fontSize: 'medium',
  fontFamily: 'default',
  chatWallpaper: null,
  chatBubbleStyle: 'default',
  sexyModeEnabled: false,
  animationsEnabled: true,
  highQualityImages: true,
};

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  loading: boolean;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('@anvic_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.log('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      await AsyncStorage.setItem('@anvic_settings', JSON.stringify(updated));
    } catch (error) {
      console.log('Erro ao salvar configurações:', error);
    }
  };

  const resetSettings = async () => {
    try {
      setSettings(defaultSettings);
      await AsyncStorage.setItem('@anvic_settings', JSON.stringify(defaultSettings));
    } catch (error) {
      console.log('Erro ao resetar configurações:', error);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}