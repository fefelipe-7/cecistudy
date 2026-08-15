from openai import OpenAI
from pathlib import Path

client = OpenAI()
prompt = '''Redija em português brasileiro registros de banco de dados, extensos e academicamente cautelosos, para Logoterapia e Terapia Experiencial. Para cada uma, use exatamente os campos: nome, descricao_curta, definicao, ideia_central, origem, periodo_historico, contexto_historico, visao_ser_humano, visao_psique, visao_desenvolvimento, visao_sofrimento, teoria_da_mudanca, apresentacao_pratica, papel_terapeuta, papel_paciente, relacao_terapeutica, foco_clinico, perspectiva_academica, evidencias, debates, criticas_limitacoes, leituras_fundamentais. Coloque ### antes de cada campo e --- entre abordagens. Não invente números, estudos ou URLs; explique que Logoterapia de Frankl trata sentido e sofrimento sem prometer cura por sentido e que Terapia Experiencial é guarda-chuva plural (Gendlin, focusing, vertentes humanistas/experienciais), não protocolo unitário. Qualifique evidência, debates e limites. Somente Markdown.'''
resp = client.chat.completions.create(
    model="gpt-5-mini",
    messages=[{"role":"user","content":prompt}],
    max_completion_tokens=9000,
)
text = resp.choices[0].message.content or ""
Path("/home/ubuntu/cecistudy_pesquisa/entregas/02_existencial_humanista_lote2.md").write_text(text, encoding="utf-8")
print(f"Gerado: {len(text)} caracteres")
