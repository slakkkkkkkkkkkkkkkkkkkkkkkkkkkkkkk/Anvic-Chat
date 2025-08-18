import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
import { callService, CallSession } from '@/services/calls';

interface CallInterfaceProps {
  visible: boolean;
  onClose: () => void;
  callSession: CallSession | null;
  userAvatar?: string;
  userName?: string;
  isIncoming?: boolean;
}

export default function CallInterface({
  visible,
  onClose,
  callSession,
  userAvatar,
  userName = 'Usuário',
  isIncoming = false,
}: CallInterfaceProps) {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (callSession?.status === 'active') {
      // Iniciar contador de duração
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      // Animação de pulso para chamada ativa
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => {
        clearInterval(interval);
        pulseAnimation.stop();
      };
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callSession?.status, pulseAnim]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAcceptCall = async () => {
    if (callSession) {
      await callService.acceptCall(callSession.id);
      setCallDuration(0);
    }
  };

  const handleEndCall = async () => {
    if (callSession) {
      await callService.endCall(callSession.id);
      onClose();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  if (!visible || !callSession) return null;

  const isVideoCall = callSession.type === 'video';
  const isActive = callSession.status === 'active';
  const isCalling = callSession.status === 'calling';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.container, isVideoCall && styles.videoContainer]}>
        {/* Header com informações da chamada */}
        <View style={styles.header}>
          <Text style={styles.callType}>
            {isVideoCall ? 'Videochamada' : 'Chamada de Voz'}
          </Text>
          <Text style={styles.callStatus}>
            {isActive ? formatDuration(callDuration) : 
             isCalling ? (isIncoming ? 'Chamada recebida' : 'Chamando...') : 
             'Conectando...'}
          </Text>
        </View>

        {/* Avatar e nome do usuário */}
        <View style={styles.userInfo}>
          <Animated.View style={[styles.avatarContainer, { transform: [{ scale: pulseAnim }] }]}>
            <Image
              source={{ 
                uri: userAvatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face'
              }}
              style={styles.avatar}
            />
            {isActive && (
              <View style={styles.activeIndicator}>
                <MaterialIcons name="call" size={20} color={Colors.success} />
              </View>
            )}
          </Animated.View>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.callStatusSubtitle}>
            {isActive ? 'Conectado' : 
             isCalling ? (isIncoming ? 'Quer falar com você' : 'Aguardando resposta...') : 
             'Conectando...'}
          </Text>
        </View>

        {/* Controles da chamada */}
        <View style={styles.controls}>
          {isActive && (
            <View style={styles.activeControls}>
              <TouchableOpacity
                style={[styles.controlButton, isMuted && styles.controlButtonActive]}
                onPress={toggleMute}
              >
                <MaterialIcons 
                  name={isMuted ? 'mic-off' : 'mic'} 
                  size={24} 
                  color={isMuted ? Colors.error : Colors.text} 
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}
                onPress={toggleSpeaker}
              >
                <MaterialIcons 
                  name={isSpeakerOn ? 'volume-up' : 'volume-down'} 
                  size={24} 
                  color={isSpeakerOn ? Colors.primary : Colors.text} 
                />
              </TouchableOpacity>

              {isVideoCall && (
                <TouchableOpacity style={styles.controlButton}>
                  <MaterialIcons name="videocam" size={24} color={Colors.text} />
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.mainControls}>
            {isCalling && isIncoming && (
              <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptCall}>
                <MaterialIcons name="call" size={32} color={Colors.text} />
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
              <MaterialIcons name="call-end" size={32} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Área de vídeo (para videochamadas) */}
        {isVideoCall && (
          <View style={styles.videoArea}>
            <View style={styles.remoteVideo}>
              <Text style={styles.videoPlaceholder}>Vídeo do {userName}</Text>
            </View>
            <View style={styles.localVideo}>
              <Text style={styles.videoPlaceholder}>Seu vídeo</Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
  },
  videoContainer: {
    backgroundColor: '#000000',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  callType: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  callStatus: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  userInfo: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  userName: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  callStatusSubtitle: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  controls: {
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  activeControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
  },
  controlButton: {
    backgroundColor: Colors.surface,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonActive: {
    backgroundColor: Colors.primary,
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 60,
  },
  acceptButton: {
    backgroundColor: Colors.success,
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endCallButton: {
    backgroundColor: Colors.error,
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  remoteVideo: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  localVideo: {
    position: 'absolute',
    top: 100,
    right: 20,
    width: 120,
    height: 160,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlaceholder: {
    color: Colors.textMuted,
    fontSize: 14,
  },
});