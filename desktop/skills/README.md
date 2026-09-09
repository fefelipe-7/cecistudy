# skills de referência — cecistudy desktop

área de skills de referência para o shell desktop do cecistudy ♡. aqui ficam apenas
arquivos de apoio (conhecimento/boas práticas), sem nenhum código de aplicação.

## skills disponíveis localmente

| pasta | descrição (resumo do SKILL.md) |
|---|---|
| `desktop/skills/vercel-react-best-practices` | diretrizes de performance para react/next.js mantidas pela vercel engineering: 62 regras em 8 categorias (eliminar waterfalls, otimizar bundle, server-side, client data fetching, re-render, rendering, javascript e padrões avançados). cobre fetching de dados, memoização, lazy loading e hidratação. útil ao escrever/revisar código react. |

não há nenhuma outra skill instalada nesta máquina.

## skills solicitadas que FALHARAM (não baixadas)

esta máquina fica atrás de um proxy com interceptação tls, o que quebra os instaladores
baseados em clone do github. resultados exatos:

| skill solicitada | comando tentado | resultado / motivo exato |
|---|---|---|
| `scoheart/vercel-composition-patterns` | `npx --yes skillmds add scoheart/vercel-composition-patterns` | criou a pasta mas **vazia** — o conteúdo do skill não veio do registry (bloqueado pelo proxy/tls). nenhuma SKILL.md útil foi gerada. |
| `Pythoughts-labs/react-frontend-skills` | `npx --yes skills add Pythoughts-labs/react-frontend-skills -a codex -s '*' -y` | `Authentication failed for https://github.com/Pythoughts-labs/react-frontend-skills.git` — o clone git é interceptado/barrado pelo proxy. |
| `hueyexe/frontend-agent-skills` | `npx --yes skills add hueyexe/frontend-agent-skills -a codex -s '*' -y` | `Authentication failed for https://github.com/hueyexe/frontend-agent-skills.git` — mesmo bloqueio de clone git pelo proxy. |

> as duas últimas usam clone de repositório github e falham com "Authentication failed"
> por causa do proxy de tls deste ambiente. isso é esperado aqui e não precisa ser repetido.
> para obtê-las, rode em uma máquina com acesso direto ao github (sem o proxy).

## recipe de instalação que FUNCIONA neste ambiente

o registry que funciona atrás do proxy é o `@cutdnoise/add-skill`. sempre desligue a
verificação de certificado antes (senão falha com "self-signed certificate in certificate chain"):

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"
npx --yes @cutdnoise/add-skill <skill-name>
```

até onde se sabe, **só `vercel-react-best-practices` existe nesse registry**. as outras
skills pedidas (composition-patterns, react-frontend-skills, frontend-agent-skills) não
estão nesse registry e precisam de uma máquina com acesso direto ao github.

### como adicionar uma skill nova baixada

se um comando acima produzir uma pasta válida (com `SKILL.md`), copie-a para
`desktop/skills/<nome>` preservando todos os arquivos:

```powershell
Copy-Item -LiteralPath <origem> -Destination desktop/skills/<nome> -Recurse -Force
```

depois registre-a neste README, na seção "skills disponíveis localmente".
