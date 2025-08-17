import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';

interface Call {
  id: string;
  name: string;
  type: 'incoming' | 'outgoing' | 'missed';
  callType: 'voice' | 'video';
  timestamp: string;
  avatar: string;
}

const mockCalls: Call[] = [
  {
    id: '1',
    name: 'Ana Silva',
    type: 'outgoing',
    callType: 'video',
    timestamp: '14:30',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612db96?w=100&h=100&fit=crop&crop=face',
  },
  {
    id: '2',
    name: 'João Santos',
    type: 'missed',
    callType: 'voice',
    timestamp: '13:45',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  },
  {
    id: '3',
    name: 'Maria Costa',
    type: 'incoming',
    callType: 'voice',
    timestamp: '12:20',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
  },
];

export default function CallsScreen() {
  const getCallIcon = (type: string, callType: string) => {
    if (type === 'missed') {
      return { name: 'call-received', color: Colors.error };
    }
    if (type === 'outgoing') {
      return { name: 'call-made', color: Colors.success };
    }
    return { name: 'call-received', color: Colors.success };
  };

  const renderCallItem = ({ item }: { item: Call }) => {
    const callIcon = getCallIcon(item.type, item.callType);
    
    return (
      <TouchableOpacity style={styles.callItem} activeOpacity={0.7}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        
        <View style={styles.callContent}>
          <View style={styles.callHeader}>
            <Text style={styles.callName}>{item.name}</Text>
            <TouchableOpacity style={styles.callButton}>
              <MaterialIcons 
                name={item.callType === 'video' ? 'videocam' : 'call'} 
                size={20} 
                color={Colors.primary} 
              />
            </TouchableOpacity>
          </View>
          <View style={styles.callDetails}>
            <MaterialIcons name={callIcon.name} size={16} color={callIcon.color} />
            <Text style={[styles.callTime, { color: callIcon.color }]}>
              {item.timestamp}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chamadas</Text>
      </View>

      <FlatList
        data={mockCalls}
        renderItem={renderCallItem}
        keyExtractor={(item) => item.id}
        style={styles.callsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="call" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Nenhuma chamada recente</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  callsList: {
    flex: 1,
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  callContent: {
    flex: 1,
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  callName: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  callButton: {
    padding: 8,
  },
  callDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callTime: {
    fontSize: 14,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 16,
    marginTop: 16,
  },
});