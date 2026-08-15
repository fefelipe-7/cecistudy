from openai import OpenAI
from pathlib import Path
client=OpenAI()
prompt='''Redija em português brasileiro e somente Markdown seis registros aprofundados para Psicoterapia Integrativa Geral; Ecletismo Técnico; Integração Assimilativa; Terapia Multimodal; Psicodinâmica Cíclica (Wachtel); Terapia de Aceitação e Compromisso como modelo integrativo/contextual. Para cada registro use exatamente os campos: nome, descricao_curta, definicao, ideia_central, origem, periodo_historico, contexto_historico, visao_ser_humano, visao_psique, visao_desenvolvimento, visao_sofrimento, teoria_da_mudanca, apresentacao_pratica, papel_terapeuta, papel_paciente, relacao_terapeutica, foco_clinico, perspectiva_academica, evidencias, debates, criticas_limitacoes, leituras_fundamentais. Use ### e ---. Não invente estudos/números/URLs. Diferencie integração, assimilação e ecletismo, e registre classificação cruzada de ACT/Wachtel.'''
r=client.chat.completions.create(model='gpt-5-mini',messages=[{'role':'user','content':prompt}],max_completion_tokens=14000)
t=r.choices[0].message.content or ''
Path('/home/ubuntu/cecistudy_pesquisa/entregas/08_integrativa_ecletica_lote1.md').write_text(t,encoding='utf-8')
print(len(t))
