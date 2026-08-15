from openai import OpenAI
from pathlib import Path
client=OpenAI()
prompt='''Redija em português brasileiro, somente Markdown, três registros aprofundados para Formulação de Caso em Psicoterapia; Modelo Transteórico de Mudança; Prática Baseada em Evidências em Psicologia. Para cada registro use: nome, descricao_curta, definicao, ideia_central, origem, periodo_historico, contexto_historico, visao_ser_humano, visao_psique, visao_desenvolvimento, visao_sofrimento, teoria_da_mudanca, apresentacao_pratica, papel_terapeuta, papel_paciente, relacao_terapeutica, foco_clinico, perspectiva_academica, evidencias, debates, criticas_limitacoes, leituras_fundamentais. Use ### e ---. Não invente números, estudos ou URLs. Diferencie ferramenta de formulação, modelo de estágios e perspectiva epistemológico-clínica.'''
r=client.chat.completions.create(model='gpt-5-mini',messages=[{'role':'user','content':prompt}],max_completion_tokens=9000)
t=r.choices[0].message.content or ''
Path('/home/ubuntu/cecistudy_pesquisa/entregas/08_integrativa_ecletica_lote2.md').write_text(t,encoding='utf-8')
print(len(t))
