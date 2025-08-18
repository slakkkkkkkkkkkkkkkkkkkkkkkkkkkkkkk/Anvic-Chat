import { Platform, DevSettings } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import { useEffect, useRef } from 'react';

export interface ScreenProtectionStatus {
  isActive: boolean;
  isSupported: boolean;
  platform: string;
}

class AnvicScreenProtection {
  private isProtectionActive: boolean = false;
  private listeners: Set<() => void> = new Set();

  // ============== ATIVAÇÃO DA PROTEÇÃO ==============
  async enableScreenProtection(): Promise<ScreenProtectionStatus> {
    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        // Expo Screen Capture protection
        const hasPermissions = await ScreenCapture.requestPermissionsAsync();
        
        if (hasPermissions.status === 'granted') {
          await ScreenCapture.preventScreenCaptureAsync();
          this.isProtectionActive = true;
          
          // Listener para detectar tentativas
          const subscription = ScreenCapture.addScreenshotListener(() => {
            this.handleScreenshotAttempt();
          });

          console.log('[SCREEN PROTECTION] Proteção ativada com sucesso');
          
          return {
            isActive: true,
            isSupported: true,
            platform: Platform.OS
          };
        }
      }

      // Web - proteção limitada
      if (Platform.OS === 'web') {
        this.enableWebProtection();
        this.isProtectionActive = true;
        
        return {
          isActive: true,
          isSupported: false, // Limitado no web
          platform: 'web'
        };
      }

      return {
        isActive: false,
        isSupported: false,
        platform: Platform.OS
      };

    } catch (error) {
      console.error('[SCREEN PROTECTION] Erro ao ativar proteção:', error);
      return {
        isActive: false,
        isSupported: false,
        platform: Platform.OS
      };
    }
  }

  // ============== DESATIVAÇÃO DA PROTEÇÃO ==============
  async disableScreenProtection(): Promise<void> {
    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await ScreenCapture.allowScreenCaptureAsync();
        console.log('[SCREEN PROTECTION] Proteção desativada');
      }

      if (Platform.OS === 'web') {
        this.disableWebProtection();
      }

      this.isProtectionActive = false;
    } catch (error) {
      console.error('[SCREEN PROTECTION] Erro ao desativar proteção:', error);
    }
  }

  // ============== PROTEÇÃO WEB (LIMITADA) ==============
  private enableWebProtection(): void {
    // Bloquear teclas de screenshot
    document.addEventListener('keydown', this.handleKeyDown);
    
    // Bloquear menu de contexto
    document.addEventListener('contextmenu', this.preventContextMenu);
    
    // Detectar DevTools (parcial)
    if (typeof window !== 'undefined') {
      const devtools = {
        open: false,
        orientation: null as string | null
      };

      const threshold = 160;
      setInterval(() => {
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
          if (!devtools.open) {
            devtools.open = true;
            this.handleScreenshotAttempt();
          }
        } else {
          devtools.open = false;
        }
      }, 500);
    }

    // Adicionar overlay de proteção visual
    this.addVisualProtection();
  }

  private disableWebProtection(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('contextmenu', this.preventContextMenu);
    this.removeVisualProtection();
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    // Bloquear Print Screen e combinações de screenshot
    if (e.key === 'PrintScreen' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 'I')) ||
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) ||
        e.key === 'F12') {
      e.preventDefault();
      this.handleScreenshotAttempt();
    }
  };

  private preventContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  // ============== PROTEÇÃO VISUAL ==============
  private addVisualProtection(): void {
    // Adicionar overlay invisível que dificulta screenshots
    const overlay = document.createElement('div');
    overlay.id = 'anvic-screen-protection';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      pointer-events: none;
      z-index: 999999;
      mix-blend-mode: difference;
      opacity: 0.01;
    `;
    
    document.body.appendChild(overlay);

    // CSS para dificultar seleção
    const style = document.createElement('style');
    style.innerHTML = `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      
      body {
        -webkit-app-region: no-drag;
      }
    `;
    
    document.head.appendChild(style);
  }

  private removeVisualProtection(): void {
    const overlay = document.getElementById('anvic-screen-protection');
    if (overlay) {
      overlay.remove();
    }
  }

  // ============== MANIPULAÇÃO DE TENTATIVAS ==============
  private handleScreenshotAttempt(): void {
    console.warn('[SCREEN PROTECTION] Tentativa de screenshot detectada!');
    
    // Notificar todos os listeners
    this.listeners.forEach(callback => callback());

    // Ações de proteção adicional
    if (Platform.OS === 'web') {
      // Adicionar overlay temporário
      this.showWarningOverlay();
    }
  }

  private showWarningOverlay(): void {
    const warning = document.createElement('div');
    warning.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      color: #ff6b6b;
      font-size: 24px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999999;
      text-align: center;
    `;
    warning.innerHTML = '🚫<br/>Screenshot Bloqueado<br/>Modo Privado Ativo';
    
    document.body.appendChild(warning);
    
    setTimeout(() => {
      if (warning.parentNode) {
        warning.parentNode.removeChild(warning);
      }
    }, 2000);
  }

  // ============== LISTENERS E UTILITÁRIOS ==============
  addScreenshotListener(callback: () => void): () => void {
    this.listeners.add(callback);
    
    // Retorna função de cleanup
    return () => {
      this.listeners.delete(callback);
    };
  }

  isProtectionEnabled(): boolean {
    return this.isProtectionActive;
  }

  // Hook personalizado para componentes React
  useScreenProtection(enabled: boolean): ScreenProtectionStatus {
    const statusRef = useRef<ScreenProtectionStatus>({
      isActive: false,
      isSupported: false,
      platform: Platform.OS
    });

    useEffect(() => {
      if (enabled) {
        this.enableScreenProtection().then(status => {
          statusRef.current = status;
        });

        return () => {
          this.disableScreenProtection();
        };
      } else {
        this.disableScreenProtection();
      }
    }, [enabled]);

    return statusRef.current;
  }
}

export const screenProtection = new AnvicScreenProtection();

// Hook para usar em componentes
export function useScreenProtection(enabled: boolean): ScreenProtectionStatus {
  return screenProtection.useScreenProtection(enabled);
}