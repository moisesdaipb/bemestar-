# BemEstar+ - Bem-estar Corporativo

Portal de agendamento de programas de bem-estar corporativo.

## 🚀 Deploy na Vercel

### Passo 1: Subir no GitHub

```bash
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

### Passo 2: Configurar na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em **"Add New Project"**
3. Importe o repositório do GitHub
4. Configure as **Environment Variables**:
   - `VITE_SUPABASE_URL` = sua URL do Supabase
   - `VITE_SUPABASE_ANON_KEY` = sua Anon Key do Supabase
   - `GEMINI_API_KEY` = sua API Key do Gemini (opcional)
5. Clique em **Deploy**

### Configurações de Build (automático)

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

## 💻 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env.local

# Editar .env.local com suas credenciais

# Iniciar servidor de desenvolvimento
npm run dev
```

## 🔧 Variáveis de Ambiente

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | ✅ Sim |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima do Supabase | ✅ Sim |
| `GEMINI_API_KEY` | API Key do Google Gemini | ❌ Não |

## 📦 Tecnologias

- React 19
- TypeScript
- Vite
- Supabase (Auth + Database)
- TailwindCSS
