# Story 2.1: Login e Registro com Supabase Auth

## Status
Done

## Executor Assignment
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: [build, typecheck, security-review]
design_squad: "/design-squad:design-chief"

## Story
**As a** usuario da plataforma (gestor, tecnico, atleta),
**I want** poder criar uma conta e fazer login com email/senha usando Supabase Auth,
**so that** eu possa acessar a plataforma de forma segura e personalizada de acordo com meu perfil institucional.

## Acceptance Criteria
1. Pagina de registro com campos: nome completo, email, senha, confirmacao de senha, tipo de usuario (select)
2. Pagina de login funcional integrada com Supabase Auth (email/password)
3. Recuperacao de senha via email (forgot password flow)
4. Validacao de formularios com React Hook Form + Zod
5. Middleware de autenticacao que protege rotas /dashboard/*
6. Redirect automatico: usuario logado → /dashboard, usuario nao logado → /login
7. Toast notifications para erros e sucesso (usando sonner)
8. Conformidade LGPD: checkbox de aceite dos termos de uso no registro
9. Pagina de registro e login seguem o Design System Brasil Atleta (estetica "Athletic Data Monument")

## Design Squad Integration
- [ ] Design: Layout/wireframe definido — Pagina de registro com split layout (como login)
- [ ] Design: Componentes do Design System identificados — Input, Select, Button, Card, Label, Sonner
- [ ] Design: Review de acessibilidade (WCAG 2.1 AA)
- [ ] Design: Review de responsividade (mobile/tablet/desktop)

## Tasks / Subtasks
- [x] Task 1: Criar pagina de registro (AC: 1, 8, 9)
  - [x] Form com React Hook Form + Zod schema
  - [x] Campos: nome, email, senha, confirmar senha, tipo usuario
  - [x] Checkbox de aceite dos termos de uso
  - [x] Design: Split layout consistente com login page
- [x] Task 2: Integrar Supabase Auth no registro (AC: 2)
  - [x] supabase.auth.signUp() com metadata (full_name, user_type)
  - [x] Tratamento de erros (email ja existe, senha fraca, etc.)
  - [x] Toast de sucesso/erro com Sonner
- [x] Task 3: Integrar Supabase Auth no login (AC: 2)
  - [x] supabase.auth.signInWithPassword()
  - [x] Tratamento de erros
  - [x] Redirect pos-login para /dashboard
- [x] Task 4: Criar flow de recuperacao de senha (AC: 3)
  - [x] Pagina /esqueci-senha com campo de email
  - [x] supabase.auth.resetPasswordForEmail()
  - [x] Pagina /redefinir-senha para definir nova senha
- [x] Task 5: Criar middleware de autenticacao (AC: 5, 6)
  - [x] Next.js middleware.ts verificando sessao Supabase
  - [x] Redirect /login se nao autenticado em rotas protegidas
  - [x] Redirect /dashboard se autenticado tentando acessar /login
- [x] Task 6: Criar pagina /dashboard placeholder (AC: 6)
  - [x] Pagina basica mostrando "Bem-vindo, {nome}" apos login
- [x] Task 7: Validacao e testes (AC: 4, 7)
  - [x] Schemas Zod para registro e login
  - [x] Toast notifications via Sonner para todos os estados
  - [x] Build verification

## Dev Notes
**Auth Ref:** docs/architecture/architecture.md secao 1 (Backend > Auth)
**Supabase Auth:** Usar `@supabase/ssr` para server-side auth com cookies
**Supabase Client:** Ja existe em src/lib/supabase/client.ts e server.ts (Story 1.1)
**Design Ref:** Login page ja existe em src/app/(auth)/login/page.tsx (Story 1.3) — manter consistencia visual
**LGPD:** PRD secao 4, NFR-05 — Conformidade obrigatoria
**User Types para select:** Admin Nacional, Confederacao, Federacao, Clube/Centro, Tecnico, Atleta (PRD secao 2)

### Testing
- Testar fluxo completo: registro → confirmacao email → login → redirect dashboard
- Testar recuperacao de senha
- Testar middleware redirect (logado vs nao logado)
- Testar validacoes Zod (email invalido, senha curta, etc.)
- Build: `npm run build` sem erros

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-26 | 1.0 | Story criada | @sm (River) |

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6 (1M context)

### Debug Log References
- Zod v4 API diff: `required_error` → `message` para z.enum() e z.literal()
- Next.js 16: middleware convention deprecated → "proxy" (warning only, still functional)

### Completion Notes List
- Pagina de registro com split layout, 6 campos + checkbox LGPD
- Login page atualizada com React Hook Form + Supabase Auth funcional
- Esqueci senha com resetPasswordForEmail e estado de sucesso
- Redefinir senha com updateUser e redirect para login
- Middleware protege /dashboard/*, redireciona auth routes se logado
- Dashboard placeholder com nome do usuario e botao de logout
- API route /api/auth/signout para sign out server-side
- Schemas Zod: loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema
- Build compila com zero erros — 8 rotas geradas

### File List
- packages/web/src/lib/validations/auth.ts (CREATED)
- packages/web/src/middleware.ts (CREATED)
- packages/web/src/app/(auth)/login/page.tsx (MODIFIED — added auth functionality)
- packages/web/src/app/(auth)/criar-conta/page.tsx (CREATED)
- packages/web/src/app/(auth)/esqueci-senha/page.tsx (CREATED)
- packages/web/src/app/(auth)/redefinir-senha/page.tsx (CREATED)
- packages/web/src/app/(dashboard)/dashboard/page.tsx (CREATED)
- packages/web/src/app/api/auth/signout/route.ts (CREATED)
