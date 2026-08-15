from openai import OpenAI
from pathlib import Path
client = OpenAI()
prompt = '''Redija em português brasileiro, somente em Markdown, quatro registros aprofundados para um banco de psicoterapias: Terapia Cognitiva (Beck); Terapia Racional-Emotiva Comportamental (REBT); TCC Integrada/Geral; Terapia do Esquema. Para cada registro, use exatamente estes 22 campos: nome, descricao_curta, definicao, ideia_central, origem, periodo_historico, contexto_historico, visao_ser_humano, visao_psique, visao_desenvolvimento, visao_sofrimento, teoria_da_mudanca, apresentacao_pratica, papel_terapeuta, papel_paciente, relacao_terapeutica, foco_clinico, perspectiva_academica, evidencias, debates, criticas_limitacoes, leituras_fundamentais. Use ### antes de cada campo e --- entre registros. Não invente dados, estudos ou URLs. Diferencie claramente Beck e Ellis, TCC como família e terapia do esquema como modelo integrativo. Qualifique a evidência. Escreva 1–3 parágrafos por campo, em tom acadêmico e clínico responsável.'''
r = client.chat.completions.create(model='gpt-5-mini', messages=[{'role':'user','content':prompt}], max_completion_tokens=12000)
text = r.choices[0].message.content or ''
Path('/home/ubuntu/cecistudy_pesquisa/entregas/04_cognitiva_tcc_lote1.md').write_text(text, encoding='utf-8')
print(f'Gerado: {len(text)} caracteres')
