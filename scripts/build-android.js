#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando build do Anvic para Android...');

// Verificar se .env existe
if (!fs.existsSync('.env')) {
  console.log('⚠️  Arquivo .env não encontrado. Criando arquivo padrão...');
  fs.writeFileSync('.env', `
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
`);
}

try {
  // Limpar cache
  console.log('🧹 Limpando cache...');
  execSync('npx expo start --clear', { stdio: 'inherit' });
  
  // Prebuild
  console.log('⚙️  Executando prebuild...');
  execSync('npx expo prebuild --platform android --clear', { stdio: 'inherit' });
  
  // Build APK
  console.log('📦 Construindo APK...');
  process.chdir('android');
  execSync('./gradlew assembleRelease', { stdio: 'inherit' });
  
  console.log('✅ Build concluído com sucesso!');
  console.log('📱 APK localizado em: android/app/build/outputs/apk/release/');
  
} catch (error) {
  console.error('❌ Erro durante o build:', error.message);
  process.exit(1);
}