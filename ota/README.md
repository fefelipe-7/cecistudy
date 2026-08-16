# OTA self-hosted do cecistudy ♡

Atualizações **over-the-air** do bundle web (HTML/CSS/JS do Capacitor) servidas
de graça pelo **GitHub Pages**, sem servidor próprio. O app nativo (Android/iOS)
baixa, valida e troca o bundle sozinho — sem gerar um `.ipa`/`.apk` novo a cada
mudança de interface.

> Este diretório (`ota/`) contém só documentação e o exemplo do manifest. O site
> real (`version.json` + `bundles/`) é **gerado pelo pipeline de release**
> (`.github/workflows/release.yml` → `.github/scripts/ota-manifest.mjs`) e publicado
> no GitHub Pages.

## Como funciona

```
        tag v1.2.3 (ou release manual)
                    │
                    ▼
        GitHub Actions (release.yml)
        npm ci → lint → test → build web
        zip do dist/ → sha256
        build APK (android) + IPA (ios)
        ▼
  GitHub Release v1.2.3          GitHub Pages (OTA)
  cecistudy-1.2.3-android.apk     version.json + bundles/ (últimas 5)
  cecistudy-1.2.3-ios.ipa         └─ version = 1.2.3 (a do release)
  cecistudy-1.2.3.zip             └─ bundles/cecistudy-1.2.3.zip
                    │
        ┌───────────┴───────────┐
        │                       │
  version.json            bundles/1.2.3.zip
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
- **Bundle:** `https://fefelipe-7.github.io/cecistudy/bundles/cecistudy-<versão>.zip`
- **Versão:** semver da **tag do release** (ex.: tag `v1.2.3` → OTA `1.2.3`). Todo
  release vira também uma atualização over-the-air.

## Setup único (manual)

1. No repositório, **Settings → Pages → Source → "GitHub Actions"** e salvar.
2. Um bundle só chega ao dispositivo depois que ele tem o **plugin nativo**
   (`@capgo/capacitor-updater`) embutido — ou seja, é preciso gerar **uma** build
   nativa nova (IPA/APK) com o plugin. Depois disso, mudanças web são OTA.
   - `npm i @capgo/capacitor-updater` → `npx cap sync` → build via CI
     (`.github/workflows/release.yml`) ou local.
3. **Release:** criar uma tag `v*` (ex.: `git tag v1.2.3 && git push origin v1.2.3`)
   ou rodar o workflow `release.yml` manualmente (Actions → "release" → Run workflow).

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
2. **Manual:** re-executar o workflow `release.yml` (dispatch) com a versão de um
   commit antigo, ou apontar `version/url/checksum` do `version.json` para uma versão
   antiga preservada em `available`.
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