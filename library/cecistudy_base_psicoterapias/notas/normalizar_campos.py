from pathlib import Path

fields = [
    "nome", "descricao_curta", "definicao", "ideia_central", "origem",
    "periodo_historico", "contexto_historico", "visao_ser_humano",
    "visao_psique", "visao_desenvolvimento", "visao_sofrimento",
    "teoria_da_mudanca", "apresentacao_pratica", "papel_terapeuta",
    "papel_paciente", "relacao_terapeutica", "foco_clinico",
    "perspectiva_academica", "evidencias", "debates", "criticas_limitacoes",
    "leituras_fundamentais",
]

for number in range(5, 11):
    files = list(Path('/home/ubuntu/cecistudy_pesquisa/entregas').glob(f'{number:02d}_*_registros.md'))
    if not files:
        continue
    path = files[0]
    text = path.read_text(encoding='utf-8')
    for field in fields:
        text = text.replace(f'\n{field}: ', f'\n### {field}\n\n')
    text = text.replace('\n### Psicoterapia Interpessoal (IPT)\n---\n', '\n## Registro `abordagem` — Psicoterapia Interpessoal (IPT)\n\n')
    path.write_text(text, encoding='utf-8')
    print(path.name)
