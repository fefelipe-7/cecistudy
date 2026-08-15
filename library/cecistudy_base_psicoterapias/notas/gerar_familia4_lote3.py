from openai import OpenAI
from pathlib import Path
client = OpenAI()
prompt = '''Redija em português brasileiro, somente em Markdown, dois registros aprofundados para Terapia do Processamento Cognitivo (para TEPT) e Terapia Cognitivo-Comportamental Baseada em Protocolo Transdiagnóstico. Para cada registro, use estes 22 campos exatamente: nome, descricao_curta, definicao, ideia_central, origem, periodo_historico, contexto_historico, visao_ser_humano, visao_psique, visao_desenvolvimento, visao_sofrimento, teoria_da_mudanca, apresentacao_pratica, papel_terapeuta, papel_paciente, relacao_terapeutica, foco_clinico, perspectiva_academica, evidencias, debates, criticas_limitacoes, leituras_fundamentais. Use ### antes dos campos e --- entre registros. Não invente estudos, números ou URLs. Explique que CPT é tratamento estruturado para TEPT e transdiagnóstico não significa aplicável sem formulação individual. Qualifique evidência e cuidado com exposição a trauma. Escreva 1–3 parágrafos por campo.'''
r = client.chat.completions.create(model='gpt-5-mini', messages=[{'role':'user','content':prompt}], max_completion_tokens=7500)
text = r.choices[0].message.content or ''
Path('/home/ubuntu/cecistudy_pesquisa/entregas/04_cognitiva_tcc_lote3.md').write_text(text, encoding='utf-8')
print(f'Gerado: {len(text)} caracteres')
