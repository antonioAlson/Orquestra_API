-- Setup completo do banco de dados Maestro
-- Execute este script no banco de dados 'opera'

-- 1. Criar o schema maestro se não existir
CREATE SCHEMA IF NOT EXISTS maestro;

-- 2. Garantir que o usuário tem permissões no schema
GRANT ALL PRIVILEGES ON SCHEMA maestro TO caio;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA maestro TO caio;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA maestro TO caio;

-- Garantir permissões futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA maestro GRANT ALL ON TABLES TO caio;
ALTER DEFAULT PRIVILEGES IN SCHEMA maestro GRANT ALL ON SEQUENCES TO caio;

-- 3. Criar a tabela de usuários
CREATE TABLE IF NOT EXISTS maestro.users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  menu_access JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Criar índice para busca por email
CREATE INDEX IF NOT EXISTS idx_users_email ON maestro.users(email);

-- 5. Criar tabela de credenciais JIRA (se necessário)
CREATE TABLE IF NOT EXISTS maestro.jira_credentials (
  user_id INTEGER PRIMARY KEY REFERENCES maestro.users(id) ON DELETE CASCADE,
  jira_url VARCHAR(500) NOT NULL,
  jira_email VARCHAR(255) NOT NULL,
  jira_api_token TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Schema maestro criado e configurado com sucesso!';
  RAISE NOTICE '👤 Usuário caio tem todas as permissões necessárias';
  RAISE NOTICE '📋 Tabelas criadas: users, jira_credentials';
END $$;
