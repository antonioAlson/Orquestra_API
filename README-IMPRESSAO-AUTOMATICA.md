# 🚀 Impressão Automática - Servidor de Impressão

## ✅ Implementado com Sucesso!

Agora o sistema possui **impressão automática real** que envia PDFs diretamente para a impressora **sem abrir janela de confirmação**!

---

## 🎯 Como Funciona

### Backend (Node.js)
- Nova rota `/api/print/print` que recebe PDFs
- Baixa os arquivos temporariamente
- Envia direto para a impressora via PowerShell/Windows
- Configurações aplicadas: P&B + Duplex

### Frontend (Angular)
- Botão **"Imprimir Automático"** 🚀
- Seletor de impressora 
- Sem janela de confirmação do navegador!

---

## 📋 Como Usar

1. **Vá em "Ordens de Produção"** → **"Imprimir OPs"**

2. **Digite os IDs** dos cards e clique em **"Buscar Arquivos"**

3. **Selecione os arquivos** que deseja imprimir

4. **(Opcional) Escolha a impressora** ou deixe em "Padrão"

5. **Clique em "🚀 Imprimir Automático"**

✅ **Pronto!** Os arquivos vão direto para a fila de impressão, sem janelas!

---

## 🆚 Diferença Entre os Botões

### 🚀 Imprimir Automático (RECOMENDADO)
- ✅ Sem janela de confirmação
- ✅ Envia direto para impressora
- ✅ Backend controla tudo
- ✅ Configurações automáticas (P&B + Duplex)
- ⚡ **Mais rápido e prático**

### 📋 Impressão Manual
- ⚠️ Abre janela do navegador
- ⚠️ Requer confirmação manual
- ✅ Útil para conferir antes de imprimir
- ✅ Permite ajustes manuais

---

## 🖨️ Requisitos

### Windows
- ✅ PowerShell habilitado (padrão)
- ✅ Impressora configurada no sistema
- ✅ Drivers de impressora instalados

### Linux (Futuro)
- Usar `lp` ou `lpr`
- Configuração de CUPS

### macOS (Futuro)
- Usar `lp` command

---

## ⚙️ Opções de Impressão

O sistema aplica automaticamente:

| Opção | Valor | Descrição |
|-------|-------|-----------|
| **grayscale** | `true` | Preto e branco |
| **duplex** | `true` | Frente e verso |
| **copies** | `1` | Uma cópia |

---

## 🔧 Configuração Avançada

### Backend - Variáveis de Ambiente

Se quiser forçar uma impressora específica, adicione no `.env`:

```env
DEFAULT_PRINTER=IMP-TCN-COLOR-ADMC
```

### Usar SumatraPDF (Opcional - Melhor Controle)

Para controle mais preciso, instale o SumatraPDF:

1. **Download:** https://www.sumatrapdfreader.org/download-free-pdf-viewer
2. **Instale em:** `C:\Program Files\SumatraPDF\`
3. **O backend detecta automaticamente** e usa se disponível

**Benefícios do SumatraPDF:**
- ✅ Melhor controle de duplex
- ✅ Configurações mais precisas
- ✅ Linha de comando nativa
- ✅ Leve e rápido

---

## 🐛 Solução de Problemas

### "Nenhuma impressora padrão configurada"
**Solução:**
1. `Win + R` → `control printers`
2. Clique direito em uma impressora → **"Definir como padrão"**

### "Erro ao acessar impressora"
**Solução:**
- Verifique se a impressora está ligada e online
- Teste imprimindo um documento de teste do Windows
- Reinicie o spooler: `net stop spooler && net start spooler`

### Impressão não sai colorida mesmo configurando
**Motivo:** O backend força P&B por padrão para economia

**Solução:** Modifique em `backend/routes/print.js`:
```javascript
grayscale: options.grayscale !== false  // Mude para: options.grayscale === true
```

---

## 📊 Logs e Monitoramento

O backend registra:
```
📄 Arquivo baixado: C:\Users\...\temp\print_123456_arquivo.pdf
🖨️ Enviando para impressora: IMP-TCN-COLOR-ADMC
✅ Impressão enviada com sucesso: arquivo.pdf
🗑️ Arquivo temporário removido
```

---

## 🚀 Melhorias Futuras

### V2.0
- [ ] Fila de impressão com status em tempo real
- [ ] Histórico de impressões
- [ ] Configuração de margem por usuário
- [ ] Preview antes de imprimir
- [ ] Impressão em rede via IP

### V3.0
- [ ] Suporte a múltiplos formatos (DOCX, Excel, imagens)
- [ ] Conversão automática para PDF
- [ ] Agendamento de impressões
- [ ] Notificações de conclusão

---

## 📞 API Reference

### POST `/api/print/print`

**Body:**
```json
{
  "files": [
    {
      "url": "https://jira.atlassian.net/attachment/123/file.pdf",
      "name": "OP-12345.pdf",
      "cardId": "MANTA-123"
    }
  ],
  "printer": "IMP-TCN-COLOR-ADMC",
  "options": {
    "grayscale": true,
    "duplex": true,
    "copies": 1
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "3 arquivo(s) enviado(s) para impressão",
  "results": [
    {
      "cardId": "MANTA-123",
      "name": "OP-12345.pdf",
      "success": true,
      "message": "Enviado para impressão"
    }
  ],
  "printOptions": {
    "grayscale": true,
    "duplex": true,
    "copies": 1
  }
}
```

### GET `/api/print/printers`

Lista todas as impressoras disponíveis.

**Response:**
```json
{
  "success": true,
  "printers": [
    {
      "Name": "IMP-TCN-COLOR-ADMC",
      "DriverName": "HP Universal Printing PCL 6",
      "PortName": "192.168.1.100",
      "PrinterStatus": 3
    }
  ]
}
```

---

## ✅ Conclusão

Agora você tem **impressão automática real**! 🎉

**Vantagens:**
- ✅ Sem janelas de confirmação
- ✅ Muito mais rápido
- ✅ Configurações automáticas
- ✅ Suporte a múltiplas impressoras

**Use o botão 🚀 "Imprimir Automático"** para a melhor experiência!
