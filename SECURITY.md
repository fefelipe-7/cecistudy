# Segurança

## Como reportar uma vulnerabilidade

**Não abra issue pública** com detalhes de falha, payload ou caminho de exploit.

Use o canal privado do GitHub: **Security → Advisories → Report a vulnerability**
neste repositório. Se o canal estiver indisponível, abra uma issue **sem
detalhes** pedindo contato privado.

Inclua, se puder: versão do app (Perfil → sobre), plataforma, passos para
reproduzir e o impacto que você imagina.

## Escopo

Este app é local-first: não há backend próprio, login nem servidor de dados da
usuária. Os pontos sensíveis reais são:

- **OTA** — o bundle web é baixado do GitHub Pages e validado por SHA-256
  (`src/lib/ota.ts`). Manifesto ou bundle adulterado é vulnerabilidade Alta.
- **Backup e sincronização** — exportação/importação de dados e sincronização
  opcional via repositório privado com PAT.
- **Dados no dispositivo** — SQLite `cecistudy_user` e `localStorage`.
- **Segredos de assinatura** — vivem só em secrets do GitHub Actions; nunca no
  repositório.

## O que não é vulnerabilidade

- Conteúdo editorial desatualizado ou impreciso (isso é issue normal).
- Falta de login/senha: o produto não tem conta.
- Alguém com acesso físico desbloqueado ao aparelho lendo o banco local.
