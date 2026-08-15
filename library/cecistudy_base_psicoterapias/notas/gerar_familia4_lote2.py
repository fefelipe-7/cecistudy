from openai import OpenAI
from pathlib import Path
client = OpenAI()
prompt = '''Redija em português brasileiro, somente em Markdown, quatro registros aprofundados para: Terapia Cognitiva Baseada em Mindfulness (MBCT); Terapia de Aceitação e Compromisso (ACT); Terapia Focada na Compaixão; Terapia Metacognitiva. Para cada registro, use exatamente os 22 campos: nome, descricao_curta, definicao, ideia_central, origem, periodo_historico, contexto_historico, visao_ser_humano, visao_psique, visao_desenvolvimento, visao_sofrimento, teoria_da_mudanca, apresentacao_pratica, papel_terapeuta, papel_paciente, relacao_terapeutica, foco_clinico, perspectiva_academica, evidencias, debates, criticas_limitacoes, leituras_fundamentais. Use ### antes de cada campo e --- entre registros. Diferencie MBCT, ACT, CFT e Terapia Metacognitiva de Wells, não invente estudos, números ou URLs, e qualifique rigorosamente a evidência e limites. Escreva 1–3 parágrafos por campo, com linguagem técnica responsável.'''
r = client.chat.completions.create(model='gpt-5-mini', messages=[{'role':'user','content':prompt}], max_completion_tokens=12000)
text = r.choices[0].message.content or ''
Path('/home/ubuntu/cecistudy_pesquisa/entregas/04_cognitiva_tcc_lote2.md').write_text(text, encoding='utf-8')
print(f'Gerado: {len(text)} caracteres')
