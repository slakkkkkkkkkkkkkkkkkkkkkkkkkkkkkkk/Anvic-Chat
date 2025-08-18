import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Modal,
  FlatList,
  Alert,
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { presenceService } from '@/services/presence';
import { Themes, FontSizes, FontFamilies, DefaultWallpapers } from '@/constants/Themes';
import SexyModeButton from '@/components/ui/SexyModeButton';
import BlockedUsersModal from '@/components/ui/BlockedUsersModal';

export default function SettingsScreen() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { user, signOut } = useAuth();
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showFontSizeModal, setShowFontSizeModal] = useState(false);
  const [showFontFamilyModal, setShowFontFamilyModal] = useState(false);
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [blockedUsersModalVisible, setBlockedUsersModalVisible] = useState(false);

  const currentTheme = Themes[settings.theme];
  const currentFontSize = FontSizes[settings.fontSize];

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      console.log(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleOnlineStatusToggle = async (value: boolean) => {
    await updateSettings({ showOnlineStatus: value });
    if (user) {
      await presenceService.toggleVisibility(value);
    }
  };

  const handleSexyModeToggle = (enabled: boolean) => {
    if (enabled) {
      const confirmEnable = () => {
        showAlert('Modo Privado Ativado', 'Mensagens serão auto-destruídas e capturas de tela serão bloqueadas');
      };

      if (Platform.OS === 'web') {
        if (confirm('Ativar Modo Privado? Mensagens serão auto-destruídas.')) {
          confirmEnable();
        }
      } else {
        Alert.alert(
          'Ativar Modo Privado',
          'Mensagens serão auto-destruídas quando você sair do chat. Continuar?',
          [
            { text: 'Cancelar', style: 'cancel', onPress: () => updateSettings({ sexyModeEnabled: false }) },
            { text: 'Ativar', onPress: confirmEnable },
          ]
        );
      }
    }
  };

  const SettingsSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={[styles.section, { backgroundColor: currentTheme.surface }]}>
      <Text style={[styles.sectionTitle, { color: currentTheme.text, fontSize: currentFontSize.title }]}>
        {title}
      </Text>
      {children}
    </View>
  );

  const SettingsItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightComponent,
    showArrow = true 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity 
      style={[styles.settingsItem, { borderBottomColor: currentTheme.divider }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.itemLeft}>
        <MaterialIcons name={icon as any} size={24} color={currentTheme.primary} />
        <View style={styles.itemText}>
          <Text style={[styles.itemTitle, { color: currentTheme.text, fontSize: currentFontSize.body }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.itemSubtitle, { color: currentTheme.textMuted, fontSize: currentFontSize.small }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.itemRight}>
        {rightComponent}
        {showArrow && !rightComponent && (
          <MaterialIcons name="chevron-right" size={24} color={currentTheme.textMuted} />
        )}
      </View>
    </TouchableOpacity>
  );

  const ThemeModal = () => (
    <Modal visible={showThemeModal} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: currentTheme.border }]}>
          <TouchableOpacity onPress={() => setShowThemeModal(false)}>
            <MaterialIcons name="close" size={24} color={currentTheme.text} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Escolher Tema</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView style={styles.modalContent}>
          {Object.entries(Themes).map(([key, theme]) => (
            <TouchableOpacity
              key={key}
              style={[styles.themeOption, { backgroundColor: theme.surface }]}
              onPress={() => {
                updateSettings({ theme: key as any });
                setShowThemeModal(false);
              }}
            >
              <View style={styles.themePreview}>
                <View style={[styles.themeColor, { backgroundColor: theme.background }]} />
                <View style={[styles.themeColor, { backgroundColor: theme.primary }]} />
                <View style={[styles.themeColor, { backgroundColor: theme.surface }]} />
              </View>
              <Text style={[styles.themeTitle, { color: theme.text }]}>
                {key === 'light' ? 'Claro' : key === 'dark' ? 'Escuro' : 'Escuro Absoluto'}
              </Text>
              {settings.theme === key && (
                <MaterialIcons name="check" size={24} color={theme.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <Text style={[styles.headerTitle, { color: currentTheme.text, fontSize: currentFontSize.heading }]}>
          Configurações
        </Text>
        <SexyModeButton onToggle={handleSexyModeToggle} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <SettingsSection title="Presença">
          <SettingsItem
            icon="visibility"
            title="Mostrar Status Online"
            subtitle="Outros podem ver quando você está online"
            rightComponent={
              <Switch
                value={settings.showOnlineStatus}
                onValueChange={handleOnlineStatusToggle}
                trackColor={{ false: currentTheme.border, true: currentTheme.primary }}
                thumbColor={currentTheme.text}
              />
            }
            showArrow={false}
          />
        </SettingsSection>

        <SettingsSection title="Aparência">
          <SettingsItem
            icon="palette"
            title="Tema"
            subtitle={settings.theme === 'light' ? 'Claro' : settings.theme === 'dark' ? 'Escuro' : 'Escuro Absoluto'}
            onPress={() => setShowThemeModal(true)}
          />
          <SettingsItem
            icon="text-fields"
            title="Tamanho da Fonte"
            subtitle={settings.fontSize === 'small' ? 'Pequena' : 
                     settings.fontSize === 'medium' ? 'Média' : 
                     settings.fontSize === 'large' ? 'Grande' : 'Extra Grande'}
            onPress={() => setShowFontSizeModal(true)}
          />
          <SettingsItem
            icon="font-download"
            title="Família da Fonte"
            subtitle={settings.fontFamily === 'default' ? 'Padrão' : 
                     settings.fontFamily === 'modern' ? 'Moderna' : 
                     settings.fontFamily === 'classic' ? 'Clássica' : 'Divertida'}
            onPress={() => setShowFontFamilyModal(true)}
          />
          <SettingsItem
            icon="wallpaper"
            title="Papel de Parede do Chat"
            subtitle="Personalizar fundo das conversas"
            onPress={() => setShowWallpaperModal(true)}
          />
        </SettingsSection>

        <SettingsSection title="Performance">
          <SettingsItem
            icon="animation"
            title="Animações"
            subtitle="Efeitos visuais e transições"
            rightComponent={
              <Switch
                value={settings.animationsEnabled}
                onValueChange={(value) => updateSettings({ animationsEnabled: value })}
                trackColor={{ false: currentTheme.border, true: currentTheme.primary }}
                thumbColor={currentTheme.text}
              />
            }
            showArrow={false}
          />
          <SettingsItem
            icon="high-quality"
            title="Imagens em Alta Qualidade"
            subtitle="Melhor qualidade, maior uso de dados"
            rightComponent={
              <Switch
                value={settings.highQualityImages}
                onValueChange={(value) => updateSettings({ highQualityImages: value })}
                trackColor={{ false: currentTheme.border, true: currentTheme.primary }}
                thumbColor={currentTheme.text}
              />
            }
            showArrow={false}
          />
        </SettingsSection>

        <SettingsSection title="Privacidade">
          <SettingsItem
            icon="block"
            title="Usuários Bloqueados"
            subtitle="Gerenciar usuários bloqueados"
            onPress={() => setBlockedUsersModalVisible(true)}
          />
          <SettingsItem
            icon="security"
            title="Modo Privado"
            subtitle={settings.sexyModeEnabled ? 'Ativado - Mensagens auto-destruídas' : 'Desativado'}
            rightComponent={
              <Switch
                value={settings.sexyModeEnabled}
                onValueChange={(value) => updateSettings({ sexyModeEnabled: value })}
                trackColor={{ false: currentTheme.border, true: '#FF6B6B' }}
                thumbColor={currentTheme.text}
              />
            }
            showArrow={false}
          />
        </SettingsSection>

        <SettingsSection title="Geral">
          <SettingsItem
            icon="refresh"
            title="Resetar Configurações"
            subtitle="Voltar ao padrão"
            onPress={() => {
              if (Platform.OS === 'web') {
                if (confirm('Resetar todas as configurações?')) {
                  resetSettings();
                }
              } else {
                Alert.alert(
                  'Resetar Configurações',
                  'Todas as configurações voltarão ao padrão. Continuar?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Resetar', onPress: resetSettings },
                  ]
                );
              }
            }}
          />
        </SettingsSection>
      </ScrollView>

      <ThemeModal />
      
      <BlockedUsersModal
        visible={blockedUsersModalVisible}
        onClose={() => setBlockedUsersModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemText: {
    marginLeft: 16,
    flex: 1,
  },
  itemTitle: {
    fontWeight: '500',
  },
  itemSubtitle: {
    marginTop: 2,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  themePreview: {
    flexDirection: 'row',
    marginRight: 16,
  },
  themeColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 4,
  },
  themeTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
});