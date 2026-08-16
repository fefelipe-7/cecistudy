# OTA self-hosted do cecistudy ♡

Atualizações **over-the-air** do bundle web (HTML/CSS/JS do Capacitor) servidas
de graça pelo **GitHub Pages**, sem servidor próprio. O app nativo (Android/iOS)
baixa, valida e troca o bundle sozinho — sem gerar um `.ipa`/`.apk` novo a cada
mudança de interface.

> Este diretório (`ota/`) contém só documentação e o exemplo do manifest. O site
> real (`version.json` + `bundles/`) é **gerado pelo CI** em `.github/workflows/ota.yml`
> e publicado no GitHub Pages.

## Como funciona

```
       push na main (mudanças em src/ etc.)
                    │
                    ▼
            GitHub Actions (ota.yml)
                    │  npm ci → lint → test → build
                    │  zip do dist/ → sha256
                    │  version.json + bundles/ (últimas 5 versões)
                    ▼
                GitHub Pages
                    │
        ┌───────────┴───────────┐
        │                       │
  version.json            bundles/1.0.<n>.zip
        │                       │
        └───────────┬───────────┘
                    ▼
               app nativo
     (src/lib/ota.ts + @capgo/capacitor-updater)
        verifica versão → baixa → valida hash → troca no próximo boot
```

- **Cliente:** `src/lib/ota.ts` (modo manual do `@capgo/capacitor-updater`).
  Checa o manifest na abertura do app, baixa em background, agenda a troca para a
  próxima abertura e avisa ("atualização pronta ♡"). Dá para aplicar na hora pelo
  modal ou pelo Perfil → "atualização do app".
- **Manifest:** `https://fefelipe-7.github.io/cecistudy/version.json`
- **Bundle:** `https://fefelipe-7.github.io/cecistudy/bundles/cecistudy-1.0.<n>.zip`
- **Versão:** semver derivada automaticamente (`1.0.<nº de commits>`), sempre crescente.

## Setup único (manual)

1. No repositório, **Settings → Pages → Source → "GitHub Actions"** e salvar.
2. Um bundle só chega ao dispositivo depois que ele tem o **plugin nativo**
   (`@capgo/capacitor-updater`) embutido — ou seja, é preciso gerar **uma** build
   nativa nova (IPA/APK) com o plugin. Depois disso, mudanças web são OTA.
   - `npm i @capgo/capacitor-updater` → `npx cap sync` → build via CI
     (`.github/workflows/native-build.yml`) ou local.

## version.json (schema)

```json
{
  "version": "1.0.7",
  "url": "https://fefelipe-7.github.io/cecistudy/bundles/cecistudy-1.0.7.zip",
  "checksum": "<sha256 hex do zip>",
  "releasedAt": "2026-08-15T12:00:00Z",
  "available": [
    { "version": "1.0.7", "url": "...", "checksum": "..." },
    { "version": "1.0.6", "url": "...", "checksum": "..." }
  ]
}
```

O app usa `version`, `url` e `checksum`. `available` guarda as últimas versões
para rollback. Veja `version.json.example`.

## Rollback

1. **Automático (crash):** se o bundle novo travar antes do JS marcar o app como
   pronto (`notifyAppReady()`), o plugin reverte sozinho para a versão anterior na
   próxima abertura.
2. **Manual:** re-executar o workflow `ota.yml` num commit antigo (GitHub Actions
   → Re-run) restaura aquele bundle como `latest`.
3. **Preservado:** `available` guarda as últimas 5 versões em `bundles/` — dá para
   apontar `version/url/checksum` para uma antiga sem rebuild (editar o `version.json`
   no site ou ajustar o workflow).

## Limites e observações

- **Só web é OTA.** Mudança nativa (Swift/Java, plugins, `Info.plist`,
  permissões, entitlements) exige nova build nativa e publicação normal.
- **Apple:** atualizar JS/HTML remoto é aceito para conteúdo web, mas não pode
  ser usado para contornar a revisão da App Store nem mudar a finalidade do app.
  Para uso pessoal/TestFlight isso costuma ser tranquilo; vale ler as diretrizes.
- **CORS:** o GitHub Pages responde com `Access-Control-Allow-Origin: *` (site
  público), então o `fetch` do `version.json` funciona direto do WebView.
- **Dados:** no nativo a persistência é via `@capacitor/preferences` (não
  `localStorage`), então a troca de bundle não afeta os dados da Ceci.
- **HTTP não funciona** (Android bloqueia cleartext) — o endpoint precisa ser HTTPS
  (o GitHub Pages é).