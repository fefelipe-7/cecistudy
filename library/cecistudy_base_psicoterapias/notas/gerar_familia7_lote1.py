from openai import OpenAI
from pathlib import Path
client = OpenAI()
prompt = '''Redija em português brasileiro, somente Markdown, seis registros aprofundados para Psicoterapia Interpessoal (IPT); Terapia Baseada em Mentalização; Terapia Focada em Apego; Terapia de Casais Baseada em Apego; Terapia Familiar Focada nas Emoções; Psicodinâmica Cíclica (Wachtel). Para cada um use exatamente: nome, descricao_curta, definicao, ideia_central, origem, periodo_historico, contexto_historico, visao_ser_humano, visao_psique, visao_desenvolvimento, visao_sofrimento, teoria_da_mudanca, apresentacao_pratica, papel_terapeuta, papel_paciente, relacao_terapeutica, foco_clinico, perspectiva_academica, evidencias, debates, criticas_limitacoes, leituras_fundamentais. Use ### e ---; não invente estudos/números/URLs. Diferencie modelos de apego, intervenção familiar/individual e psicodinâmica cíclica como cruzamento relacional-integrativo. Qualifique evidências.'''
r=client.chat.completions.create(model='gpt-5-mini',messages=[{'role':'user','content':prompt}],max_completion_tokens=14000)
t=r.choices[0].message.content or ''
Path('/home/ubuntu/cecistudy_pesquisa/entregas/07_interpessoal_relacional_lote1.md').write_text(t,encoding='utf-8')
print(len(t))
