from openai import OpenAI
from pathlib import Path
client = OpenAI()
prompt = '''Redija em português brasileiro e somente Markdown seis registros aprofundados para: Terapia Centrada em Soluções; Terapia Familiar Geral; Terapia de Casais Integrativa; Terapia Familiar Experiencial; Terapia Familiar Baseada em Apego; Terapia Multissistêmica. Para cada registro use exatamente: nome, descricao_curta, definicao, ideia_central, origem, periodo_historico, contexto_historico, visao_ser_humano, visao_psique, visao_desenvolvimento, visao_sofrimento, teoria_da_mudanca, apresentacao_pratica, papel_terapeuta, papel_paciente, relacao_terapeutica, foco_clinico, perspectiva_academica, evidencias, debates, criticas_limitacoes, leituras_fundamentais. Use ### para cada campo e --- entre registros. Não invente números, estudos ou URLs. Não culpabilize famílias. Explique diferenças entre técnica breve, escola familiar e modelo multissistêmico. Qualifique evidências.'''
r=client.chat.completions.create(model='gpt-5-mini',messages=[{'role':'user','content':prompt}],max_completion_tokens=14000)
t=r.choices[0].message.content or ''
Path('/home/ubuntu/cecistudy_pesquisa/entregas/05_sistemica_lote2.md').write_text(t,encoding='utf-8')
print(len(t))
