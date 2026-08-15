from openai import OpenAI
from pathlib import Path
client=OpenAI()
prompt='''Redija em português brasileiro, somente Markdown, seis registros aprofundados para Terapia Feminista; Terapia Multicultural; Terapia Afirmativa LGBTQ+; Terapia Antirracista; Terapia Interseccional; Terapia Comunitária. Para cada registro use exatamente: nome, descricao_curta, definicao, ideia_central, origem, periodo_historico, contexto_historico, visao_ser_humano, visao_psique, visao_desenvolvimento, visao_sofrimento, teoria_da_mudanca, apresentacao_pratica, papel_terapeuta, papel_paciente, relacao_terapeutica, foco_clinico, perspectiva_academica, evidencias, debates, criticas_limitacoes, leituras_fundamentais. Use ### e ---. Não invente estudos/números/URLs. Diferencie perspectiva transversal, modalidade clínica e intervenção comunitária. Não apresente terapia afirmativa como identidade única de técnica; ressalte ética, competência cultural, poder e risco de práticas danosas.'''
r=client.chat.completions.create(model='gpt-5-mini',messages=[{'role':'user','content':prompt}],max_completion_tokens=14000)
t=r.choices[0].message.content or ''
Path('/home/ubuntu/cecistudy_pesquisa/entregas/09_social_cultural_genero_lote1.md').write_text(t,encoding='utf-8')
print(len(t))
