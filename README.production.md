# Deploy no Easypanel

## Configuração Rápida

### 1. Variáveis de Ambiente
Configure estas variáveis no Easypanel:

```
VITE_SUPABASE_URL=https://mvsoifhykosbvajpcmdl.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12c29pZmh5a29zYnZhanBjbWRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzgzMzEsImV4cCI6MjA3ODExNDMzMX0.i6Y-n_QAoL8REZK1xb-QU5q_nr-Ak9nw5QMblhEshMw
VITE_SUPABASE_PROJECT_ID=mvsoifhykosbvajpcmdl
```

### 2. Configuração do Easypanel

#### Opção A: Deploy com Docker (Recomendado)
1. Conecte seu repositório Git ao Easypanel
2. Configure o build usando o Dockerfile
3. Porta: `80`
4. Health check: `/health`

#### Opção B: Deploy sem Docker
**Build Command:**
```bash
npm ci && npm run build
```

**Start Command:**
```bash
npx serve -s dist -l 3000
```

**Porta:** `3000`

### 3. Recursos Recomendados
- **CPU:** 0.5 vCPU (mínimo)
- **RAM:** 512 MB (mínimo)
- **Storage:** 1 GB

### 4. Domínio Customizado
Configure seu domínio no Easypanel e certifique-se de ativar HTTPS automático.

### 5. Monitoramento
- Health check disponível em: `https://seu-dominio.com/health`
- Logs disponíveis no painel do Easypanel

## Build Local para Teste
Para testar o build localmente:

```bash
# Build
npm run build

# Preview
npm run preview
```

## Troubleshooting

### Build falha
- Verifique se todas as variáveis de ambiente estão configuradas
- Certifique-se de que a versão do Node.js é 18+

### App não carrega
- Verifique os logs do container
- Confirme que as variáveis de ambiente estão corretas
- Verifique se a porta está configurada corretamente (80 para Docker, 3000 para serve)

### Rotas 404
- Certifique-se de que o nginx.conf está sendo usado corretamente
- Verifique se a configuração SPA routing está ativa
