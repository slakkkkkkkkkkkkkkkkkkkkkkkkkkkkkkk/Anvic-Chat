import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { chatSearchService, SearchResult, SearchFilters } from '@/services/chat-search';

interface ChatSearchModalProps {
  visible: boolean;
  onClose: () => void;
  conversationId: string;
  userId: string;
  onMessageFound: (messageId: string) => void;
}

export default function ChatSearchModal({
  visible,
  onClose,
  conversationId,
  userId,
  onMessageFound,
}: ChatSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      loadSuggestions();
    } else {
      // Limpar ao fechar
      setSearchQuery('');
      setSearchResults([]);
      setFilters({});
    }
  }, [visible]);

  useEffect(() => {
    // Busca em tempo real
    if (searchQuery.trim()) {
      performSearch();
      loadSuggestions();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, filters]);

  const loadSuggestions = async () => {
    const suggestions = await chatSearchService.getSearchSuggestions(searchQuery, userId);
    setSuggestions(suggestions);
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      const results = await chatSearchService.searchInConversation(
        conversationId,
        searchQuery,
        filters
      );
      setSearchResults(results);
      
      // Salvar no histórico se tiver resultados
      if (results.length > 0) {
        await chatSearchService.saveSearchHistory(searchQuery, userId);
      }
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultPress = (result: SearchResult) => {
    onMessageFound(result.message.id);
    onClose();
  };

  const handleSuggestionPress = (suggestion: string) => {
    setSearchQuery(suggestion);
  };

  const clearFilters = () => {
    setFilters({});
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => handleResultPress(item)}>
      <View style={styles.resultHeader}>
        <Text style={styles.senderName}>
          {item.message.sender?.full_name || item.message.sender?.username || 'Usuário'}
        </Text>
        <Text style={styles.resultDate}>
          {new Date(item.message.created_at).toLocaleDateString('pt-BR')}
        </Text>
      </View>
      <Text style={styles.resultContent} numberOfLines={2}>
        {item.highlightedContent}
      </Text>
      <View style={styles.resultFooter}>
        <MaterialIcons 
          name={getMessageTypeIcon(item.message.message_type)} 
          size={14} 
          color={Colors.textMuted} 
        />
        <Text style={styles.matchType}>{getMatchTypeLabel(item.matchType)}</Text>
      </View>
    </TouchableOpacity>
  );

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return 'image';
      case 'audio': return 'audiotrack';
      case 'video': return 'videocam';
      default: return 'chat';
    }
  };

  const getMatchTypeLabel = (type: string) => {
    switch (type) {
      case 'content': return 'Conteúdo';
      case 'sender': return 'Remetente';
      case 'date': return 'Data';
      default: return 'Resultado';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Buscar no Chat</Text>
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterButton}>
            <MaterialIcons name="filter-list" size={24} color={showFilters ? Colors.primary : Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Barra de Busca */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <MaterialIcons name="search" size={20} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar mensagens..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="clear" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filtros */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                <TouchableOpacity
                  style={[styles.filterChip, filters.messageType === 'text' && styles.activeFilterChip]}
                  onPress={() => setFilters(prev => ({ 
                    ...prev, 
                    messageType: prev.messageType === 'text' ? undefined : 'text' 
                  }))}
                >
                  <MaterialIcons name="chat" size={16} color={Colors.text} />
                  <Text style={styles.filterChipText}>Texto</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterChip, filters.messageType === 'image' && styles.activeFilterChip]}
                  onPress={() => setFilters(prev => ({ 
                    ...prev, 
                    messageType: prev.messageType === 'image' ? undefined : 'image' 
                  }))}
                >
                  <MaterialIcons name="image" size={16} color={Colors.text} />
                  <Text style={styles.filterChipText}>Imagens</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterChip, filters.messageType === 'audio' && styles.activeFilterChip]}
                  onPress={() => setFilters(prev => ({ 
                    ...prev, 
                    messageType: prev.messageType === 'audio' ? undefined : 'audio' 
                  }))}
                >
                  <MaterialIcons name="audiotrack" size={16} color={Colors.text} />
                  <Text style={styles.filterChipText}>Áudios</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterChip, filters.messageType === 'video' && styles.activeFilterChip]}
                  onPress={() => setFilters(prev => ({ 
                    ...prev, 
                    messageType: prev.messageType === 'video' ? undefined : 'video' 
                  }))}
                >
                  <MaterialIcons name="videocam" size={16} color={Colors.text} />
                  <Text style={styles.filterChipText}>Vídeos</Text>
                </TouchableOpacity>

                {Object.keys(filters).length > 0 && (
                  <TouchableOpacity style={styles.clearFiltersChip} onPress={clearFilters}>
                    <MaterialIcons name="clear-all" size={16} color={Colors.error} />
                    <Text style={[styles.filterChipText, { color: Colors.error }]}>Limpar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Conteúdo Principal */}
        <View style={styles.content}>
          {!searchQuery.trim() && suggestions.length > 0 ? (
            /* Sugestões */
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Buscas Recentes</Text>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionPress(suggestion)}
                >
                  <MaterialIcons name="history" size={20} color={Colors.textMuted} />
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : searchResults.length > 0 ? (
            /* Resultados */
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.message.id}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <Text style={styles.resultsHeader}>
                  {searchResults.length} resultado(s) encontrado(s)
                </Text>
              }
            />
          ) : searchQuery.trim() && !loading ? (
            /* Nenhum Resultado */
            <View style={styles.noResultsContainer}>
              <MaterialIcons name="search-off" size={48} color={Colors.textMuted} />
              <Text style={styles.noResultsText}>Nenhum resultado encontrado</Text>
              <Text style={styles.noResultsSubtext}>
                Tente usar outras palavras-chave ou remover filtros
              </Text>
            </View>
          ) : loading ? (
            /* Carregando */
            <View style={styles.loadingContainer}>
              <MaterialIcons name="hourglass-empty" size={48} color={Colors.primary} />
              <Text style={styles.loadingText}>Buscando...</Text>
            </View>
          ) : null}
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
    flex: 1,
    textAlign: 'center',
  },
  filterButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  activeFilterChip: {
    backgroundColor: Colors.primary,
  },
  clearFiltersChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.error,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  filterChipText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  suggestionsContainer: {
    padding: 20,
  },
  suggestionsTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  suggestionText: {
    color: Colors.text,
    fontSize: 16,
  },
  resultsHeader: {
    color: Colors.textSecondary,
    fontSize: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  resultItem: {
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  senderName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  resultDate: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  resultContent: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  resultFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchType: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noResultsText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    color: Colors.text,
    fontSize: 16,
    marginTop: 16,
  },
});