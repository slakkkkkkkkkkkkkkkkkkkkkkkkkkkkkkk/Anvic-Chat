import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { locationService, LocationShare } from '@/services/location';

interface LocationShareModalProps {
  visible: boolean;
  onClose: () => void;
  conversationId: string;
  userId: string;
  onLocationShared: (share: LocationShare) => void;
}

export default function LocationShareModal({
  visible,
  onClose,
  conversationId,
  userId,
  onLocationShared,
}: LocationShareModalProps) {
  const [sharing, setSharing] = useState(false);
  const [duration, setDuration] = useState(60); // minutos
  const [unlimitedShare, setUnlimitedShare] = useState(false);

  const durationOptions = [
    { label: '15 minutos', value: 15 },
    { label: '1 hora', value: 60 },
    { label: '8 horas', value: 480 },
    { label: '24 horas', value: 1440 },
  ];

  const handleStartSharing = async () => {
    setSharing(true);
    
    try {
      const shareDuration = unlimitedShare ? 0 : duration;
      const locationShare = await locationService.startLocationShare(
        conversationId,
        userId,
        shareDuration
      );

      if (locationShare) {
        onLocationShared(locationShare);
        onClose();
      } else {
        console.log('Falha ao compartilhar localização');
      }
    } catch (error) {
      console.error('Erro ao compartilhar localização:', error);
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Compartilhar Localização</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.infoSection}>
            <MaterialIcons name="location-on" size={48} color={Colors.primary} />
            <Text style={styles.infoTitle}>Localização em Tempo Real</Text>
            <Text style={styles.infoText}>
              Compartilhe sua localização atual e permita que outros vejam onde você está em tempo real.
            </Text>
          </View>

          <View style={styles.optionsSection}>
            <Text style={styles.sectionTitle}>Duração do Compartilhamento</Text>
            
            <View style={styles.unlimitedOption}>
              <Text style={styles.optionLabel}>Compartilhamento Ilimitado</Text>
              <Switch
                value={unlimitedShare}
                onValueChange={setUnlimitedShare}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.text}
              />
            </View>

            {!unlimitedShare && (
              <View style={styles.durationOptions}>
                {durationOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.durationOption,
                      duration === option.value && styles.selectedOption
                    ]}
                    onPress={() => setDuration(option.value)}
                  >
                    <MaterialIcons 
                      name={duration === option.value ? "radio-button-checked" : "radio-button-unchecked"} 
                      size={20} 
                      color={duration === option.value ? Colors.primary : Colors.textMuted} 
                    />
                    <Text style={[
                      styles.optionText,
                      duration === option.value && styles.selectedOptionText
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.privacySection}>
            <MaterialIcons name="privacy-tip" size={24} color={Colors.warning} />
            <View style={styles.privacyText}>
              <Text style={styles.privacyTitle}>Privacidade e Segurança</Text>
              <Text style={styles.privacyDescription}>
                • Sua localização será visível apenas para participantes desta conversa
                {'\n'}• Você pode parar o compartilhamento a qualquer momento
                {'\n'}• A localização é atualizada a cada 10 segundos ou 10 metros
                {'\n'}• Nenhum dado de localização é armazenado permanentemente
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.shareButton, sharing && styles.shareButtonDisabled]}
            onPress={handleStartSharing}
            disabled={sharing}
          >
            {sharing ? (
              <MaterialIcons name="hourglass-empty" size={20} color={Colors.text} />
            ) : (
              <MaterialIcons name="location-on" size={20} color={Colors.text} />
            )}
            <Text style={styles.shareButtonText}>
              {sharing ? 'Iniciando...' : 'Compartilhar Localização'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  infoTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  infoText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  optionsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  unlimitedOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  optionLabel: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  durationOptions: {
    gap: 8,
  },
  durationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '20',
  },
  optionText: {
    color: Colors.text,
    fontSize: 16,
    marginLeft: 12,
  },
  selectedOptionText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  privacySection: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  privacyText: {
    flex: 1,
    marginLeft: 12,
  },
  privacyTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  privacyDescription: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  actions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonDisabled: {
    opacity: 0.6,
  },
  shareButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});