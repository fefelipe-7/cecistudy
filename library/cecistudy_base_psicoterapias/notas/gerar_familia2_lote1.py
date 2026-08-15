from openai import OpenAI
from pathlib import Path

client = OpenAI()
prompt = '''Redija em português brasileiro dois registros de banco de dados, extensos e academicamente cautelosos, para as abordagens Terapia Existencial-Humanista e Terapia Focada nas Emoções. Para cada uma, use exatamente estes campos em Markdown: nome, descricao_curta, definicao, ideia_central, origem, periodo_historico, contexto_historico, visao_ser_humano, visao_psique, visao_desenvolvimento, visao_sofrimento, teoria_da_mudanca, apresentacao_pratica, papel_terapeuta, papel_paciente, relacao_terapeutica, foco_clinico, perspectiva_academica, evidencias, debates, criticas_limitacoes, leituras_fundamentais. Coloque ### antes de cada campo e uma linha --- entre abordagens. Não escreva referência numerada e não invente dados. Explique que terapia existencial-humanista é família plural; explique a EFT de Greenberg como derivada de vertentes humanistas/experienciais e de apego, sem confundi-la com toda psicoterapia focada em emoção. Para evidências, qualifique por população e problema e reconheça limites. Somente Markdown, sem introdução.'''
resp = client.chat.completions.create(
    model="gpt-5-mini",
    messages=[{"role":"user","content":prompt}],
    max_completion_tokens=9000,
)
text = resp.choices[0].message.content or ""
Path("/home/ubuntu/cecistudy_pesquisa/entregas/02_existencial_humanista_lote1.md").write_text(text, encoding="utf-8")
print(f"Gerado: {len(text)} caracteres")
