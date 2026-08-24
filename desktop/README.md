# cecistudy ♡ — desktop (Tauri 2)

Versão desktop do cecistudy: o **mesmo bundle web** da raiz (`dist/`) empacotado
em um app nativo Windows/macOS/Linux via Tauri 2. Nada de código do app mora aqui —
esta pasta é a casca nativa + toolchain.

```
desktop/
├── src-tauri/
│   ├── src/main.rs · lib.rs   ← shell + plugins (notification, updater, process)
│   ├── capabilities/          ← permissões Tauri v2
│   ├── icons/                 ← gerado por `npx tauri icon` (commitado)
│   └── tauri.conf.json        ← frontendDist aponta para ../../dist
├── keyring/                   ← chaves do updater (PRIVADA fora do git!)
└── package.json               ← scripts dev/build (CLI do Tauri isolada aqui)
```

## Pré-requisitos

- [Rust](https://rustup.rs) stable (`cargo --version`)
- **Windows:** MSVC Build Tools (+ WebView2, incluso no Win10/11)
- **Linux:** `libwebkit2gtk-4.1-dev libgtk-3-dev` etc.
- Node 22

### ⚠️ Limitação desta máquina (diagnóstico de 2026-08)

**Build local funciona**, com o setup abaixo (o CI continua sendo o caminho para instaladores):

1. **Toolchain C:** Rust `gnullvm` + **llvm-mingw 20260616** extraído em
   `%LOCALAPPDATA%\llvm-mingw-20260616-ucrt-x86_64` (bin no PATH do usuário).
2. **Linker:** `~/.cargo/config.toml` precisa apontar pro sysroot do mingw e puxar um
   *stub* com símbolos que o mingw-w64-crt novo removeu mas o CRT do Rust ainda referencia:

   ```toml
   [target.x86_64-pc-windows-gnullvm]
   linker = 'rust-lld'
   rustflags = ['-L', '<llvm-mingw>/x86_64-w64-mingw32/lib', '-C', 'link-arg=-lgnullvm_crt_stub']
   ```

   O `libgnullvm_crt_stub.a` (com `__mingw_oldexcpt_handler` e `_gnu_exception_handler`)
   vive dentro do diretório `x86_64-w64-mingw32/lib` do llvm-mingw.
3. **Executável:** após `cargo build --release`, copiar `bin/libunwind.dll` do llvm-mingw
   para junto do exe (`target/release/`) — senão falha com `STATUS_DLL_NOT_FOUND`.
4. **Instaladores (.msi/.exe setup) não geram localmente:** o Tauri baixa WiX/NSIS do
   GitHub (bloqueado nesta rede). Os bundles saem pelo job `desktop` do CI.

Histórico do problema original: `cc-rs` não encontrava `clang.exe`; o GitHub está
bloqueado na rede (api/github/objects = 000), então o llvm-mingw foi baixado manualmente
no navegador. npm registry, PyPI e o CDN da Microsoft funcionam.

## Fluxo diário

```bash
# 1. builda o bundle web na raiz (ou deixe rodando: npm run dev)
npm run build            # na raiz do repo

# 2. abre o app desktop
cd desktop
npm install              # primeira vez
npm run dev              # usa devUrl http://localhost:3000 → rode `npm run dev` na raiz p/ HMR
npm run build            # gera instaladores em src-tauri/target/release/bundle/
```

> `tauri dev` espera o dev server da raiz na porta 3000 (`devUrl`). Para testar o
> bundle de produção, use `npm run build` na raiz e depois um preview estático ou
> `tauri build`.

## Versão

A versão base vive em `src-tauri/tauri.conf.json` (`version`). O CI sobrescreve com
a versão do release via `--config "{\"version\":\"X\"}"`. A UI lê a versão do app
pelo próprio bundle web (igual mobile).

## Auto-update (Tauri updater)

- Endpoint: `https://github.com/fefelipe-7/cecistudy/releases/latest/download/latest.json`
- Chaves: geradas com `npx tauri signer generate -w keyring/cecistudy.key`.
  - **Pública** (`keyring/*.key.pub`): commitada no `tauri.conf.json` (`plugins.updater.pubkey`).
  - **Privada** (`keyring/cecistudy.key`, sem senha): **fora do git** — guarde no
    secret `TAURI_SIGNING_PRIVATE_KEY` do GitHub.
- No CI, com o secret presente, os bundles são assinados (`.sig`) e o job de release
  monta o `latest.json` via `.github/scripts/desktop-update-manifest.mjs`.
- Sem assinatura configurada, os instaladores saem normalmente — só o auto-update fica inativo.
- UI: Perfil → "atualização do app" (branch desktop de `PerfilView.tsx`).

## Lembrete diário no desktop

Reutiliza as configurações do app (Perfil → lembrete). No desktop o agendamento é
por **timer JS** (`src/lib/notifications.ts`): dispara no horário escolhido enquanto
o app estiver aberto (diferente do Android/iOS, que agenda pelo sistema).

## Layout desktop

Breakpoints Tailwind (`lg:`): sidebar esquerda fixa substitui a barra inferior/FAB
(`src/components/DesktopSidebar.tsx`); container de conteúdo alarga para
`lg:max-w-3xl xl:max-w-4xl`. Abaixo de `lg:` nada muda no mobile/web.
