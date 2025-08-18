import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
import { musicSyncService, MusicSession } from '@/services/music-sync';

interface MusicPlayerModalProps {
  visible: boolean;
  onClose: () => void;
  conversationId: string;
  userId: string;
}

export default function MusicPlayerModal({
  visible,
  onClose,
  conversationId,
  userId,
}: MusicPlayerModalProps) {
  const [currentSession, setCurrentSession] = useState<MusicSession | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MusicSession['trackInfo'][]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    // Atualizar sessão atual
    const session = musicSyncService.getCurrentSession();
    setCurrentSession(session);

    // Timer para atualizar posição
    const timer = setInterval(() => {
      const session = musicSyncService.getCurrentSession();
      if (session) {
        setCurrentSession(session);
        setCurrentTime(session.currentTime);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [visible]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await musicSyncService.searchMusic(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectTrack = async (track: MusicSession['trackInfo']) => {
    try {
      const session = await musicSyncService.createMusicSession(
        conversationId,
        userId,
        track
      );
      setCurrentSession(session);
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
    }
  };

  const handlePlay = () => {
    musicSyncService.playMusic();
  };

  const handlePause = () => {
    musicSyncService.pauseMusic();
  };

  const handleSeek = (position: number) => {
    musicSyncService.seekToPosition(position);
  };

  const handleStop = () => {
    musicSyncService.stopMusicSession();
    setCurrentSession(null);
  };

  const formatTime = (seconds: number) => {
    return musicSyncService.formatTime(seconds);
  };

  const isHost = currentSession ? musicSyncService.isHost(userId) : false;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Música Sincronizada</Text>
          {currentSession && isHost && (
            <TouchableOpacity onPress={handleStop} style={styles.stopButton}>
              <MaterialIcons name="stop" size={24} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {!currentSession ? (
            <>
              {/* Busca de Música */}
              <View style={styles.searchSection}>
                <Text style={styles.sectionTitle}>Buscar Música</Text>
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Digite o nome da música ou artista..."
                    placeholderTextColor={Colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                  />
                  <TouchableOpacity
                    style={styles.searchButton}
                    onPress={handleSearch}
                    disabled={isSearching}
                  >
                    <MaterialIcons 
                      name={isSearching ? "hourglass-empty" : "search"} 
                      size={20} 
                      color={Colors.text} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Resultados da Busca */}
              {searchResults.length > 0 && (
                <View style={styles.resultsSection}>
                  <Text style={styles.sectionTitle}>Resultados</Text>
                  {searchResults.map((track, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.trackItem}
                      onPress={() => handleSelectTrack(track)}
                    >
                      <Image
                        source={{ uri: track.thumbnail || 'https://via.placeholder.com/50' }}
                        style={styles.trackThumbnail}
                      />
                      <View style={styles.trackInfo}>
                        <Text style={styles.trackTitle}>{track.title}</Text>
                        <Text style={styles.trackArtist}>{track.artist}</Text>
                        <Text style={styles.trackDuration}>
                          {formatTime(track.duration)}
                        </Text>
                      </View>
                      <MaterialIcons name="play-arrow" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Instruções */}
              <View style={styles.instructionsSection}>
                <MaterialIcons name="music-note" size={48} color={Colors.primary} />
                <Text style={styles.instructionsTitle}>Ouvir Música Juntos</Text>
                <Text style={styles.instructionsText}>
                  Busque uma música e todos na conversa poderão ouvir sincronizadamente!
                </Text>
                <View style={styles.featuresList}>
                  <Text style={styles.featureItem}>• Reprodução sincronizada</Text>
                  <Text style={styles.featureItem}>• Controle compartilhado</Text>
                  <Text style={styles.featureItem}>• Chat durante a música</Text>
                </View>
              </View>
            </>
          ) : (
            /* Player de Música */
            <View style={styles.playerSection}>
              <View style={styles.albumArt}>
                <Image
                  source={{ uri: currentSession.trackInfo.thumbnail || 'https://via.placeholder.com/200' }}
                  style={styles.albumImage}
                />
              </View>

              <View style={styles.trackDetails}>
                <Text style={styles.currentTrackTitle}>{currentSession.trackInfo.title}</Text>
                <Text style={styles.currentTrackArtist}>{currentSession.trackInfo.artist}</Text>
              </View>

              <View style={styles.progressSection}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${(currentTime / currentSession.trackInfo.duration) * 100}%` 
                      }
                    ]} 
                  />
                </View>
                <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                  <Text style={styles.timeText}>{formatTime(currentSession.trackInfo.duration)}</Text>
                </View>
              </View>

              <View style={styles.playerControls}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => handleSeek(Math.max(0, currentTime - 15))}
                  disabled={!isHost}
                >
                  <MaterialIcons name="replay-15" size={24} color={isHost ? Colors.text : Colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.playButton, !isHost && styles.disabledButton]}
                  onPress={currentSession.isPlaying ? handlePause : handlePlay}
                  disabled={!isHost}
                >
                  <MaterialIcons 
                    name={currentSession.isPlaying ? "pause" : "play-arrow"} 
                    size={32} 
                    color={Colors.text} 
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => handleSeek(Math.min(currentSession.trackInfo.duration, currentTime + 15))}
                  disabled={!isHost}
                >
                  <MaterialIcons name="forward-15" size={24} color={isHost ? Colors.text : Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.participantsSection}>
                <Text style={styles.participantsTitle}>
                  Ouvindo juntos ({currentSession.participants.length})
                </Text>
                <View style={styles.hostIndicator}>
                  <MaterialIcons name="headset" size={16} color={Colors.primary} />
                  <Text style={styles.hostText}>
                    {isHost ? 'Você controla a música' : 'Música controlada pelo host'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
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
    flex: 1,
    textAlign: 'center',
  },
  stopButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  searchSection: {
    padding: 20,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 12,
  },
  resultsSection: {
    padding: 20,
    paddingTop: 0,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  trackThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  trackArtist: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  trackDuration: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  instructionsSection: {
    alignItems: 'center',
    padding: 40,
  },
  instructionsTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  instructionsText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  featuresList: {
    alignSelf: 'stretch',
  },
  featureItem: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  playerSection: {
    padding: 20,
    alignItems: 'center',
  },
  albumArt: {
    marginBottom: 24,
  },
  albumImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  trackDetails: {
    alignItems: 'center',
    marginBottom: 24,
  },
  currentTrackTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  currentTrackArtist: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  progressSection: {
    width: '100%',
    marginBottom: 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.surface,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 24,
  },
  controlButton: {
    padding: 12,
  },
  playButton: {
    backgroundColor: Colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  participantsSection: {
    alignItems: 'center',
  },
  participantsTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  hostIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hostText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
});