import { supabase } from './supabase';
import { AppState, AppStateStatus } from 'react-native';

class PresenceService {
  private userId: string | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private isOnline: boolean = false;

  async initialize(userId: string, isVisible: boolean = true) {
    this.userId = userId;
    
    if (isVisible) {
      await this.setOnline();
      this.startHeartbeat();
    }
    
    // Listen for app state changes
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active' && this.isOnline) {
      this.setOnline();
      this.startHeartbeat();
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      this.setOffline();
      this.stopHeartbeat();
    }
  };

  async setOnline() {
    if (!this.userId) return;
    
    try {
      await supabase
        .from('user_profiles')
        .update({ 
          is_online: true,
          last_seen: new Date().toISOString()
        })
        .eq('id', this.userId);
      
      this.isOnline = true;
    } catch (error) {
      console.log('Erro ao definir status online:', error);
    }
  }

  async setOffline() {
    if (!this.userId) return;
    
    try {
      await supabase
        .from('user_profiles')
        .update({ 
          is_online: false,
          last_seen: new Date().toISOString()
        })
        .eq('id', this.userId);
      
      this.isOnline = false;
    } catch (error) {
      console.log('Erro ao definir status offline:', error);
    }
  }

  private startHeartbeat() {
    if (this.intervalId) return;
    
    // Update online status every 30 seconds
    this.intervalId = setInterval(() => {
      if (this.isOnline) {
        this.updateLastSeen();
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async updateLastSeen() {
    if (!this.userId) return;
    
    try {
      await supabase
        .from('user_profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', this.userId);
    } catch (error) {
      console.log('Erro ao atualizar last_seen:', error);
    }
  }

  async toggleVisibility(isVisible: boolean) {
    if (isVisible) {
      await this.setOnline();
      this.startHeartbeat();
    } else {
      await this.setOffline();
      this.stopHeartbeat();
    }
  }

  cleanup() {
    this.stopHeartbeat();
    AppState.removeEventListener('change', this.handleAppStateChange);
    if (this.userId) {
      this.setOffline();
    }
  }
}

export const presenceService = new PresenceService();