from openai import OpenAI
from pathlib import Path
client = OpenAI()
prompt = '''Escreva em português brasileiro quatro registros de banco de dados, extensos e academicamente cautelosos, para Daseinsanalyse; Terapia Existencial Britânica; Psicologia Humanista; Terapia Transpessoal. Para cada registro use exatamente os 22 campos em Markdown: nome, descricao_curta, definicao, ideia_central, origem, periodo_historico, contexto_historico, visao_ser_humano, visao_psique, visao_desenvolvimento, visao_sofrimento, teoria_da_mudanca, apresentacao_pratica, papel_terapeuta, papel_paciente, relacao_terapeutica, foco_clinico, perspectiva_academica, evidencias, debates, criticas_limitacoes, leituras_fundamentais. Coloque ### antes de cada campo e --- entre registros. Não invente estudos, números ou URLs. Distinga claramente a Daseinsanalyse de Binswanger/Boss, vertentes existenciais britânicas e a tradição norte-americana de May/Yalom, Psicologia Humanista como movimento amplo e Terapia Transpessoal como campo plural de evidência direta limitada. Somente Markdown.'''
r = client.chat.completions.create(model='gpt-5-mini', messages=[{'role':'user','content':prompt}], max_completion_tokens=12000)
text = r.choices[0].message.content or ''
Path('/home/ubuntu/cecistudy_pesquisa/entregas/02_existencial_humanista_lote3.md').write_text(text, encoding='utf-8')
print(f'Gerado: {len(text)} caracteres')
