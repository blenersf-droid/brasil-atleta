# Uso de MCP — Regras Mínimas

Sempre preferir ferramentas nativas (Read, Write, Edit, Glob, Grep, Bash) a servidores MCP para operações locais.

| Tarefa | Ferramenta |
|--------|-----------|
| Ler/escrever/buscar arquivos locais | Read / Write / Edit / Glob / Grep |
| Comandos no host | Bash |
| Busca na web | WebSearch / EXA (`mcp__docker-gateway__web_search_exa`) |
| Documentação de bibliotecas | Context7 (via docker-gateway) |
| Scraping/social media | Apify (via docker-gateway) |
| Banco de dados (Supabase) | `mcp__supabase__*` ou Supabase CLI |
| Automação de browser | claude-in-chrome (carregar via ToolSearch) |

Nunca usar `docker-gateway`/desktop-commander para operações em arquivos locais — causa erros de path. Usar apenas para MCPs que rodam dentro do Docker (EXA, Context7, Apify).
