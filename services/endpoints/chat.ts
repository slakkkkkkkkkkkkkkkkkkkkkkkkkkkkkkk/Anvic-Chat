import { supabase } from '../supabase';
import { UserProfile, Conversation, Message } from '../types';

export const chatService = {
  async getUserProfile(userId: string): Promise<{ data: UserProfile | null; error: any }> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  },

  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    return { data, error };
  },

  async searchUsers(query: string): Promise<{ data: UserProfile[] | null; error: any }> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10);
    
    return { data, error };
  },

  async getOrCreateConversation(participant1: string, participant2: string) {
    // First try to find existing conversation
    let { data: conversation, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`and(participant_1.eq.${participant1},participant_2.eq.${participant2}),and(participant_1.eq.${participant2},participant_2.eq.${participant1})`)
      .single();

    if (error && error.code === 'PGRST116') {
      // Conversation doesn't exist, create it
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          participant_1: participant1,
          participant_2: participant2,
        })
        .select()
        .single();

      return { data: newConversation, error: createError };
    }

    return { data: conversation, error };
  },

  async getUserConversations(userId: string): Promise<{ data: Conversation[] | null; error: any }> {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        messages (
          id,
          content,
          message_type,
          created_at,
          sender_id,
          is_read
        )
      `)
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) return { data: null, error };

    // Process conversations to add other user info and last message
    const processedConversations = await Promise.all(
      (data || []).map(async (conv: any) => {
        const otherUserId = conv.participant_1 === userId ? conv.participant_2 : conv.participant_1;
        
        // Get other user profile
        const { data: otherUser } = await this.getUserProfile(otherUserId);
        
        // Get last message
        const lastMessage = conv.messages && conv.messages.length > 0 
          ? conv.messages.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
          : null;

        // Count unread messages
        const unreadCount = conv.messages 
          ? conv.messages.filter((msg: any) => msg.sender_id !== userId && !msg.is_read).length
          : 0;

        return {
          ...conv,
          other_user: otherUser,
          last_message: lastMessage,
          unread_count: unreadCount,
        };
      })
    );

    return { data: processedConversations, error: null };
  },

  async getConversationMessages(conversationId: string): Promise<{ data: Message[] | null; error: any }> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:user_profiles(*)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    return { data, error };
  },

  async sendMessage(conversationId: string, senderId: string, content: string, messageType: string = 'text') {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        message_type: messageType,
      })
      .select(`
        *,
        sender:user_profiles(*)
      `)
      .single();

    // Update conversation timestamp
    if (!error) {
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    }

    return { data, error };
  },

  async markMessagesAsRead(conversationId: string, userId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId);

    return { error };
  },

  subscribeToMessages(conversationId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        callback
      )
      .subscribe();
  },

  subscribeToConversations(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`conversations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `or(participant_1.eq.${userId},participant_2.eq.${userId})`,
        },
        callback
      )
      .subscribe();
  },
};