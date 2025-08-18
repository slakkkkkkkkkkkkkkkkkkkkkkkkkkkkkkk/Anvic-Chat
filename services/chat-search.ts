import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from './types';

export interface SearchResult {
  message: Message;
  matchType: 'content' | 'sender' | 'date';
  preview: string;
  highlightedContent: string;
}

export interface SearchFilters {
  dateFrom?: Date;
  dateTo?: Date;
  messageType?: 'text' | 'image' | 'audio' | 'video' | 'all';
  sender?: string;
}

class ChatSearchService {
  // Busca principal no chat
  async searchInConversation(
    conversationId: string,
    query: string,
    filters?: SearchFilters
  ): Promise<SearchResult[]> {
    try {
      const messages = await this.getConversationMessages(conversationId);
      
      if (!query.trim() && !filters) return [];

      let filteredMessages = messages;

      // Aplicar filtros
      if (filters) {
        filteredMessages = this.applyFilters(messages, filters);
      }

      // Busca por texto
      if (query.trim()) {
        filteredMessages = this.searchByText(filteredMessages, query);
      }

      // Converter para resultados de busca
      return filteredMessages.map(message => ({
        message,
        matchType: this.getMatchType(message, query),
        preview: this.generatePreview(message),
        highlightedContent: this.highlightText(message.content, query),
      }));
    } catch (error) {
      console.error('Erro na busca:', error);
      return [];
    }
  }

  // Busca global em todas as conversas
  async globalSearch(query: string, userId: string): Promise<SearchResult[]> {
    try {
      const allConversations = await this.getAllUserConversations(userId);
      const results: SearchResult[] = [];

      for (const conversationId of allConversations) {
        const conversationResults = await this.searchInConversation(conversationId, query);
        results.push(...conversationResults);
      }

      // Ordenar por relevância
      return this.sortByRelevance(results, query);
    } catch (error) {
      console.error('Erro na busca global:', error);
      return [];
    }
  }

  // Busca por mídia
  async searchMedia(
    conversationId: string,
    mediaType: 'image' | 'audio' | 'video'
  ): Promise<Message[]> {
    try {
      const messages = await this.getConversationMessages(conversationId);
      return messages.filter(msg => msg.message_type === mediaType);
    } catch (error) {
      console.error('Erro na busca de mídia:', error);
      return [];
    }
  }

  // Busca por data
  async searchByDate(
    conversationId: string,
    targetDate: Date
  ): Promise<Message[]> {
    try {
      const messages = await this.getConversationMessages(conversationId);
      const targetDateString = targetDate.toDateString();
      
      return messages.filter(msg => {
        const messageDate = new Date(msg.created_at).toDateString();
        return messageDate === targetDateString;
      });
    } catch (error) {
      console.error('Erro na busca por data:', error);
      return [];
    }
  }

  // Aplicar filtros
  private applyFilters(messages: Message[], filters: SearchFilters): Message[] {
    return messages.filter(message => {
      // Filtro de data
      if (filters.dateFrom || filters.dateTo) {
        const messageDate = new Date(message.created_at);
        
        if (filters.dateFrom && messageDate < filters.dateFrom) return false;
        if (filters.dateTo && messageDate > filters.dateTo) return false;
      }

      // Filtro de tipo
      if (filters.messageType && filters.messageType !== 'all') {
        if (message.message_type !== filters.messageType) return false;
      }

      // Filtro de remetente
      if (filters.sender) {
        const senderName = message.sender?.full_name || message.sender?.username || '';
        if (!senderName.toLowerCase().includes(filters.sender.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }

  // Busca por texto
  private searchByText(messages: Message[], query: string): Message[] {
    const searchTerms = query.toLowerCase().split(' ');
    
    return messages.filter(message => {
      const content = message.content.toLowerCase();
      const senderName = (message.sender?.full_name || message.sender?.username || '').toLowerCase();
      
      return searchTerms.some(term => 
        content.includes(term) || senderName.includes(term)
      );
    });
  }

  // Determinar tipo de match
  private getMatchType(message: Message, query: string): SearchResult['matchType'] {
    const content = message.content.toLowerCase();
    const senderName = (message.sender?.full_name || message.sender?.username || '').toLowerCase();
    const queryLower = query.toLowerCase();

    if (content.includes(queryLower)) return 'content';
    if (senderName.includes(queryLower)) return 'sender';
    return 'date';
  }

  // Gerar preview da mensagem
  private generatePreview(message: Message): string {
    if (message.message_type !== 'text') {
      return `[${message.message_type.toUpperCase()}]`;
    }

    const maxLength = 100;
    if (message.content.length <= maxLength) {
      return message.content;
    }

    return message.content.substring(0, maxLength) + '...';
  }

  // Destacar texto encontrado
  private highlightText(content: string, query: string): string {
    if (!query.trim()) return content;

    const searchTerms = query.split(' ');
    let highlightedContent = content;

    searchTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedContent = highlightedContent.replace(regex, '**$1**');
    });

    return highlightedContent;
  }

  // Ordenar por relevância
  private sortByRelevance(results: SearchResult[], query: string): SearchResult[] {
    return results.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a.message, query);
      const scoreB = this.calculateRelevanceScore(b.message, query);
      
      return scoreB - scoreA;
    });
  }

  // Calcular pontuação de relevância
  private calculateRelevanceScore(message: Message, query: string): number {
    let score = 0;
    const content = message.content.toLowerCase();
    const queryLower = query.toLowerCase();

    // Match exato
    if (content.includes(queryLower)) score += 10;

    // Match de palavras
    const queryWords = queryLower.split(' ');
    queryWords.forEach(word => {
      if (content.includes(word)) score += 5;
    });

    // Mensagens mais recentes têm pontuação maior
    const daysSinceMessage = (Date.now() - new Date(message.created_at).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 10 - daysSinceMessage);

    return score;
  }

  // Histórico de busca
  async saveSearchHistory(query: string, userId: string): Promise<void> {
    try {
      const history = await this.getSearchHistory(userId);
      
      // Remover se já existe
      const filteredHistory = history.filter(item => item.query !== query);
      
      // Adicionar no início
      filteredHistory.unshift({
        query,
        timestamp: new Date().toISOString(),
      });

      // Manter apenas últimas 20 buscas
      const limitedHistory = filteredHistory.slice(0, 20);
      
      await AsyncStorage.setItem(`search_history_${userId}`, JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
    }
  }

  async getSearchHistory(userId: string): Promise<Array<{ query: string; timestamp: string }>> {
    try {
      const data = await AsyncStorage.getItem(`search_history_${userId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      return [];
    }
  }

  // Sugestões de busca
  async getSearchSuggestions(query: string, userId: string): Promise<string[]> {
    try {
      const history = await this.getSearchHistory(userId);
      
      if (!query.trim()) {
        return history.slice(0, 5).map(item => item.query);
      }

      // Filtrar histórico baseado na query atual
      const suggestions = history
        .filter(item => item.query.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5)
        .map(item => item.query);

      return suggestions;
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      return [];
    }
  }

  // Métodos auxiliares para obter dados
  private async getConversationMessages(conversationId: string): Promise<Message[]> {
    // Implementar integração com o serviço de chat
    // Por agora retorna array vazio para evitar erros
    return [];
  }

  private async getAllUserConversations(userId: string): Promise<string[]> {
    // Implementar busca de todas as conversas do usuário
    // Por agora retorna array vazio para evitar erros
    return [];
  }
}

export const chatSearchService = new ChatSearchService();