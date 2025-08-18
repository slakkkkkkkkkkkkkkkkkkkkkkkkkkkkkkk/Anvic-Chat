import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface ScheduleMessageModalProps {
  visible: boolean;
  onClose: () => void;
  onSchedule: (message: string, date: Date) => void;
  initialMessage?: string;
}

export default function ScheduleMessageModal({
  visible,
  onClose,
  onSchedule,
  initialMessage = '',
}: ScheduleMessageModalProps) {
  const [message, setMessage] = useState(initialMessage);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleSchedule = () => {
    if (!message.trim()) return;

    // Combinar data e hora
    const scheduledDateTime = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      selectedTime.getHours(),
      selectedTime.getMinutes()
    );

    // Verificar se a data é no futuro
    if (scheduledDateTime <= new Date()) {
      alert('A data/hora deve ser no futuro');
      return;
    }

    onSchedule(message, scheduledDateTime);
    setMessage('');
    onClose();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getQuickDateOption = (label: string, date: Date) => (
    <TouchableOpacity
      style={styles.quickOption}
      onPress={() => setSelectedDate(date)}
    >
      <Text style={styles.quickOptionText}>{label}</Text>
    </TouchableOpacity>
  );

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Agendar Mensagem</Text>
          <TouchableOpacity 
            onPress={handleSchedule}
            style={[styles.scheduleButton, !message.trim() && styles.scheduleButtonDisabled]}
            disabled={!message.trim()}
          >
            <Text style={[styles.scheduleButtonText, !message.trim() && styles.scheduleButtonTextDisabled]}>
              Agendar
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.messageSection}>
            <Text style={styles.sectionTitle}>Mensagem</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Digite sua mensagem..."
              placeholderTextColor={Colors.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              maxLength={1000}
            />
            <Text style={styles.characterCount}>
              {message.length}/1000 caracteres
            </Text>
          </View>

          <View style={styles.dateTimeSection}>
            <Text style={styles.sectionTitle}>Data e Hora</Text>
            
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <MaterialIcons name="calendar-today" size={20} color={Colors.primary} />
                <Text style={styles.dateTimeText}>{formatDate(selectedDate)}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <MaterialIcons name="access-time" size={20} color={Colors.primary} />
                <Text style={styles.dateTimeText}>{formatTime(selectedTime)}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.quickOptionsContainer}>
              <Text style={styles.quickOptionsTitle}>Opções Rápidas:</Text>
              <View style={styles.quickOptions}>
                {getQuickDateOption('Amanhã', tomorrow)}
                {getQuickDateOption('Próxima Semana', nextWeek)}
              </View>
            </View>
          </View>

          <View style={styles.previewSection}>
            <Text style={styles.sectionTitle}>Resumo</Text>
            <View style={styles.preview}>
              <Text style={styles.previewLabel}>Será enviado em:</Text>
              <Text style={styles.previewDateTime}>
                {formatDate(selectedDate)} às {formatTime(selectedTime)}
              </Text>
              <Text style={styles.previewMessage} numberOfLines={3}>
                "{message || 'Digite uma mensagem...'}"
              </Text>
            </View>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={new Date()}
            onChange={(event, date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (date) setSelectedDate(date);
            }}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, time) => {
              setShowTimePicker(Platform.OS === 'ios');
              if (time) setSelectedTime(time);
            }}
          />
        )}
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
  scheduleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.primary,
  },
  scheduleButtonDisabled: {
    backgroundColor: Colors.surface,
  },
  scheduleButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  scheduleButtonTextDisabled: {
    color: Colors.textMuted,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  messageSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  messageInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    color: Colors.text,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  characterCount: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  dateTimeSection: {
    marginBottom: 30,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateTimeText: {
    color: Colors.text,
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '500',
  },
  quickOptionsContainer: {
    marginTop: 16,
  },
  quickOptionsTitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  quickOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickOption: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  quickOptionText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  previewSection: {
    marginBottom: 20,
  },
  preview: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  previewLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  previewDateTime: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  previewMessage: {
    color: Colors.text,
    fontSize: 14,
    fontStyle: 'italic',
  },
});