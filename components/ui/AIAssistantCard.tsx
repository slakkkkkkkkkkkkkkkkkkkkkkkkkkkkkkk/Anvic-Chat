import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { AIResponse } from '@/services/ai-assistant';

interface AIAssistantCardProps {
  response: AIResponse;
  onLearnSlang?: (term: string, meaning: string) => void;
  style?: any;
}

export default function AIAssistantCard({ 
  response, 
  onLearnSlang,
  style 
}: AIAssistantCardProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const getCardIcon = () => {
    switch (response.type) {
      case 'task':
        return 'check-circle';
      case 'reminder':
        return 'schedule';
      case 'summary':
        return 'summarize';
      case 'learning':
        return 'school';
      default:
        return 'smart-toy';
    }
  };

  const getCardColor = () => {
    switch (response.type) {
      case 'task':
        return Colors.success;
      case 'reminder':
        return Colors.warning;
      case 'summary':
        return Colors.primary;
      case 'learning':
        return '#FF6B6B';
      default:
        return Colors.primary;
    }
  };

  const getConfidenceColor = () => {
    if (response.confidence >= 0.8) return Colors.success;
    if (response.confidence >= 0.6) return Colors.warning;
    return Colors.error;
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        { opacity: fadeAnim, borderLeftColor: getCardColor() },
        style
      ]}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <MaterialIcons 
            name={getCardIcon() as any} 
            size={20} 
            color={getCardColor()} 
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.aiLabel}>🤖 Anvic AI</Text>
          <View style={styles.confidenceContainer}>
            <View 
              style={[
                styles.confidenceDot, 
                { backgroundColor: getConfidenceColor() }
              ]} 
            />
            <Text style={styles.confidenceText}>
              {Math.round(response.confidence * 100)}% confiança
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={() => setShowDetails(!showDetails)}
        >
          <MaterialIcons 
            name={showDetails ? 'expand-less' : 'expand-more'} 
            size={20} 
            color={Colors.textMuted} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.responseText}>{response.message}</Text>
        
        {response.type === 'learning' && response.message.includes('Não conheço') && (
          <View style={styles.learningActions}>
            <TouchableOpacity 
              style={styles.teachButton}
              onPress={() => {
                // Implementar modal para ensinar gíria
                console.log('Ensinar gíria');
              }}
            >
              <MaterialIcons name="school" size={16} color={Colors.text} />
              <Text style={styles.teachButtonText}>Ensinar Anvic AI</Text>
            </TouchableOpacity>
          </View>
        )}

        {showDetails && (
          <View style={styles.details}>
            <Text style={styles.detailsTitle}>Detalhes Técnicos:</Text>
            <Text style={styles.detailsText}>
              • Tipo: {response.type}
              • Confiança: {response.confidence.toFixed(2)}
              {response.metadata && (
                <>
                  {'\n'}• Metadados: {JSON.stringify(response.metadata, null, 2)}
                </>
              )}
            </Text>
          </View>
        )}
      </View>

      {response.type === 'task' && response.metadata?.tasks && (
        <View style={styles.taskList}>
          {response.metadata.tasks.map((task: string, index: number) => (
            <View key={index} style={styles.taskItem}>
              <MaterialIcons name="radio-button-unchecked" size={16} color={Colors.textMuted} />
              <Text style={styles.taskText}>{task}</Text>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  aiLabel: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  confidenceText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  detailsButton: {
    padding: 4,
  },
  content: {
    marginTop: 8,
  },
  responseText: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  learningActions: {
    marginTop: 12,
    flexDirection: 'row',
  },
  teachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  teachButtonText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  details: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  detailsTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailsText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  taskList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskText: {
    color: Colors.text,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
});