# 🚀 Guia de Deploy em VPS

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração do Backend](#configuração-do-backend)
3. [Configuração do Frontend](#configuração-do-frontend)
4. [Configuração do Nginx](#configuração-do-nginx)
5. [Configuração de Domínio e SSL](#configuração-de-domínio-e-ssl)
6. [Deploy Automático](#deploy-automático)

**Configurações importantes para VPS:**

```env
# Configurações do Servidor
PORT=3000
NODE_ENV=production

# Configurações de CORS
# Especifique o domínio do seu frontend em produção
CORS_ORIGIN=https://seu-dominio.com
# Se estiver no mesmo servidor, pode usar:
# CORS_ORIGIN=http://localhost:4200

# Configurações do Banco de Dados PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=maestro
DB_USER=maestro_user
DB_PASSWORD=senha_segura_aqui

# JWT Secret (GERE UMA CHAVE ALEATÓRIA SEGURA!)
JWT_SECRET=sua_chave_secreta_super_segura_aqui_use_uuid
JWT_EXPIRES_IN=7d

# Jira API
JIRA_URL=https://sua-empresa.atlassian.net
JIRA_EMAIL=seu-email@empresa.com
JIRA_API_TOKEN=seu-token-aqui

# Conversao DOCX -> PDF (LibreOffice)
LIBREOFFICE_PATH=/usr/bin/soffice

# Diretório base dos PDFs
PDF_BASE_PATH=/var/www/maestro/ops
```

### 4. Configure o PostgreSQL

```bash
# Criar usuário e banco de dados
sudo -u postgres psql

CREATE DATABASE maestro;
CREATE USER maestro_user WITH ENCRYPTED PASSWORD 'senha_segura_aqui';
GRANT ALL PRIVILEGES ON DATABASE maestro TO maestro_user;
\q
```

### 5. Execute o setup do banco de dados

```bash
npm run setup-db
```

### 6. Configure o PM2 para manter o servidor rodando

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Iniciar o backend com PM2
pm2 start server.js --name maestro-backend

# Salvar configuração do PM2
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup
```

---

## 🎨 Configuração do Frontend

### 1. Navegue até a pasta do frontend

```bash
cd /var/www/maestro/maestro
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o ambiente de produção

O arquivo `src/environments/environment.prod.ts` já está configurado para usar URLs relativas (`/api`).

Se o frontend e backend estiverem em domínios diferentes, edite o arquivo:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.seu-dominio.com/api' // URL completa do backend
};
```

### 4. Faça o build de produção

```bash
npm run build
```

Os arquivos compilados estarão em `dist/maestro/browser/`.

---

## 🌐 Configuração do Nginx

### Cenário 1: Frontend e Backend no mesmo domínio

Crie o arquivo `/etc/nginx/sites-available/maestro`:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    # Frontend Angular
    location / {
        root /var/www/maestro/maestro/dist/maestro/browser;
        try_files $uri $uri/ /index.html;
    }

    # Proxy para o Backend (Node.js na porta 3000)
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Cenário 2: Frontend e Backend em domínios separados

**Frontend (seu-dominio.com):**

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        root /var/www/maestro/maestro/dist/maestro/browser;
        try_files $uri $uri/ /index.html;
    }
}
```

**Backend (api.seu-dominio.com):**

```nginx
server {
    listen 80;
    server_name api.seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Ativar configuração do Nginx

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/maestro /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

---

## 🔒 Configuração de Domínio e SSL

### 1. Configure o DNS

Aponte seu domínio para o IP da VPS:

- **Tipo A**: `seu-dominio.com` → `IP_DA_VPS`
- **Tipo A**: `api.seu-dominio.com` → `IP_DA_VPS` (se usar subdomínio)

### 2. Instale certificado SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Se usar subdomínio para API:
sudo certbot --nginx -d api.seu-dominio.com

# Renovação automática (o certbot já configura automaticamente)
sudo certbot renew --dry-run
```

---

## 🔄 Deploy Automático

### Script de deploy

Crie um arquivo `deploy.sh` na raiz do projeto:

```bash
#!/bin/bash

echo "🚀 Iniciando deploy do Maestro..."

# Parar aplicação
pm2 stop maestro-backend

# Atualizar código
git pull origin main

# Backend
echo "📦 Instalando dependências do backend..."
cd backend
npm install

# Frontend
echo "📦 Instalando dependências do frontend..."
cd ../maestro
npm install

# Build do frontend
echo "🏗️ Fazendo build do frontend..."
npm run build

# Reiniciar backend
echo "🔄 Reiniciando backend..."
pm2 start maestro-backend

# Recarregar Nginx
echo "🌐 Recarregando Nginx..."
sudo systemctl reload nginx

echo "✅ Deploy concluído com sucesso!"
```

Torne o script executável:

```bash
chmod +x deploy.sh
```

Execute o deploy:

```bash
./deploy.sh
```

---

## 📊 Monitoramento

### Ver logs do backend

```bash
# Logs em tempo real
pm2 logs maestro-backend

# Ver status
pm2 status
```

### Ver logs do Nginx

```bash
# Logs de acesso
sudo tail -f /var/log/nginx/access.log

# Logs de erro
sudo tail -f /var/log/nginx/error.log
```

---

## 🔧 Troubleshooting

### Backend não conecta ao banco de dados

1. Verifique se o PostgreSQL está rodando: `sudo systemctl status postgresql`
2. Verifique as credenciais no `.env`
3. Verifique se o usuário tem permissões: `sudo -u postgres psql -c "\du"`

### CORS errors

1. Verifique se `CORS_ORIGIN` no `.env` do backend está correto
2. Se usar domínios diferentes, certifique-se de incluir o protocolo: `https://seu-dominio.com`

### Frontend não carrega

1. Verifique se o build foi feito corretamente: `ls -la maestro/dist/maestro/browser/`
2. Verifique permissões dos arquivos: `sudo chown -R www-data:www-data /var/www/maestro`
3. Verifique logs do Nginx: `sudo tail -f /var/log/nginx/error.log`

### API retorna 502 Bad Gateway

1. Verifique se o backend está rodando: `pm2 status`
2. Verifique se a porta 3000 está aberta: `netstat -tulpn | grep 3000`
3. Reinicie o backend: `pm2 restart maestro-backend`

---

## 🎯 Checklist Final

- [ ] PostgreSQL configurado e rodando
- [ ] Backend configurado com `.env` correto
- [ ] Frontend com build de produção
- [ ] Nginx configurado e rodando
- [ ] SSL/HTTPS configurado (Let's Encrypt)
- [ ] PM2 configurado para auto-restart
- [ ] CORS_ORIGIN configurado corretamente
- [ ] Logs do backend funcionando
- [ ] Teste completo: login, navegação, funcionalidades

---

## 📞 Suporte

Se tiver problemas durante o deploy, verifique:

1. Logs do PM2: `pm2 logs maestro-backend`
2. Logs do Nginx: `sudo tail -f /var/log/nginx/error.log`
3. Conectividade do banco: `psql -U maestro_user -d maestro -h localhost`

---

**Boa sorte com o deploy! 🚀**
