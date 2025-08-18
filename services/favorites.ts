import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FavoriteMessage {
  id: string;
  messageId: string;
  conversationId: string;
  content: string;
  senderName: string;
  timestamp: string;
  messageType: 'text' | 'image' | 'audio' | 'video';
  createdAt: string;
}

class FavoritesService {
  private static readonly FAVORITES_KEY = 'anvic_favorite_messages';

  // Adicionar mensagem aos favoritos
  async addToFavorites(
    messageId: string,
    conversationId: string,
    content: string,
    senderName: string,
    timestamp: string,
    messageType: 'text' | 'image' | 'audio' | 'video' = 'text'
  ): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      
      // Verificar se já está nos favoritos
      if (favorites.some(fav => fav.messageId === messageId)) {
        return;
      }

      const newFavorite: FavoriteMessage = {
        id: `fav_${Date.now()}_${Math.random()}`,
        messageId,
        conversationId,
        content,
        senderName,
        timestamp,
        messageType,
        createdAt: new Date().toISOString(),
      };

      const updatedFavorites = [newFavorite, ...favorites];
      await AsyncStorage.setItem(
        FavoritesService.FAVORITES_KEY,
        JSON.stringify(updatedFavorites)
      );
    } catch (error) {
      console.error('Erro ao adicionar favorito:', error);
      throw error;
    }
  }

  // Remover mensagem dos favoritos
  async removeFromFavorites(messageId: string): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      const updatedFavorites = favorites.filter(fav => fav.messageId !== messageId);
      
      await AsyncStorage.setItem(
        FavoritesService.FAVORITES_KEY,
        JSON.stringify(updatedFavorites)
      );
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
      throw error;
    }
  }

  // Obter todas as mensagens favoritas
  async getFavorites(): Promise<FavoriteMessage[]> {
    try {
      const favoritesData = await AsyncStorage.getItem(FavoritesService.FAVORITES_KEY);
      if (!favoritesData) return [];
      
      return JSON.parse(favoritesData) as FavoriteMessage[];
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
      return [];
    }
  }

  // Verificar se mensagem está nos favoritos
  async isFavorited(messageId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.some(fav => fav.messageId === messageId);
    } catch (error) {
      console.error('Erro ao verificar favorito:', error);
      return false;
    }
  }

  // Buscar favoritos por conversa
  async getFavoritesByConversation(conversationId: string): Promise<FavoriteMessage[]> {
    try {
      const favorites = await this.getFavorites();
      return favorites.filter(fav => fav.conversationId === conversationId);
    } catch (error) {
      console.error('Erro ao buscar favoritos da conversa:', error);
      return [];
    }
  }

  // Buscar favoritos por texto
  async searchFavorites(query: string): Promise<FavoriteMessage[]> {
    try {
      const favorites = await this.getFavorites();
      const searchTerm = query.toLowerCase();
      
      return favorites.filter(fav => 
        fav.content.toLowerCase().includes(searchTerm) ||
        fav.senderName.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('Erro ao buscar favoritos:', error);
      return [];
    }
  }

  // Limpar todos os favoritos
  async clearFavorites(): Promise<void> {
    try {
      await AsyncStorage.removeItem(FavoritesService.FAVORITES_KEY);
    } catch (error) {
      console.error('Erro ao limpar favoritos:', error);
      throw error;
    }
  }

  // Obter estatísticas dos favoritos
  async getFavoritesStats(): Promise<{
    total: number;
    byType: { [key: string]: number };
  }> {
    try {
      const favorites = await this.getFavorites();
      const byType = favorites.reduce((acc, fav) => {
        acc[fav.messageType] = (acc[fav.messageType] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      return {
        total: favorites.length,
        byType,
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return { total: 0, byType: {} };
    }
  }
}

export const favoritesService = new FavoritesService();