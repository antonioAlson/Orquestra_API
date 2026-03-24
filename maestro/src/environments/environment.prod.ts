export const environment = {
  production: true,
  // Para produção, você pode:
  // 1. Usar URL relativa se frontend e backend estiverem no mesmo domínio: apiUrl: '/api'
  // 2. Ou especificar a URL completa do seu servidor: apiUrl: 'https://seu-dominio.com/api'
  // 3. Ou usar variável de ambiente no build: apiUrl: (window as any).ENV?.API_URL || 'https://seu-dominio.com/api'
  apiUrl: '/api' // URL relativa - ajuste conforme sua configuração de proxy/nginx
};
