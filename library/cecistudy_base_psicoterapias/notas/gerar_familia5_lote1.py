from openai import OpenAI
from pathlib import Path
client = OpenAI()
prompt = '''Em português brasileiro, somente Markdown, redija quatro registros densos para Terapia Familiar Estrutural (Minuchin), Terapia Familiar Estratégica (Haley), Terapia Familiar Boweniana e Escola de Milão. Para cada um use: nome, descricao_curta, definicao, ideia_central, origem, periodo_historico, contexto_historico, visao_ser_humano, visao_psique, visao_desenvolvimento, visao_sofrimento, teoria_da_mudanca, apresentacao_pratica, papel_terapeuta, papel_paciente, relacao_terapeutica, foco_clinico, perspectiva_academica, evidencias, debates, criticas_limitacoes, leituras_fundamentais. Use ### e ---; não invente estudos/números/URLs. Explique circularidade sem culpar famílias e mantenha cautela em evidências.'''
r=client.chat.completions.create(model='gpt-5-mini',messages=[{'role':'user','content':prompt}],max_completion_tokens=12000)
t=r.choices[0].message.content or ''
Path('/home/ubuntu/cecistudy_pesquisa/entregas/05_sistemica_lote1.md').write_text(t,encoding='utf-8')
print(len(t))
