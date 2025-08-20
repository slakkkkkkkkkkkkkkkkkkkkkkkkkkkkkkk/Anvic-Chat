# 🔥 Anvic - Chat App Avançado

![Anvic Logo](https://cdn-ai.onspace.ai/onspace/project/image/VJ6xPwy5YEJJnwQo4nrm6M/logo.png)

**Anvic** é um aplicativo de chat moderno e seguro, desenvolvido com React Native e Expo, integrado ao Supabase para backend robusto.

## ✨ Principais Funcionalidades

### 🔐 Segurança e Privacidade
- **Criptografia AES-256** end-to-end
- **Modo Privado 😈** - Mensagens auto-destrutivas
- **Proteção contra Screenshots** no modo privado
- **Autenticação Biométrica** (Face ID / Touch ID)
- **Bloqueio por senha** opcional

### 💬 Chat Avançado
- **Mensagens de voz** com gravação HD
- **Chamadas de voz e vídeo** integradas
- **Indicação "digitando..."** em tempo real
- **Confirmação de leitura** (✔️✔️)
- **Reações com emojis** estilo WhatsApp/Instagram
- **Editar/Apagar mensagens** enviadas
- **Busca inteligente** dentro do chat

### 📱 Recursos Modernos
- **Compartilhamento de localização** em tempo real
- **Envio de arquivos** (PDF, DOC, ZIP, etc.)
- **Mensagens agendadas** com data/hora
- **Favoritar mensagens** importantes
- **Assistente IA** integrado (@Anvic Ai)
- **Jogos multiplayer** no chat

### 🎨 Personalização Total
- **3 Temas**: Claro, Escuro, Escuro Absoluto
- **4 Tamanhos de fonte**: Pequena, Média, Grande, Extra Grande
- **4 Famílias de fonte**: Padrão, Moderna, Clássica, Divertida
- **Papéis de parede** personalizados para chats
- **Status online/offline** configurável

## 🛠️ Tecnologias Utilizadas

- **React Native** + **Expo SDK 53**
- **TypeScript** para type safety
- **Supabase** como Backend-as-a-Service
- **Expo Router** para navegação
- **React Native Reanimated** para animações
- **Expo Image** para otimização de imagens

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Expo CLI
- Conta no Supabase

### 1. Clone e Instale
```bash
git clone <repository-url>
cd anvic-chat
npm install --legacy-peer-deps
```

### 2. Configure Variáveis de Ambiente
```bash
# Execute o script de configuração
npm run setup:env

# Ou crie manualmente o arquivo .env:
EXPO_PUBLIC_SUPABASE_URL=sua_url_aqui
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
```

### 3. Configure o Supabase
Execute os scripts SQL fornecidos no Supabase Dashboard:
- Tabelas de usuários, conversas e mensagens
- Políticas RLS (Row Level Security)
- Triggers para sincronização automática

### 4. Execute o App
```bash
# Desenvolvimento
npm start

# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

## 📦 Build para Produção

### Usando Codemagic (Recomendado)
1. Conecte seu repositório ao Codemagic
2. Configure as variáveis de ambiente no dashboard
3. Execute o workflow `anvic-production`
4. Baixe o APK/AAB gerado

### Usando EAS Build
```bash
# Instalar EAS CLI
npm install -g @expo/eas-cli

# Login
eas login

# Build APK
eas build --platform android --profile production-apk

# Build AAB para Google Play
eas build --platform android --profile production
```

### Build Local (Android)
```bash
# Script personalizado
npm run build:android

# Ou manualmente
npx expo prebuild --platform android --clear
cd android
./gradlew assembleRelease
```

## 🏗️ Estrutura do Projeto

```
anvic-chat/
├── app/                    # Páginas (Expo Router)
│   ├── (tabs)/            # Navegação por abas
│   ├── auth/              # Telas de autenticação
│   ├── chat/              # Telas de chat
│   └── _layout.tsx        # Layout global
├── components/            # Componentes reutilizáveis
│   └── ui/               # Componentes de interface
├── services/             # Lógica de negócio
│   ├── endpoints/        # APIs do Supabase
│   └── *.ts             # Serviços específicos
├── hooks/                # Custom React Hooks
├── contexts/             # Contextos globais
├── constants/            # Constantes e temas
└── assets/              # Recursos estáticos
```

## 🔧 Scripts Disponíveis

```bash
npm start                 # Iniciar desenvolvimento
npm run android          # Executar no Android
npm run ios              # Executar no iOS
npm run web              # Executar na web
npm run build:android    # Build APK local
npm run setup:env        # Configurar ambiente
npm run lint             # Verificar código
npm run test             # Executar testes
```

## 🎯 Funcionalidades Implementadas

### ✅ Básico
- [x] Sistema de autenticação completo
- [x] Chat em tempo real
- [x] Envio de mídia (fotos/vídeos/áudios)
- [x] Sistema de presença (online/offline)
- [x] Temas personalizáveis

### ✅ Avançado
- [x] Criptografia end-to-end
- [x] Modo privado com auto-destruição
- [x] Proteção contra screenshots
- [x] Autenticação biométrica
- [x] Compartilhamento de localização
- [x] Mensagens agendadas
- [x] Assistente IA integrado

### ✅ Premium
- [x] Jogos multiplayer no chat
- [x] Sincronização de música
- [x] Editor de voz avançado
- [x] Chat por QR Code
- [x] Modo fantasma absoluto

## 📱 Compatibilidade

- **Android**: 6.0+ (API 23+)
- **iOS**: 11.0+
- **Web**: Browsers modernos
- **Expo Go**: Desenvolvimento e testes

## 🔐 Segurança

O Anvic implementa as melhores práticas de segurança:

- **Criptografia AES-256** para todas as mensagens
- **Row Level Security (RLS)** no banco de dados
- **Autenticação JWT** com refresh automático
- **Proteção contra ataques** CSRF e injection
- **Validação** completa de entrada de dados

## 👨‍💻 Desenvolvedor

**Victor Alefe Fernandes Dos Anjos**
- Desenvolvido na plataforma OnSpace.ai
- Focado em segurança e experiência do usuário

---

*O app foi desenvolvido com tecnologia avançada de segurança e privacidade, garantindo que suas conversas, arquivos e informações pessoais estejam sempre protegidos. Navegue, converse e compartilhe com tranquilidade — com o Anvic, sua privacidade vem em primeiro lugar.*

## 📄 Licença

© 2025 OnSpace.ai. Todos os direitos reservados.