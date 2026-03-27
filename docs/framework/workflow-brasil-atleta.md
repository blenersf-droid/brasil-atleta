# Brasil Atleta — Workflow de Desenvolvimento

## SDC Expandido com Design Squad

O projeto Brasil Atleta utiliza o Story Development Cycle (SDC) do AIOX com uma camada adicional obrigatoria de Design System review para toda story que envolva interface de usuario.

### Fluxo Completo

```
1. @pm (Morgan)     → Spec Pipeline: PRD, requisitos, complexidade
2. @architect (Aria) → Arquitetura, tech stack, decisoes tecnicas
3. @data-engineer    → Schema detalhado, RLS, migrations
4. @sm (River)       → Criar stories formais com template padrao
5. @po (Pax)         → Validar stories (checklist 10 pontos)
6. DESIGN SQUAD      → Design review/criacao para stories com UI
7. @dev (Dex)        → Implementar stories validadas + design aprovado
8. @qa (Quinn)       → QA Gate (7 checks)
9. @devops (Gage)    → Git push, PR, CI/CD
```

### Regra: Design Squad no SDC

| Tipo de Story | Design Squad Envolvido? | Acao |
|---------------|------------------------|------|
| Story com UI nova (paginas, dashboards) | SIM — obrigatorio | `/design-squad:design-chief` define layout, `/design-squad:ux-designer` revisa fluxo |
| Story com componentes novos | SIM — obrigatorio | `/design-squad:design-system-architect` ou `/design-squad:brad-frost` (Atomic Design) |
| Story backend-only (API, schema, RLS) | NAO | Apenas @dev + @qa |
| Story de infra/devops | NAO | Apenas @devops |
| Story de IA/analytics | PARCIAL | Design review apenas se tiver dashboard/visualizacao |

### Design Squad — Agentes Disponiveis

| Agente | Quando Usar |
|--------|-------------|
| `/design-squad:design-chief` | Triagem, orquestracao, revisao geral |
| `/design-squad:ux-designer` | Fluxos de usuario, wireframes, usabilidade |
| `/design-squad:ui-engineer` | Implementacao de componentes UI |
| `/design-squad:design-system-architect` | Tokens, padroes, escalabilidade do DS |
| `/design-squad:brad-frost` | Atomic Design, composicao de componentes |
| `/design-squad:dan-mall` | Estrategia de design system |
| `/design-squad:visual-generator` | Assets visuais, ilustracoes |

### Skill Complementar

Para paginas e componentes de alto impacto visual, usar tambem:
- `/frontend-design:frontend-design` — Design de alta qualidade, anti-AI-slop

### Artefatos de Design por Story

Toda story com UI deve incluir na secao de subtasks:
- [ ] Design: Layout/wireframe definido
- [ ] Design: Componentes do Design System identificados (novos vs existentes)
- [ ] Design: Review de acessibilidade (WCAG 2.1 AA)
- [ ] Design: Review de responsividade (mobile/tablet/desktop)
