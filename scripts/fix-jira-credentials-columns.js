import pool from '../config/database.js';

async function fixJiraCredentialsColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Corrigindo estrutura das colunas de credenciais do Jira...');
    
    // Verificar se as colunas antigas existem
    const checkColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'maestro' 
        AND table_name = 'users' 
        AND column_name IN ('jira_email', 'jira_api_token', 'api_token');
    `);
    
    const existingColumns = checkColumns.rows.map(row => row.column_name);
    console.log('📊 Colunas existentes:', existingColumns);
    
    // Adicionar coluna api_token se não existir
    if (!existingColumns.includes('api_token')) {
      await client.query(`
        ALTER TABLE maestro.users
        ADD COLUMN api_token TEXT;
      `);
      console.log('✅ Coluna api_token adicionada!');
    } else {
      console.log('ℹ️ Coluna api_token já existe');
    }
    
    // Se jira_api_token existe e tem dados, copiar para api_token
    if (existingColumns.includes('jira_api_token')) {
      await client.query(`
        UPDATE maestro.users
        SET api_token = jira_api_token
        WHERE jira_api_token IS NOT NULL AND (api_token IS NULL OR api_token = '');
      `);
      console.log('✅ Dados copiados de jira_api_token para api_token');
      
      // Remover coluna antiga
      await client.query(`
        ALTER TABLE maestro.users
        DROP COLUMN IF EXISTS jira_api_token;
      `);
      console.log('✅ Coluna jira_api_token removida');
    }
    
    // Remover coluna jira_email se existir (usaremos a coluna email existente)
    if (existingColumns.includes('jira_email')) {
      await client.query(`
        ALTER TABLE maestro.users
        DROP COLUMN IF EXISTS jira_email;
      `);
      console.log('✅ Coluna jira_email removida (usaremos a coluna email existente)');
    }
    
    // Adicionar comentário
    await client.query(`
      COMMENT ON COLUMN maestro.users.api_token IS 'Token de API do Jira para autenticação';
    `);
    
    // Mostrar usuários com credenciais configuradas
    const users = await client.query(`
      SELECT id, name, email, 
        CASE WHEN api_token IS NOT NULL THEN '✓ Configurado' ELSE '✗ Não configurado' END as token_status
      FROM maestro.users
      ORDER BY id;
    `);
    
    console.log('\n📋 Status das credenciais dos usuários:');
    users.rows.forEach(user => {
      console.log(`  • ${user.name} (${user.email}): ${user.token_status}`);
    });
    
    console.log('\n✅ Correção concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao executar correção:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar correção
fixJiraCredentialsColumns()
  .then(() => {
    console.log('🎉 Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Falha na correção:', error);
    process.exit(1);
  });
