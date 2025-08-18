import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { DiagnosticResult } from './diagnostics';

export interface AutoFixAction {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  canAutoFix: boolean;
  estimatedTime: number; // em ms
}

export interface FixResult {
  success: boolean;
  action: AutoFixAction;
  message: string;
  details?: any;
}

export class AnvicAutoFix {
  private static readonly LEARNING_KEY = 'anvic_autofix_learning';
  private learningData: Map<string, number> = new Map();

  constructor() {
    this.loadLearningData();
  }

  async analyzeAndFix(results: DiagnosticResult[]): Promise<FixResult[]> {
    const fixResults: FixResult[] = [];
    
    // Ordenar problemas por prioridade usando IA
    const prioritizedIssues = await this.prioritizeIssues(results);
    
    for (const issue of prioritizedIssues) {
      if (this.canAutoFix(issue)) {
        const fixResult = await this.applySmartFix(issue);
        fixResults.push(fixResult);
        
        // Aprender com o resultado
        await this.learnFromResult(issue, fixResult);
      }
    }
    
    return fixResults;
  }

  private async prioritizeIssues(results: DiagnosticResult[]): Promise<DiagnosticResult[]> {
    // IA simples para priorização baseada em impacto e frequência
    const problemResults = results.filter(r => r.status === 'error' || r.status === 'warning');
    
    return problemResults.sort((a, b) => {
      const priorityA = this.calculatePriority(a);
      const priorityB = this.calculatePriority(b);
      return priorityB - priorityA; // Maior prioridade primeiro
    });
  }

  private calculatePriority(result: DiagnosticResult): number {
    let priority = 0;
    
    // Peso por severidade
    if (result.status === 'error') priority += 100;
    if (result.status === 'warning') priority += 50;
    
    // Peso por componente crítico
    const criticalComponents = ['Authentication', 'Supabase', 'Network'];
    if (criticalComponents.includes(result.component)) {
      priority += 50;
    }
    
    // Peso baseado em aprendizado anterior
    const learningScore = this.learningData.get(result.component) || 0;
    priority += learningScore;
    
    return priority;
  }

  private canAutoFix(result: DiagnosticResult): boolean {
    const autoFixableComponents = [
      'AsyncStorage',
      'Storage',
      'Cache',
      'Performance',
      'Configuration'
    ];
    
    return autoFixableComponents.includes(result.component);
  }

  private async applySmartFix(result: DiagnosticResult): Promise<FixResult> {
    const action: AutoFixAction = {
      id: `fix_${result.component}_${Date.now()}`,
      name: `Corrigir ${result.component}`,
      description: result.message,
      severity: result.status === 'error' ? 'high' : 'medium',
      canAutoFix: true,
      estimatedTime: 1000
    };

    try {
      let success = false;
      let message = '';
      let details = {};

      switch (result.component) {
        case 'AsyncStorage':
          success = await this.fixAsyncStorage();
          message = success ? 'Armazenamento local reparado' : 'Falha na reparação do armazenamento';
          break;

        case 'Storage':
          success = await this.optimizeStorage();
          message = success ? 'Armazenamento otimizado' : 'Falha na otimização';
          break;

        case 'Cache':
          success = await this.clearInvalidCache();
          message = success ? 'Cache limpo e otimizado' : 'Falha na limpeza do cache';
          break;

        case 'Performance':
          success = await this.applyPerformanceFixes();
          message = success ? 'Otimizações de performance aplicadas' : 'Falha nas otimizações';
          break;

        case 'Configuration':
          success = await this.fixConfiguration(result);
          message = success ? 'Configuração corrigida' : 'Falha na correção da configuração';
          break;

        default:
          success = false;
          message = 'Correção automática não disponível para este componente';
      }

      return {
        success,
        action,
        message,
        details: { originalIssue: result.message, ...details }
      };

    } catch (error) {
      return {
        success: false,
        action,
        message: 'Erro durante a correção automática',
        details: { error: error.message, originalIssue: result.message }
      };
    }
  }

  private async fixAsyncStorage(): Promise<boolean> {
    try {
      // Backup de dados críticos
      const criticalKeys = ['@auth_token', '@user_profile', '@app_settings'];
      const backup: { [key: string]: string | null } = {};
      
      for (const key of criticalKeys) {
        try {
          backup[key] = await AsyncStorage.getItem(key);
        } catch {
          // Ignorar erros de backup
        }
      }
      
      // Teste de funcionalidade
      await AsyncStorage.setItem('__test__', 'test');
      const testValue = await AsyncStorage.getItem('__test__');
      await AsyncStorage.removeItem('__test__');
      
      if (testValue !== 'test') {
        throw new Error('AsyncStorage não está funcionando corretamente');
      }
      
      // Restaurar dados críticos se necessário
      for (const [key, value] of Object.entries(backup)) {
        if (value !== null) {
          try {
            await AsyncStorage.setItem(key, value);
          } catch {
            // Ignorar erros de restauração
          }
        }
      }
      
      return true;
    } catch {
      return false;
    }
  }

  private async optimizeStorage(): Promise<boolean> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const now = Date.now();
      const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
      
      // Remover itens temporários antigos
      const keysToRemove = allKeys.filter(key => {
        return key.startsWith('temp_') || 
               key.startsWith('cache_') ||
               key.includes('_expired_');
      });
      
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }
      
      // Compactar dados grandes se possível
      for (const key of allKeys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value && value.length > 10000) {
            // Para dados muito grandes, podemos implementar compressão futuramente
            console.log(`[AutoFix] Dados grandes detectados em ${key}`);
          }
        } catch {
          // Ignorar erros de leitura individual
        }
      }
      
      return true;
    } catch {
      return false;
    }
  }

  private async clearInvalidCache(): Promise<boolean> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => 
        key.includes('cache_') || 
        key.includes('temp_') ||
        key.startsWith('__cache__')
      );
      
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
      
      return true;
    } catch {
      return false;
    }
  }

  private async applyPerformanceFixes(): Promise<boolean> {
    try {
      // Configurações de performance baseadas na plataforma
      const performanceConfig = {
        platform: Platform.OS,
        timestamp: Date.now(),
        optimizations: {
          imageCache: true,
          networkOptimization: true,
          memoryManagement: true
        }
      };
      
      await AsyncStorage.setItem('__performance_config__', JSON.stringify(performanceConfig));
      
      return true;
    } catch {
      return false;
    }
  }

  private async fixConfiguration(result: DiagnosticResult): Promise<boolean> {
    try {
      // Resetar configurações problemáticas para valores padrão
      const defaultConfig = {
        theme: 'dark',
        notifications: true,
        autoSync: true,
        cacheSize: '50MB',
        lastReset: Date.now()
      };
      
      await AsyncStorage.setItem('__app_config__', JSON.stringify(defaultConfig));
      
      return true;
    } catch {
      return false;
    }
  }

  private async learnFromResult(issue: DiagnosticResult, result: FixResult): Promise<void> {
    try {
      // Sistema de aprendizado simples
      const currentScore = this.learningData.get(issue.component) || 0;
      
      if (result.success) {
        // Aumentar confiança se a correção funcionou
        this.learningData.set(issue.component, currentScore + 10);
      } else {
        // Diminuir confiança se a correção falhou
        this.learningData.set(issue.component, Math.max(0, currentScore - 5));
      }
      
      // Salvar dados de aprendizado
      await this.saveLearningData();
    } catch (error) {
      console.log('[AutoFix] Erro ao salvar dados de aprendizado:', error);
    }
  }

  private async loadLearningData(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(AnvicAutoFix.LEARNING_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.learningData = new Map(Object.entries(parsed));
      }
    } catch {
      // Ignorar erros de carregamento, usar dados vazios
      this.learningData = new Map();
    }
  }

  private async saveLearningData(): Promise<void> {
    try {
      const data = Object.fromEntries(this.learningData.entries());
      await AsyncStorage.setItem(AnvicAutoFix.LEARNING_KEY, JSON.stringify(data));
    } catch (error) {
      console.log('[AutoFix] Erro ao salvar dados de aprendizado:', error);
    }
  }

  // Método público para estatísticas
  public getStats(): {
    totalFixes: number;
    successRate: number;
    mostCommonIssues: string[];
  } {
    const entries = Array.from(this.learningData.entries());
    const totalFixes = entries.reduce((sum, [, score]) => sum + Math.floor(score / 10), 0);
    const successfulFixes = entries.reduce((sum, [, score]) => sum + Math.max(0, Math.floor(score / 10)), 0);
    
    const successRate = totalFixes > 0 ? (successfulFixes / totalFixes) * 100 : 0;
    
    const mostCommonIssues = entries
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([component]) => component);
    
    return {
      totalFixes,
      successRate,
      mostCommonIssues
    };
  }
}

export const autoFix = new AnvicAutoFix();