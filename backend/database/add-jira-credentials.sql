-- Adiciona coluna para token da API do Jira na tabela users
-- Cada usuário terá seu próprio token de acesso ao Jira
-- A coluna 'email' já existe e será utilizada para autenticação no Jira

ALTER TABLE maestro.users
ADD COLUMN IF NOT EXISTS api_token TEXT;

-- Comentário explicativo
COMMENT ON COLUMN maestro.users.api_token IS 'Token de API do Jira para autenticação';

-- Atualizar usuário existente com o token do .env (migração inicial)
-- IMPORTANTE: Substitua 'SEU_TOKEN_AQUI' pelo token real da API do Jira
-- UPDATE maestro.users
-- SET api_token = 'SEU_TOKEN_AQUI'
-- WHERE email = 'seu.email@dominio.com';
