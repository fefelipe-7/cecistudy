# Backup e Sync – Guia de Usuário

## Exportar backup
Perfil → seus dados → exportar backup
* Web/PWA: download automático `cecistudy-backup-YYYY-MM-DD.json`
* Nativo: download para Downloads
* Desktop: download para Downloads

Opcional: defina senha no modal para criptografar com AES-GCM.

## Importar backup
Perfil → seus dados → importar backup
Selecione o arquivo `.json`. O app mostra prévia: formato, schema, exportado em.
Confirmar substitui dados atuais.
Se o arquivo estiver criptografado, será solicitado a senha.

## Resetar cantinho
Perfil → seus dados → resetar dados. Confirmação obrigatória.

## Sync GitHub
Disponível apenas em mobile. Perfil → Sync GitHub.
* Cria repositório privado `sync-package.json`
* Sem OAuth: usa GitHub CLI / token manual
* Histórico mantido localmente

Desktop: o card de Sync é ocultado. Atualizações de app via OTA `OtaSection`.
