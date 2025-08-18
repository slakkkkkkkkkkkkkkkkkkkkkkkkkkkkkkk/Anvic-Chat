import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { mediaService, MediaFile } from '@/services/media';

interface AudioRecorderProps {
  onAudioRecorded: (audio: MediaFile) => void;
  enableEncryption?: boolean;
  userId?: string;
  style?: any;
}

export default function AudioRecorder({ 
  onAudioRecorded, 
  enableEncryption = false,
  userId,
  style 
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRecording) {
      // Animação de pulso durante gravação
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      // Timer de gravação
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      return () => {
        pulseAnimation.stop();
        clearInterval(interval);
      };
    } else {
      pulseAnim.setValue(1);
      setRecordingTime(0);
    }
  }, [isRecording, pulseAnim]);

  const startRecording = async () => {
    const success = await mediaService.startAudioRecording();
    if (success) {
      setIsRecording(true);
      setRecordingTime(0);
    }
  };

  const stopRecording = async () => {
    const audioFile = await mediaService.stopAudioRecording(enableEncryption, userId);
    setIsRecording(false);
    setRecordingTime(0);
    
    if (audioFile) {
      onAudioRecorded(audioFile);
    }
  };

  const cancelRecording = async () => {
    await mediaService.cancelRecording();
    setIsRecording(false);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isRecording) {
    return (
      <View style={[styles.recordingContainer, style]}>
        <View style={styles.recordingInfo}>
          <Animated.View style={[styles.recordingDot, { transform: [{ scale: pulseAnim }] }]} />
          <Text style={styles.recordingText}>Gravando...</Text>
          <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>
        </View>
        
        <View style={styles.recordingActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={cancelRecording}
            activeOpacity={0.7}
          >
            <MaterialIcons name="close" size={24} color={Colors.error} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.stopButton}
            onPress={stopRecording}
            activeOpacity={0.7}
          >
            <MaterialIcons name="stop" size={28} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.recordButton, style]}
      onPress={startRecording}
      activeOpacity={0.7}
    >
      <MaterialIcons name="mic" size={24} color={Colors.primary} />
      {enableEncryption && (
        <View style={styles.encryptionIndicator}>
          <MaterialIcons name="lock" size={12} color="#ff6b6b" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  recordButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  encryptionIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ff6b6b20',
    borderRadius: 8,
    padding: 2,
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    marginHorizontal: 8,
  },
  recordingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.error,
    marginRight: 8,
  },
  recordingText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  recordingTime: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  recordingActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    padding: 8,
    marginRight: 8,
  },
  stopButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});