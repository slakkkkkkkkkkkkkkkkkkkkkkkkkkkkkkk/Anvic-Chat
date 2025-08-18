import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  address?: string;
}

export interface LocationShare {
  id: string;
  userId: string;
  conversationId: string;
  location: LocationData;
  duration: number; // em minutos, 0 = ilimitado
  startTime: string;
  active: boolean;
}

class LocationService {
  private activeShares: Map<string, NodeJS.Timeout> = new Map();
  private locationWatchers: Map<string, Location.LocationSubscription> = new Map();

  // Solicitar permissões
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      return backgroundStatus === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissões de localização:', error);
      return false;
    }
  }

  // Obter localização atual
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Obter endereço
      const address = await this.reverseGeocode(
        location.coords.latitude,
        location.coords.longitude
      );

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        timestamp: location.timestamp,
        address,
      };
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      return null;
    }
  }

  // Compartilhar localização em tempo real
  async startLocationShare(
    conversationId: string,
    userId: string,
    duration: number = 0
  ): Promise<LocationShare | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const currentLocation = await this.getCurrentLocation();
      if (!currentLocation) return null;

      const shareId = `share_${Date.now()}_${Math.random()}`;
      
      const locationShare: LocationShare = {
        id: shareId,
        userId,
        conversationId,
        location: currentLocation,
        duration,
        startTime: new Date().toISOString(),
        active: true,
      };

      // Salvar compartilhamento
      await this.saveLocationShare(locationShare);

      // Iniciar monitoramento em tempo real
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Atualizar a cada 10 segundos
          distanceInterval: 10, // Ou quando mover 10 metros
        },
        (location) => {
          this.updateLocationShare(shareId, {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || undefined,
            timestamp: location.timestamp,
          });
        }
      );

      this.locationWatchers.set(shareId, subscription);

      // Configurar timeout se tiver duração
      if (duration > 0) {
        const timeout = setTimeout(() => {
          this.stopLocationShare(shareId);
        }, duration * 60 * 1000);

        this.activeShares.set(shareId, timeout);
      }

      return locationShare;
    } catch (error) {
      console.error('Erro ao iniciar compartilhamento:', error);
      return null;
    }
  }

  // Parar compartilhamento de localização
  async stopLocationShare(shareId: string): Promise<void> {
    try {
      // Parar monitoramento
      const watcher = this.locationWatchers.get(shareId);
      if (watcher) {
        watcher.remove();
        this.locationWatchers.delete(shareId);
      }

      // Limpar timeout
      const timeout = this.activeShares.get(shareId);
      if (timeout) {
        clearTimeout(timeout);
        this.activeShares.delete(shareId);
      }

      // Marcar como inativo
      const shares = await this.getLocationShares();
      const updatedShares = shares.map(share =>
        share.id === shareId ? { ...share, active: false } : share
      );
      
      await AsyncStorage.setItem('anvic_location_shares', JSON.stringify(updatedShares));
    } catch (error) {
      console.error('Erro ao parar compartilhamento:', error);
    }
  }

  // Atualizar localização compartilhada
  private async updateLocationShare(shareId: string, location: Partial<LocationData>): Promise<void> {
    try {
      const shares = await this.getLocationShares();
      const updatedShares = shares.map(share => {
        if (share.id === shareId) {
          return {
            ...share,
            location: { ...share.location, ...location },
          };
        }
        return share;
      });
      
      await AsyncStorage.setItem('anvic_location_shares', JSON.stringify(updatedShares));
    } catch (error) {
      console.error('Erro ao atualizar localização:', error);
    }
  }

  // Obter endereço por coordenadas
  private async reverseGeocode(latitude: number, longitude: number): Promise<string | undefined> {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude, longitude });
      
      if (result.length > 0) {
        const location = result[0];
        const parts = [
          location.street,
          location.streetNumber,
          location.district,
          location.city,
          location.region,
        ].filter(Boolean);
        
        return parts.join(', ');
      }
    } catch (error) {
      console.error('Erro no reverse geocoding:', error);
    }
    
    return undefined;
  }

  // Salvar compartilhamento
  private async saveLocationShare(share: LocationShare): Promise<void> {
    try {
      const shares = await this.getLocationShares();
      shares.push(share);
      await AsyncStorage.setItem('anvic_location_shares', JSON.stringify(shares));
    } catch (error) {
      console.error('Erro ao salvar compartilhamento:', error);
    }
  }

  // Obter compartilhamentos
  async getLocationShares(): Promise<LocationShare[]> {
    try {
      const data = await AsyncStorage.getItem('anvic_location_shares');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao carregar compartilhamentos:', error);
      return [];
    }
  }

  // Obter compartilhamentos ativos de uma conversa
  async getActiveSharesForConversation(conversationId: string): Promise<LocationShare[]> {
    const shares = await this.getLocationShares();
    return shares.filter(share => 
      share.conversationId === conversationId && 
      share.active &&
      this.isShareStillActive(share)
    );
  }

  // Verificar se compartilhamento ainda está ativo
  private isShareStillActive(share: LocationShare): boolean {
    if (share.duration === 0) return true; // Ilimitado
    
    const startTime = new Date(share.startTime).getTime();
    const now = Date.now();
    const elapsed = (now - startTime) / (1000 * 60); // minutos
    
    return elapsed < share.duration;
  }

  // Gerar URL do Google Maps
  generateMapUrl(latitude: number, longitude: number): string {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }

  // Calcular distância entre dois pontos
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const locationService = new LocationService();