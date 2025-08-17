import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      console.log(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleLogout = () => {
    const confirmLogout = () => {
      signOut();
      router.replace('/auth/login');
    };

    if (Platform.OS === 'web') {
      if (confirm('Tem certeza que deseja sair?')) {
        confirmLogout();
      }
    } else {
      Alert.alert(
        'Sair da Conta',
        'Tem certeza que deseja sair?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sair', style: 'destructive', onPress: confirmLogout },
        ]
      );
    }
  };

  const ProfileOption = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity style={styles.profileOption} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.optionLeft}>
        <MaterialIcons name={icon as any} size={24} color={Colors.primary} />
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>{title}</Text>
          {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showArrow && (
        <MaterialIcons name="chevron-right" size={24} color={Colors.textMuted} />
      )}
    </TouchableOpacity>
  );

  if (!user || !profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Perfil</Text>
        </View>

        <View style={styles.profileSection}>
          <Image
            source={{ 
              uri: profile.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
            }}
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>{profile.full_name || 'Usuário'}</Text>
          <Text style={styles.profileUsername}>@{profile.username}</Text>
          <Text style={styles.profileEmail}>{profile.email}</Text>
          <TouchableOpacity style={styles.editProfileButton}>
            <Text style={styles.editProfileText}>Editar Perfil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.optionsSection}>
          <ProfileOption
            icon="account-circle"
            title="Conta"
            subtitle="Informações pessoais"
            onPress={() => showAlert('Conta', 'Abrindo configurações de conta')}
          />
          
          <ProfileOption
            icon="notifications"
            title="Notificações"
            subtitle="Sons e notificações push"
            onPress={() => showAlert('Notificações', 'Abrindo configurações de notificações')}
          />
          
          <ProfileOption
            icon="security"
            title="Privacidade e Segurança"
            subtitle="Bloqueios e configurações de privacidade"
            onPress={() => showAlert('Privacidade', 'Abrindo configurações de privacidade')}
          />
          
          <ProfileOption
            icon="wallpaper"
            title="Papéis de Parede"
            subtitle="Personalizar chats"
            onPress={() => showAlert('Papéis de Parede', 'Abrindo galeria de papéis de parede')}
          />
          
          <ProfileOption
            icon="storage"
            title="Armazenamento"
            subtitle="Gerenciar arquivos e mídia"
            onPress={() => showAlert('Armazenamento', 'Abrindo configurações de armazenamento')}
          />
          
          <ProfileOption
            icon="help"
            title="Ajuda"
            subtitle="FAQ e suporte"
            onPress={() => showAlert('Ajuda', 'Abrindo central de ajuda')}
          />
          
          <ProfileOption
            icon="info"
            title="Sobre o Anvic"
            subtitle="Versão 1.0.0"
            onPress={() => showAlert('Sobre', 'Anvic - Aplicativo de chat moderno')}
          />
        </View>

        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color={Colors.error} />
            <Text style={styles.logoutText}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profileName: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileUsername: {
    color: Colors.primary,
    fontSize: 16,
    marginBottom: 4,
  },
  profileEmail: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 20,
  },
  editProfileButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editProfileText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  optionsSection: {
    paddingHorizontal: 20,
  },
  profileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    marginLeft: 16,
    flex: 1,
  },
  optionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  optionSubtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 2,
  },
  logoutSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  logoutText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});