
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useSettings } from '@/hooks/useSettings';
import { Themes } from '@/constants/Themes';

interface MessageReactionsProps {
  messageId: string;
  reactions: { [emoji: string]: string[] }; // emoji -> array of user IDs
  currentUserId: string;
  onAddReaction: (messageId: string, emoji: string) => void;
  onRemoveReaction: (messageId: string, emoji: string) => void;
  style?: any;
}

const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍', '👎', '🔥'];

export default function MessageReactions({
  messageId,
  reactions,
  currentUserId,
  onAddReaction,
  onRemoveReaction,
  style
}: MessageReactionsProps) {
  const { settings } = useSettings();
  const currentTheme = Themes[settings.theme];
  const [showPicker, setShowPicker] = useState(false);
  const [pickerAnimation] = useState(new Animated.Value(0));

  const showReactionPicker = () => {
    setShowPicker(true);
    Animated.spring(pickerAnimation, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const hideReactionPicker = () => {
    Animated.spring(pickerAnimation, {
      toValue: 0,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start(() => {
      setShowPicker(false);
    });
  };

  const handleReaction = (emoji: string) => {
    const userReacted = reactions[emoji]?.includes(currentUserId);
    
    if (userReacted) {
      onRemoveReaction(messageId, emoji);
    } else {
      onAddReaction(messageId, emoji);
    }
    
    hideReactionPicker();
  };

  const getReactionCounts = () => {
    return Object.entries(reactions)
      .filter(([_, userIds]) => userIds.length > 0)
      .map(([emoji, userIds]) => ({
        emoji,
        count: userIds.length,
        userReacted: userIds.includes(currentUserId)
      }));
  };

  const reactionCounts = getReactionCounts();

  return (
    <View style={[styles.container, style]}>
      {/* Existing Reactions */}
      {reactionCounts.length > 0 && (
        <View style={styles.reactionsContainer}>
          {reactionCounts.map(({ emoji, count, userReacted }) => (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.reactionBubble,
                { backgroundColor: currentTheme.surface },
                userReacted && { backgroundColor: currentTheme.primary + '30', borderColor: currentTheme.primary, borderWidth: 1 }
              ]}
              onPress={() => handleReaction(emoji)}
            >
              <Text style={styles.reactionEmoji}>{emoji}</Text>
              <Text style={[styles.reactionCount, { color: currentTheme.text }]}>
                {count}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Add Reaction Button */}
      <TouchableOpacity
        style={[styles.addReactionButton, { backgroundColor: currentTheme.surface }]}
        onPress={showReactionPicker}
      >
        <MaterialIcons name="add-reaction" size={16} color={currentTheme.textMuted} />
      </TouchableOpacity>

      {/* Reaction Picker Modal */}
      {showPicker && (
        <Modal transparent visible={showPicker} onRequestClose={hideReactionPicker}>
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={hideReactionPicker}
          >
            <Animated.View 
              style={[
                styles.reactionPicker,
                { backgroundColor: currentTheme.surface },
                {
                  transform: [
                    {
                      scale: pickerAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                  opacity: pickerAnimation,
                },
              ]}
            >
              <Text style={[styles.pickerTitle, { color: currentTheme.text }]}>
                Reagir com emoji
              </Text>
              <View style={styles.emojiGrid}>
                {QUICK_REACTIONS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiButton,
                      reactions[emoji]?.includes(currentUserId) && {
                        backgroundColor: currentTheme.primary + '20',
                        borderColor: currentTheme.primary,
                        borderWidth: 1
                      }
                    ]}
                    onPress={() => handleReaction(emoji)}
                  >
                    <Text style={styles.emojiButtonText}>{emoji}</Text>
                    {reactions[emoji]?.length > 0 && (
                      <Text style={[styles.emojiCount, { color: currentTheme.textSecondary }]}>
                        {reactions[emoji].length}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
  },
  reactionEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  addReactionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionPicker: {
    borderRadius: 16,
    padding: 20,
    margin: 20,
    minWidth: 280,
    maxWidth: Dimensions.get('window').width - 40,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  emojiButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emojiButtonText: {
    fontSize: 24,
  },
  emojiCount: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 16,
    textAlign: 'center',
  },
});
