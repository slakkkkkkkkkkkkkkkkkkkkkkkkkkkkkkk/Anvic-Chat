import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';
import { mediaService } from '@/services/media';
import { biometricService } from '@/services/biometric';
import BlockedUsersModal from '@/components/ui/BlockedUsersModal';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, signOut, updateProfile } = useAuth();
  const [blockedUsersModalVisible, setBlockedUsersModalVisible] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    full_name: profile?.full_name || '',
    bio: profile?.bio || '',
    relationship_status: profile?.relationship_status || '',
  });
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState('');
  
  React.useEffect(() => {
    loadBiometricConfig();
  }, []);

  const loadBiometricConfig = async () => {
    const config = await biometricService.getConfig();
    setBiometricEnabled(config.enabled);
    if (config.enabled) {
      const typeDesc = await biometricService.getBiometricTypeDescription();
      setBiometricType(typeDesc);
    }
  };

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
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => setEditingProfile(true)}
          >
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
            icon="block"
            title="Usuários Bloqueados"
            subtitle="Gerenciar usuários bloqueados"
            onPress={() => setBlockedUsersModalVisible(true)}
          />
          
          <ProfileOption
            icon="fingerprint"
            title="Autenticação Biométrica"
            subtitle={biometricEnabled ? `Ativo - ${biometricType}` : 'Desativado'}
            onPress={handleBiometricToggle}
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

      <BlockedUsersModal
        visible={blockedUsersModalVisible}
        onClose={() => setBlockedUsersModalVisible(false)}
      />

      {/* Edit Profile Modal */}
      {editingProfile && (
        <Modal visible={editingProfile} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setEditingProfile(false)}>
                <MaterialIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={handleSaveProfile}>
                <Text style={[styles.headerTitle, { color: Colors.primary, fontSize: 16 }]}>Salvar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.profileSection}>
                <View style={styles.avatarContainer}>
                  <Image
                    source={{ 
                      uri: profile?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
                    }}
                    style={styles.profileImage}
                  />
                  <TouchableOpacity 
                    style={styles.changeAvatarButton}
                    onPress={handleChangeAvatar}
                  >
                    <MaterialIcons name="camera-alt" size={20} color={Colors.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.formContainer}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Nome Completo</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editedProfile.full_name}
                      onChangeText={(text) => setEditedProfile(prev => ({ ...prev, full_name: text }))}
                      placeholder="Seu nome completo"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Bio</Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      value={editedProfile.bio}
                      onChangeText={(text) => setEditedProfile(prev => ({ ...prev, bio: text }))}
                      placeholder="Conte um pouco sobre você..."
                      placeholderTextColor={Colors.textMuted}
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Status de Relacionamento</Text>
                    <View style={styles.relationshipContainer}>
                      {['Solteiro(a)', 'Namorando', 'Casado(a)', 'Complicado', 'Não informar'].map((status) => (
                        <TouchableOpacity
                          key={status}
                          style={[
                            styles.relationshipOption,
                            editedProfile.relationship_status === status && styles.relationshipOptionSelected
                          ]}
                          onPress={() => setEditedProfile(prev => ({ ...prev, relationship_status: status }))}
                        >
                          <Text style={[
                            styles.relationshipOptionText,
                            editedProfile.relationship_status === status && styles.relationshipOptionTextSelected
                          ]}>
                            {status}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );

  const handleChangeAvatar = async () => {
    try {
      const photo = await mediaService.pickImage();
      if (photo && user) {
        // Em uma implementação real, você faria upload para o Supabase Storage
        // Por enquanto, apenas atualizamos localmente
        await updateProfile({ avatar_url: photo.uri });
        showAlert('Sucesso', 'Foto de perfil atualizada!');
      }
    } catch (error) {
      showAlert('Erro', 'Não foi possível alterar a foto de perfil');
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(editedProfile);
      setEditingProfile(false);
      showAlert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error) {
      showAlert('Erro', 'Não foi possível salvar o perfil');
    }
  };

  const handleBiometricToggle = async () => {
    if (biometricEnabled) {
      // Desativar biometria
      const success = await biometricService.configureBiometric(false);
      if (success) {
        setBiometricEnabled(false);
        setBiometricType('');
        showAlert('Biometria Desativada', 'Autenticação biométrica foi desativada');
      }
    } else {
      // Ativar biometria
      const { available, enrolled } = await biometricService.isBiometricAvailable();
      
      if (!available) {
        showAlert('Indisponível', 'Este dispositivo não suporta autenticação biométrica');
        return;
      }
      
      if (!enrolled) {
        showAlert('Não Configurado', 'Configure uma biometria nas configurações do dispositivo primeiro');
        return;
      }

      const success = await biometricService.configureBiometric(true);
      if (success) {
        setBiometricEnabled(true);
        const typeDesc = await biometricService.getBiometricTypeDescription();
        setBiometricType(typeDesc);
        showAlert('Biometria Ativada', `Autenticação por ${typeDesc} foi ativada`);
      } else {
        showAlert('Erro', 'Não foi possível ativar a autenticação biométrica');
      }
    }
  };
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
    marginBottom: 4,
  },
  profileRelationship: {
    color: Colors.primary,
    fontSize: 14,
    marginBottom: 20,
    fontStyle: 'italic',
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
  avatarContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 16,
  },
  changeAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  relationshipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationshipOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  relationshipOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  relationshipOptionText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  relationshipOptionTextSelected: {
    color: Colors.text,
  },
});