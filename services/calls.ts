import { Audio } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CallSession {
  id: string;
  participants: string[];
  type: 'voice' | 'video';
  status: 'calling' | 'active' | 'ended';
  startTime: string;
  endTime?: string;
  duration?: number;
}

export interface CallStats {
  totalCalls: number;
  totalDuration: number;
  averageDuration: number;
  callsToday: number;
}

class CallService {
  private static readonly CALLS_HISTORY_KEY = 'anvic_calls_history';
  private activeCall: CallSession | null = null;
  private recording: Audio.Recording | null = null;

  // Iniciar chamada de voz
  async startVoiceCall(recipientId: string, recipientName: string): Promise<CallSession> {
    try {
      // Configurar áudio para chamada
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
      });

      const callSession: CallSession = {
        id: `call_${Date.now()}_${Math.random()}`,
        participants: [recipientId],
        type: 'voice',
        status: 'calling',
        startTime: new Date().toISOString(),
      };

      this.activeCall = callSession;
      await this.saveCallToHistory(callSession);

      return callSession;
    } catch (error) {
      console.error('Erro ao iniciar chamada de voz:', error);
      throw error;
    }
  }

  // Iniciar chamada de vídeo
  async startVideoCall(recipientId: string, recipientName: string): Promise<CallSession> {
    try {
      // Solicitar permissões de câmera
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permissão de câmera necessária para videochamada');
      }

      const callSession: CallSession = {
        id: `video_call_${Date.now()}_${Math.random()}`,
        participants: [recipientId],
        type: 'video',
        status: 'calling',
        startTime: new Date().toISOString(),
      };

      this.activeCall = callSession;
      await this.saveCallToHistory(callSession);

      return callSession;
    } catch (error) {
      console.error('Erro ao iniciar videochamada:', error);
      throw error;
    }
  }

  // Aceitar chamada
  async acceptCall(callId: string): Promise<void> {
    if (this.activeCall?.id === callId) {
      this.activeCall.status = 'active';
      await this.saveCallToHistory(this.activeCall);
    }
  }

  // Encerrar chamada
  async endCall(callId: string): Promise<void> {
    if (this.activeCall?.id === callId) {
      const endTime = new Date().toISOString();
      const duration = new Date(endTime).getTime() - new Date(this.activeCall.startTime).getTime();

      this.activeCall = {
        ...this.activeCall,
        status: 'ended',
        endTime,
        duration,
      };

      await this.saveCallToHistory(this.activeCall);
      this.activeCall = null;

      // Resetar modo de áudio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
      });
    }
  }

  // Obter chamada ativa
  getActiveCall(): CallSession | null {
    return this.activeCall;
  }

  // Salvar chamada no histórico
  private async saveCallToHistory(call: CallSession): Promise<void> {
    try {
      const historyData = await AsyncStorage.getItem(CallService.CALLS_HISTORY_KEY);
      const history: CallSession[] = historyData ? JSON.parse(historyData) : [];
      
      const existingIndex = history.findIndex(c => c.id === call.id);
      if (existingIndex >= 0) {
        history[existingIndex] = call;
      } else {
        history.unshift(call);
      }

      // Manter apenas últimas 100 chamadas
      const limitedHistory = history.slice(0, 100);
      await AsyncStorage.setItem(CallService.CALLS_HISTORY_KEY, JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Erro ao salvar histórico de chamadas:', error);
    }
  }

  // Obter histórico de chamadas
  async getCallHistory(): Promise<CallSession[]> {
    try {
      const historyData = await AsyncStorage.getItem(CallService.CALLS_HISTORY_KEY);
      return historyData ? JSON.parse(historyData) : [];
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      return [];
    }
  }

  // Obter estatísticas de chamadas
  async getCallStats(): Promise<CallStats> {
    try {
      const history = await this.getCallHistory();
      const today = new Date().toDateString();
      
      return {
        totalCalls: history.length,
        totalDuration: history.reduce((sum, call) => sum + (call.duration || 0), 0),
        averageDuration: history.length > 0 
          ? history.reduce((sum, call) => sum + (call.duration || 0), 0) / history.length 
          : 0,
        callsToday: history.filter(call => 
          new Date(call.startTime).toDateString() === today
        ).length,
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      return { totalCalls: 0, totalDuration: 0, averageDuration: 0, callsToday: 0 };
    }
  }
}

export const callService = new CallService();