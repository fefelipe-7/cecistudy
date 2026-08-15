from openai import OpenAI
from pathlib import Path
client=OpenAI()
prompt='''Redija em português brasileiro, somente Markdown, cinco registros aprofundados para Terapia Focada em Soluções; Entrevista Motivacional; Terapia da Realidade; Terapia de Resolução de Problemas; Terapia Breve Orientada a Metas. Para cada registro use exatamente: nome, descricao_curta, definicao, ideia_central, origem, periodo_historico, contexto_historico, visao_ser_humano, visao_psique, visao_desenvolvimento, visao_sofrimento, teoria_da_mudanca, apresentacao_pratica, papel_terapeuta, papel_paciente, relacao_terapeutica, foco_clinico, perspectiva_academica, evidencias, debates, criticas_limitacoes, leituras_fundamentais. Use ### e ---. Não invente estudos/números/URLs. Distinga entrevista motivacional de terapia completa, diferencie solução de simples positivismo, e qualifique evidência por problema/população.'''
r=client.chat.completions.create(model='gpt-5-mini',messages=[{'role':'user','content':prompt}],max_completion_tokens=12000)
t=r.choices[0].message.content or ''
Path('/home/ubuntu/cecistudy_pesquisa/entregas/10_pragmaticos_objetivo_lote1.md').write_text(t,encoding='utf-8')
print(len(t))
