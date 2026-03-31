import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Validar variáveis de ambiente obrigatórias
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variáveis de ambiente faltando:', missingVars.join(', '));
  console.error('💡 Certifique-se de criar o arquivo .env na pasta backend/');
  process.exit(1);
}

// Configuração do pool de conexões
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
  max: 20, // Número máximo de conexões no pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // Configurar schema padrão
  options: '-c search_path=maestro,public'
});

// Teste de conexão
pool.on('connect', () => {
  console.log('✅ Conectado ao banco de dados PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado no pool de conexões:', err);
  process.exit(-1);
});

// Função para executar queries
export const query = (text, params) => pool.query(text, params);

async function runCompatibilityQuery(sql, label) {
  try {
    await pool.query(sql);
  } catch (error) {
    if (error?.code === '42501') {
      console.warn(`⚠️ Sem permissão para ajuste automático: ${label}`);
      return;
    }

    throw error;
  }
}

// Garante colunas esperadas para versões antigas do banco.
export async function ensureDatabaseCompatibility() {
  await runCompatibilityQuery(`
    ALTER TABLE IF EXISTS maestro.users
    ADD COLUMN IF NOT EXISTS menu_access JSONB NOT NULL DEFAULT '[]'::jsonb;
  `, 'maestro.users.menu_access');

  await runCompatibilityQuery(`
    ALTER TABLE IF EXISTS maestro.users
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  `, 'maestro.users.updated_at');

  await runCompatibilityQuery(`
    ALTER TABLE IF EXISTS maestro.project
    ADD COLUMN IF NOT EXISTS linear_meters JSONB NOT NULL DEFAULT '{"8C": "", "9C": "", "11C": ""}'::jsonb;
  `, 'maestro.project.linear_meters');

  await runCompatibilityQuery(`
    ALTER TABLE IF EXISTS maestro.project
    ADD COLUMN IF NOT EXISTS square_meters JSONB NOT NULL DEFAULT '{"8C": "", "9C": "", "11C": ""}'::jsonb;
  `, 'maestro.project.square_meters');

  await runCompatibilityQuery(`
    ALTER TABLE IF EXISTS maestro.project
    ADD COLUMN IF NOT EXISTS plate_consumption JSONB NOT NULL DEFAULT '{"8C": "", "9C": "", "11C": ""}'::jsonb;
  `, 'maestro.project.plate_consumption');

  await runCompatibilityQuery(`
    ALTER TABLE IF EXISTS maestro.project
    ADD COLUMN IF NOT EXISTS reviews JSONB NOT NULL DEFAULT '{"cutting": false, "labeling": false, "ki_Layout": false, "nesting_report": false, "folder_template": false}'::jsonb;
  `, 'maestro.project.reviews');
}

export default pool;
