# Trim Time - Plataforma SaaS Multi-tenant

Plataforma SaaS onde barbearias se cadastram, configuram seus atendimentos e clientes podem agendar horários de forma simples, via PWA.

## 🚀 Stack Técnica

- **Frontend/PWA**: Next.js 16 (App Router) com TypeScript
- **Estilização**: Tailwind CSS
- **Backend**: Next.js Route Handlers e Server Actions
- **Banco de Dados**: PostgreSQL (Neon)
- **ORM**: Prisma 5.22.0
- **Autenticação**: NextAuth.js v5 (Auth.js)
- **Gerenciamento de Estado**: TanStack Query (React Query) + Zustand
- **Validação**: Zod

## 📋 Funcionalidades

### Perfis de Usuário

1. **Admin Global**
   - Gerencia o sistema como um todo
   - Vê lista de barbearias, status de assinatura, trials

2. **Barbeiro / Dono de Barbearia**
   - Cadastro na plataforma
   - Cria/edita perfil da barbearia
   - Define horários de funcionamento, serviços, preços
   - Gerencia agenda e clientes

3. **Cliente**
   - Cadastro via Google, e-mail ou telefone
   - Escolhe barbearia principal
   - Busca horários disponíveis e agenda serviços
   - Busca horários por data/hora em todas as barbearias próximas

## 🏗️ Estrutura do Projeto

```
barbearia/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── auth/              # Páginas de autenticação
│   ├── admin/             # Painel Admin Global
│   ├── app/               # Área autenticada
│   │   ├── barbershop/   # Painel do Barbeiro
│   │   └── customer/     # Painel do Cliente
│   └── layout.tsx         # Layout raiz
├── components/            # Componentes React
│   ├── ui/               # Componentes UI reutilizáveis
│   └── layout/           # Componentes de layout
├── lib/                  # Bibliotecas e utilitários
│   ├── repositories/    # Repositórios (padrão Repository)
│   ├── services/         # Serviços de negócio
│   ├── prisma.ts         # Cliente Prisma
│   └── auth.ts           # Configuração NextAuth
├── prisma/               # Schema e migrations Prisma
├── public/              # Arquivos estáticos
│   ├── manifest.json    # Manifest PWA
│   └── sw.js            # Service Worker
└── types/               # Definições de tipos TypeScript
```

## 🛠️ Instalação e Configuração

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- PostgreSQL (ou use Neon)

### Passos

1. **Clone o repositório e instale as dependências:**

```bash
npm install
```

2. **Configure as variáveis de ambiente:**

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL='postgresql://user:password@host:port/database?sslmode=require'
NEXTAUTH_SECRET='seu-secret-aqui'
NEXTAUTH_URL='http://localhost:3000'
GOOGLE_CLIENT_ID='seu-google-client-id'
GOOGLE_CLIENT_SECRET='seu-google-client-secret'
```

3. **Execute as migrations do Prisma:**

```bash
npx prisma migrate dev
```

4. **Gere o cliente Prisma:**

```bash
npx prisma generate
```

5. **Inicie o servidor de desenvolvimento:**

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📱 PWA

O projeto está configurado como PWA com:

- **Manifest.json**: Configuração do app instalável
- **Service Worker**: Cache de assets e rotas principais
- **Ícones**: (adicione ícones 192x192 e 512x512 em `/public`)

Para testar o PWA:
1. Abra o app no navegador
2. Use o DevTools > Application > Service Workers
3. Ou instale no dispositivo móvel

## 🏛️ Arquitetura e Padrões

O projeto segue os princípios **SOLID** e **Clean Code**:

### Repository Pattern
- `lib/repositories/`: Abstração de acesso a dados
- Separação de responsabilidades entre camadas

### Service Layer
- `lib/services/`: Lógica de negócio
- Validações e regras de negócio centralizadas

### Componentes
- Componentes reutilizáveis em `components/ui/`
- Layouts compartilhados em `components/layout/`

## 🔐 Autenticação

O sistema suporta:

1. **Email + Senha**
2. **Telefone + Senha**
3. **Google OAuth**

Rotas protegidas por middleware em `middleware.ts`

## 📊 Modelo de Dados

Principais entidades:

- `User`: Usuários do sistema
- `Barbershop`: Barbearias cadastradas
- `BarberProfile`: Perfil de barbeiros
- `CustomerProfile`: Perfil de clientes
- `Service`: Serviços oferecidos
- `WorkingHours`: Horários de funcionamento
- `Appointment`: Agendamentos
- `Subscription`: Assinaturas e pagamentos

## 🎨 UI/UX

O design prioriza:

- **Simplicidade**: Interface limpa e intuitiva
- **Responsividade**: Funciona bem em mobile e desktop
- **Feedback Visual**: Estados de loading, erros e sucesso
- **Acessibilidade**: Componentes semânticos e navegação por teclado

## 📝 Próximos Passos

- [ ] Implementar CRUD completo de barbearia
- [ ] Implementar gestão de serviços e horários
- [ ] Implementar sistema de agendamento
- [ ] Implementar busca de horários em múltiplas barbearias
- [ ] Implementar lógica de trial e assinatura
- [ ] Integração com gateway de pagamento
- [ ] Adicionar ícones do PWA
- [ ] Testes automatizados

## 📄 Licença

Este projeto é privado.
