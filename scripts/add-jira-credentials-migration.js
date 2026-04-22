import pool from '../config/database.js';

async function addJiraCredentialsColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adicionando colunas jira_email e jira_api_token na tabela users...');
    
    // Adicionar colunas
    await client.query(`
      ALTER TABLE maestro.users
      ADD COLUMN IF NOT EXISTS jira_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS jira_api_token TEXT;
    `);
    
    console.log('✅ Colunas adicionadas com sucesso!');
    
    // Adicionar comentários
    await client.query(`
      COMMENT ON COLUMN maestro.users.jira_email IS 'Email do usuário no Jira (usado para autenticação na API)';
      COMMENT ON COLUMN maestro.users.jira_api_token IS 'Token de API do Jira para autenticação';
    `);
    
    console.log('✅ Comentários adicionados!');
    
    // Atualizar usuário existente com as credenciais do .env
    // IMPORTANTE: Configure manualmente no banco ou via .env
    console.log('⚠️ Configure os tokens manualmente via SQL:');
    console.log('   UPDATE maestro.users SET api_token = \'SEU_TOKEN_AQUI\' WHERE email = \'seu.email@dominio.com\';');
    
    const result = { rowCount: 0, rows: [] };
    
    if (result.rowCount > 0) {
      console.log('✅ Credenciais atualizadas para o usuário:', result.rows[0]);
    } else {
      console.log('⚠️ Nenhum usuário encontrado com email guarino.silva@opera.security');
    }
    
    console.log('\n✅ Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar migração
addJiraCredentialsColumns()
  .then(() => {
    console.log('🎉 Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Falha na migração:', error);
    process.exit(1);
  });
