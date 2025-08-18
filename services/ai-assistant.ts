import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AIResponse {
  message: string;
  type: 'text' | 'task' | 'reminder' | 'summary' | 'learning';
  confidence: number;
  metadata?: any;
}

export interface LearningData {
  gírias: { [key: string]: string };
  contextMemory: { [conversationId: string]: string[] };
  userPreferences: { [userId: string]: any };
}

class AnvicAI {
  private static readonly LEARNING_KEY = 'anvic_ai_learning';
  private learningData: LearningData = {
    gírias: {},
    contextMemory: {},
    userPreferences: {}
  };

  constructor() {
    this.loadLearningData();
  }

  // Processar comando do usuário
  async processCommand(message: string, conversationId: string, userId: string): Promise<AIResponse> {
    // Verificar se contém @Anvic Ai
    if (!message.toLowerCase().includes('@anvic ai')) {
      return {
        message: '',
        type: 'text',
        confidence: 0
      };
    }

    // Remover @Anvic Ai da mensagem
    const cleanMessage = message.replace(/@anvic ai/gi, '').trim();
    
    // Salvar contexto
    await this.saveContext(conversationId, cleanMessage);

    // Processar diferentes tipos de comando
    if (cleanMessage.includes('resumir') || cleanMessage.includes('resumo')) {
      return await this.summarizeConversation(conversationId);
    }

    if (cleanMessage.includes('lembrar') || cleanMessage.includes('compromisso')) {
      return await this.createReminder(cleanMessage, userId);
    }

    if (cleanMessage.includes('lista') || cleanMessage.includes('tarefa')) {
      return await this.createTaskList(cleanMessage, userId);
    }

    if (cleanMessage.includes('o que significa') || cleanMessage.includes('significado')) {
      return await this.explainTerm(cleanMessage);
    }

    // Perguntas educacionais (incluindo conteúdo +18)
    if (this.isEducationalQuery(cleanMessage)) {
      return await this.provideEducationalContent(cleanMessage);
    }

    // Resposta geral inteligente
    return await this.generateSmartResponse(cleanMessage, conversationId);
  }

  // Resumir conversa
  private async summarizeConversation(conversationId: string): Promise<AIResponse> {
    const context = this.learningData.contextMemory[conversationId] || [];
    
    if (context.length === 0) {
      return {
        message: "📝 Ainda não há mensagens suficientes para resumir nesta conversa.",
        type: 'summary',
        confidence: 0.9
      };
    }

    // Análise simples das mensagens
    const keywords = this.extractKeywords(context);
    const messageCount = context.length;
    
    return {
      message: `📝 **Resumo da Conversa:**\n\n` +
               `• ${messageCount} mensagens analisadas\n` +
               `• Tópicos principais: ${keywords.slice(0, 5).join(', ')}\n` +
               `• Última atividade: ${this.getLastActivity(context)}`,
      type: 'summary',
      confidence: 0.8
    };
  }

  // Criar lembrete
  private async createReminder(message: string, userId: string): Promise<AIResponse> {
    const reminderText = message.replace(/lembrar|compromisso/gi, '').trim();
    
    // Salvar lembrete (implementação básica)
    const reminders = await this.getUserReminders(userId);
    const newReminder = {
      id: Date.now().toString(),
      text: reminderText,
      created: new Date().toISOString(),
      completed: false
    };
    
    reminders.push(newReminder);
    await this.saveUserReminders(userId, reminders);

    return {
      message: `⏰ **Lembrete Criado!**\n\n"${reminderText}"\n\nVou te lembrar quando necessário.`,
      type: 'reminder',
      confidence: 0.95,
      metadata: { reminderId: newReminder.id }
    };
  }

  // Criar lista de tarefas
  private async createTaskList(message: string, userId: string): Promise<AIResponse> {
    const taskText = message.replace(/lista|tarefa/gi, '').trim();
    const tasks = taskText.split(',').map(t => t.trim()).filter(t => t.length > 0);
    
    return {
      message: `✅ **Lista de Tarefas Criada:**\n\n` +
               tasks.map((task, i) => `${i + 1}. [ ] ${task}`).join('\n') +
               `\n\nTotal: ${tasks.length} itens`,
      type: 'task',
      confidence: 0.9,
      metadata: { tasks }
    };
  }

  // Explicar termos/gírias
  private async explainTerm(message: string): Promise<AIResponse> {
    const term = message.replace(/o que significa|significado/gi, '').trim().toLowerCase();
    
    // Verificar se conhece a gíria
    if (this.learningData.gírias[term]) {
      return {
        message: `💡 **${term}**: ${this.learningData.gírias[term]}`,
        type: 'learning',
        confidence: 0.9
      };
    }

    // Perguntar ao usuário para aprender
    return {
      message: `🤔 Não conheço "${term}". Pode me explicar o que significa? Assim eu aprendo!`,
      type: 'learning',
      confidence: 0.7
    };
  }

  // Conteúdo educacional (incluindo +18)
  private async provideEducationalContent(message: string): Promise<AIResponse> {
    const educationalTopics = {
      'sexualidade': 'ℹ️ **CONTEÚDO EDUCACIONAL:** Informações sobre sexualidade são importantes para educação. Sempre consulte fontes médicas confiáveis.',
      'drogas': 'ℹ️ **CONTEÚDO EDUCACIONAL:** Informações sobre substâncias são fornecidas apenas para fins educacionais e prevenção.',
      'violência': 'ℹ️ **CONTEÚDO EDUCACIONAL:** Discussões sobre violência são abordadas em contexto educacional e de conscientização.',
    };

    // Detectar tópico
    const topic = Object.keys(educationalTopics).find(t => 
      message.toLowerCase().includes(t)
    );

    if (topic) {
      return {
        message: educationalTopics[topic] + '\n\n' +
                '⚠️ **Importante:** Este conteúdo é fornecido exclusivamente para fins educacionais. ' +
                'Sempre busque orientação profissional adequada.',
        type: 'text',
        confidence: 0.8
      };
    }

    return this.generateSmartResponse(message, '');
  }

  // Resposta inteligente geral
  private async generateSmartResponse(message: string, conversationId: string): Promise<AIResponse> {
    const responses = [
      "🤖 Entendi! Como posso ajudar você com isso?",
      "💭 Interessante pergunta! Deixe-me pensar...",
      "🧠 Baseado no que sei, posso sugerir algumas opções.",
      "✨ Que tal explorarmos isso juntos?",
      "🎯 Vou fazer o meu melhor para ajudar!"
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    return {
      message: randomResponse + '\n\n' +
               '💡 **Dica:** Use comandos como:\n' +
               '• "resumir conversa"\n' +
               '• "lembrar [algo]"\n' +
               '• "criar lista [itens]"\n' +
               '• "o que significa [termo]"',
      type: 'text',
      confidence: 0.6
    };
  }

  // Aprender nova gíria
  async learnSlang(term: string, meaning: string): Promise<void> {
    this.learningData.gírias[term.toLowerCase()] = meaning;
    await this.saveLearningData();
  }

  // Verificar se é pergunta educacional
  private isEducationalQuery(message: string): boolean {
    const educationalKeywords = [
      'como', 'porque', 'o que é', 'significado', 'explicar',
      'ensinar', 'aprender', 'educação', 'informação'
    ];
    
    return educationalKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  // Extrair palavras-chave
  private extractKeywords(messages: string[]): string[] {
    const allText = messages.join(' ').toLowerCase();
    const words = allText.split(/\s+/).filter(word => word.length > 3);
    const frequency: { [key: string]: number } = {};
    
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  // Obter última atividade
  private getLastActivity(context: string[]): string {
    if (context.length === 0) return 'Nenhuma atividade';
    return 'Há poucos minutos';
  }

  // Gerenciar contexto
  private async saveContext(conversationId: string, message: string): Promise<void> {
    if (!this.learningData.contextMemory[conversationId]) {
      this.learningData.contextMemory[conversationId] = [];
    }
    
    this.learningData.contextMemory[conversationId].push(message);
    
    // Manter apenas últimas 50 mensagens por conversa
    if (this.learningData.contextMemory[conversationId].length > 50) {
      this.learningData.contextMemory[conversationId] = 
        this.learningData.contextMemory[conversationId].slice(-50);
    }
    
    await this.saveLearningData();
  }

  // Gerenciar lembretes
  private async getUserReminders(userId: string): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(`anvic_reminders_${userId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  private async saveUserReminders(userId: string, reminders: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(`anvic_reminders_${userId}`, JSON.stringify(reminders));
    } catch (error) {
      console.error('Erro ao salvar lembretes:', error);
    }
  }

  // Persistência de dados de aprendizado
  private async loadLearningData(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(AnvicAI.LEARNING_KEY);
      if (data) {
        this.learningData = { ...this.learningData, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('Erro ao carregar dados de aprendizado:', error);
    }
  }

  private async saveLearningData(): Promise<void> {
    try {
      await AsyncStorage.setItem(AnvicAI.LEARNING_KEY, JSON.stringify(this.learningData));
    } catch (error) {
      console.error('Erro ao salvar dados de aprendizado:', error);
    }
  }
}

export const anvicAI = new AnvicAI();