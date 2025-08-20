#!/usr/bin/env node
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Configuração do Anvic - Variáveis de Ambiente');
console.log('===============================================');

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function setupEnvironment() {
  try {
    console.log('📝 Configure suas credenciais do Supabase:');
    
    const supabaseUrl = await askQuestion('Supabase URL: ');
    const supabaseKey = await askQuestion('Supabase Anon Key: ');
    
    const envContent = `
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=${supabaseUrl}
EXPO_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey}

# App Configuration
EXPO_PUBLIC_APP_NAME=Anvic
EXPO_PUBLIC_APP_VERSION=1.0.0
`.trim();

    fs.writeFileSync('.env', envContent);
    
    console.log('✅ Arquivo .env criado com sucesso!');
    console.log('🚀 Agora você pode executar: npm run android');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    rl.close();
  }
}

setupEnvironment();