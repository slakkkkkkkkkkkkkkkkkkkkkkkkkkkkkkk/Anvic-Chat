import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

export interface MusicSession {
  id: string;
  conversationId: string;
  hostId: string;
  trackInfo: {
    title: string;
    artist: string;
    url: string;
    duration: number;
    thumbnail?: string;
  };
  isPlaying: boolean;
  currentTime: number;
  participants: string[];
  createdAt: string;
}

export interface SyncEvent {
  type: 'play' | 'pause' | 'seek' | 'stop';
  timestamp: number;
  position?: number;
}

class MusicSyncService {
  private currentSession: MusicSession | null = null;
  private sound: Audio.Sound | null = null;
  private syncTimer: NodeJS.Timeout | null = null;

  // Criar sessão de música sincronizada
  async createMusicSession(
    conversationId: string,
    hostId: string,
    trackInfo: MusicSession['trackInfo']
  ): Promise<MusicSession> {
    const session: MusicSession = {
      id: `music_${Date.now()}_${Math.random()}`,
      conversationId,
      hostId,
      trackInfo,
      isPlaying: false,
      currentTime: 0,
      participants: [hostId],
      createdAt: new Date().toISOString(),
    };

    this.currentSession = session;
    await this.saveMusicSession(session);

    return session;
  }

  // Entrar em sessão de música
  async joinMusicSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      const sessions = await this.getMusicSessions();
      const session = sessions.find(s => s.id === sessionId);
      
      if (!session) return false;

      if (!session.participants.includes(userId)) {
        session.participants.push(userId);
        await this.updateMusicSession(session);
      }

      this.currentSession = session;
      return true;
    } catch (error) {
      console.error('Erro ao entrar na sessão:', error);
      return false;
    }
  }

  // Reproduzir música
  async playMusic(): Promise<void> {
    if (!this.currentSession) return;

    try {
      // Carregar áudio se necessário
      if (!this.sound) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: this.currentSession.trackInfo.url },
          { shouldPlay: false }
        );
        this.sound = sound;
      }

      // Reproduzir
      await this.sound.playAsync();
      
      // Atualizar sessão
      this.currentSession.isPlaying = true;
      await this.updateMusicSession(this.currentSession);

      // Iniciar sincronização
      this.startSync();

      // Enviar evento de sincronização
      this.broadcastSyncEvent({
        type: 'play',
        timestamp: Date.now(),
        position: this.currentSession.currentTime,
      });
    } catch (error) {
      console.error('Erro ao reproduzir música:', error);
    }
  }

  // Pausar música
  async pauseMusic(): Promise<void> {
    if (!this.currentSession || !this.sound) return;

    try {
      await this.sound.pauseAsync();
      
      this.currentSession.isPlaying = false;
      await this.updateMusicSession(this.currentSession);

      this.stopSync();

      this.broadcastSyncEvent({
        type: 'pause',
        timestamp: Date.now(),
        position: this.currentSession.currentTime,
      });
    } catch (error) {
      console.error('Erro ao pausar música:', error);
    }
  }

  // Pular para posição específica
  async seekToPosition(position: number): Promise<void> {
    if (!this.currentSession || !this.sound) return;

    try {
      await this.sound.setPositionAsync(position * 1000); // converter para ms
      
      this.currentSession.currentTime = position;
      await this.updateMusicSession(this.currentSession);

      this.broadcastSyncEvent({
        type: 'seek',
        timestamp: Date.now(),
        position,
      });
    } catch (error) {
      console.error('Erro ao pular posição:', error);
    }
  }

  // Parar sessão de música
  async stopMusicSession(): Promise<void> {
    if (!this.currentSession) return;

    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }

      this.stopSync();

      this.broadcastSyncEvent({
        type: 'stop',
        timestamp: Date.now(),
      });

      this.currentSession = null;
    } catch (error) {
      console.error('Erro ao parar sessão:', error);
    }
  }

  // Sincronização automática
  private startSync(): void {
    if (this.syncTimer) return;

    this.syncTimer = setInterval(async () => {
      if (!this.currentSession || !this.sound || !this.currentSession.isPlaying) return;

      try {
        const status = await this.sound.getStatusAsync();
        if (status.isLoaded && 'positionMillis' in status) {
          this.currentSession.currentTime = (status.positionMillis || 0) / 1000;
          await this.updateMusicSession(this.currentSession);
        }
      } catch (error) {
        console.error('Erro na sincronização:', error);
      }
    }, 1000);
  }

  private stopSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  // Processar eventos de sincronização
  async processSyncEvent(event: SyncEvent): Promise<void> {
    if (!this.currentSession || !this.sound) return;

    try {
      switch (event.type) {
        case 'play':
          if (event.position !== undefined) {
            await this.sound.setPositionAsync(event.position * 1000);
          }
          await this.sound.playAsync();
          this.currentSession.isPlaying = true;
          this.startSync();
          break;

        case 'pause':
          await this.sound.pauseAsync();
          this.currentSession.isPlaying = false;
          this.stopSync();
          break;

        case 'seek':
          if (event.position !== undefined) {
            await this.sound.setPositionAsync(event.position * 1000);
            this.currentSession.currentTime = event.position;
          }
          break;

        case 'stop':
          await this.stopMusicSession();
          break;
      }

      await this.updateMusicSession(this.currentSession);
    } catch (error) {
      console.error('Erro ao processar evento:', error);
    }
  }

  // Buscar música (integração futura com APIs)
  async searchMusic(query: string): Promise<MusicSession['trackInfo'][]> {
    // Mock de resultados - integrar com Spotify/YouTube API futuramente
    return [
      {
        title: `${query} - Resultado 1`,
        artist: 'Artista Mock',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        duration: 180,
        thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100',
      },
      {
        title: `${query} - Resultado 2`,
        artist: 'Outro Artista',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        duration: 240,
        thumbnail: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=100',
      },
    ];
  }

  // Gerenciamento de sessões
  private async saveMusicSession(session: MusicSession): Promise<void> {
    try {
      const sessions = await this.getMusicSessions();
      sessions.push(session);
      await AsyncStorage.setItem('anvic_music_sessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Erro ao salvar sessão:', error);
    }
  }

  private async updateMusicSession(session: MusicSession): Promise<void> {
    try {
      const sessions = await this.getMusicSessions();
      const index = sessions.findIndex(s => s.id === session.id);
      if (index >= 0) {
        sessions[index] = session;
        await AsyncStorage.setItem('anvic_music_sessions', JSON.stringify(sessions));
      }
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error);
    }
  }

  private async getMusicSessions(): Promise<MusicSession[]> {
    try {
      const data = await AsyncStorage.getItem('anvic_music_sessions');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
      return [];
    }
  }

  private broadcastSyncEvent(event: SyncEvent): void {
    // Implementar broadcast para outros participantes
    console.log('Broadcasting sync event:', event);
  }

  // Obter sessão atual
  getCurrentSession(): MusicSession | null {
    return this.currentSession;
  }

  // Verificar se é host da sessão
  isHost(userId: string): boolean {
    return this.currentSession?.hostId === userId;
  }

  // Formatação de tempo
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

export const musicSyncService = new MusicSyncService();