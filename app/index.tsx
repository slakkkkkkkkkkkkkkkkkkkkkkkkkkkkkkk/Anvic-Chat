import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Logo from '@/components/ui/Logo';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';
import { AnvicDiagnostics, DiagnosticResult } from '@/services/diagnostics';
import { autoFix } from '@/services/autofix';

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [diagnosticProgress, setDiagnosticProgress] = useState(0);
  const [diagnosticMessage, setDiagnosticMessage] = useState('Iniciando Anvic...');
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([]);
  const [systemReady, setSystemReady] = useState(false);

  useEffect(() => {
    if (!loading) {
      runSystemDiagnostic();
    }
  }, [loading]);

  const runSystemDiagnostic = async () => {
    try {
      const diagnostics = new AnvicDiagnostics((progress, message) => {
        setDiagnosticProgress(progress);
        setDiagnosticMessage(message);
      });

      const { results, optimizations, overall_health, auto_fixes_applied } = await diagnostics.runFullDiagnostic();
      
      setDiagnosticResults(results);
      
      // Aplicar correções inteligentes se necessário
      if (overall_health === 'critical' || overall_health === 'warning') {
        setDiagnosticMessage('🤖 IA corrigindo problemas...');
        
        const fixResults = await autoFix.analyzeAndFix(results);
        
        setDiagnosticMessage(`✨ ${fixResults.length} correções aplicadas automaticamente!`);
        
        // Aguardar um momento para mostrar o resultado
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      setDiagnosticMessage('🚀 Sistema otimizado e pronto!');
      setSystemReady(true);
      
      // Navegação após diagnóstico
      setTimeout(() => {
        if (user) {
          router.replace('/(tabs)/chats');
        } else {
          router.replace('/auth/login');
        }
      }, 1000);

    } catch (error) {
      console.error('Erro no diagnóstico:', error);
      setDiagnosticMessage('⚠️ Iniciando em modo básico...');
      
      // Fallback: iniciar normalmente após 2 segundos
      setTimeout(() => {
        if (user) {
          router.replace('/(tabs)/chats');
        } else {
          router.replace('/auth/login');
        }
      }, 2000);
    }
  };

  const getHealthColor = () => {
    const errorCount = diagnosticResults.filter(r => r.status === 'error').length;
    const warningCount = diagnosticResults.filter(r => r.status === 'warning').length;
    
    if (errorCount > 0) return Colors.error;
    if (warningCount > 0) return Colors.warning;
    return Colors.success;
  };

  const getHealthIcon = () => {
    const errorCount = diagnosticResults.filter(r => r.status === 'error').length;
    const warningCount = diagnosticResults.filter(r => r.status === 'warning').length;
    
    if (errorCount > 0) return 'error';
    if (warningCount > 0) return 'warning';
    return 'check-circle';
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Logo size={120} />
      </View>

      <View style={styles.diagnosticContainer}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${diagnosticProgress}%` }]} />
          </View>
          <Text style={styles.progressText}>{diagnosticProgress}%</Text>
        </View>

        <View style={styles.statusContainer}>
          {systemReady ? (
            <View style={styles.healthStatus}>
              <MaterialIcons 
                name={getHealthIcon() as any} 
                size={24} 
                color={getHealthColor()} 
              />
              <Text style={[styles.statusText, { color: getHealthColor() }]}>
                Sistema verificado
              </Text>
            </View>
          ) : (
            <ActivityIndicator color={Colors.primary} size="small" style={styles.spinner} />
          )}
          
          <Text style={styles.diagnosticText}>{diagnosticMessage}</Text>
        </View>

        {diagnosticResults.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Status dos Componentes:</Text>
            {diagnosticResults.slice(0, 4).map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <MaterialIcons 
                  name={result.status === 'healthy' ? 'check' : 
                        result.status === 'warning' ? 'warning' :
                        result.status === 'fixed' ? 'build' : 'error'} 
                  size={16} 
                  color={result.status === 'healthy' ? Colors.success :
                         result.status === 'warning' ? Colors.warning :
                         result.status === 'fixed' ? Colors.primary : Colors.error} 
                />
                <Text style={styles.resultText}>
                  {result.component}: {result.status === 'fixed' ? 'Corrigido' : 
                                      result.status === 'healthy' ? 'OK' :
                                      result.status === 'warning' ? 'Atenção' : 'Erro'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>ANVIC</Text>
        <Text style={styles.versionText}>v1.0.0 • Sistema Inteligente</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
  },
  logoContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diagnosticContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 30,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  healthStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  spinner: {
    marginBottom: 8,
  },
  diagnosticText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  resultsContainer: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  resultsTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  footerText: {
    color: Colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  versionText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
});