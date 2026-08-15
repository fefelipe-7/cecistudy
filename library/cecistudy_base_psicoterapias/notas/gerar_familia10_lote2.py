from openai import OpenAI
from pathlib import Path
client=OpenAI()
prompt='''Redija em português brasileiro, somente Markdown, quatro registros aprofundados para Terapia Breve (guarda-chuva geral); Aconselhamento de Carreira; Terapia Baseada em Forças; Terapia de Casal e Família de Curto Prazo (MRI). Para cada registro use: nome, descricao_curta, definicao, ideia_central, origem, periodo_historico, contexto_historico, visao_ser_humano, visao_psique, visao_desenvolvimento, visao_sofrimento, teoria_da_mudanca, apresentacao_pratica, papel_terapeuta, papel_paciente, relacao_terapeutica, foco_clinico, perspectiva_academica, evidencias, debates, criticas_limitacoes, leituras_fundamentais. Use ### e ---. Não invente números, estudos ou URLs. Diferencie categoria ampla, aconselhamento, perspectiva baseada em forças e modelo MRI; qualifique evidência.'''
r=client.chat.completions.create(model='gpt-5-mini',messages=[{'role':'user','content':prompt}],max_completion_tokens=11000)
t=r.choices[0].message.content or ''
Path('/home/ubuntu/cecistudy_pesquisa/entregas/10_pragmaticos_objetivo_lote2.md').write_text(t,encoding='utf-8')
print(len(t))
