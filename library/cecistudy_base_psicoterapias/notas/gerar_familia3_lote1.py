from openai import OpenAI
from pathlib import Path
client = OpenAI()
prompt = '''Redija, em português brasileiro e somente em Markdown, três registros aprofundados para um banco de dados de psicoterapias: Behaviorismo Metodológico/Radical (base teórica); Terapia Comportamental Clássica; Análise do Comportamento Aplicada (ABA). Para cada registro, use estes 22 campos exatamente: nome, descricao_curta, definicao, ideia_central, origem, periodo_historico, contexto_historico, visao_ser_humano, visao_psique, visao_desenvolvimento, visao_sofrimento, teoria_da_mudanca, apresentacao_pratica, papel_terapeuta, papel_paciente, relacao_terapeutica, foco_clinico, perspectiva_academica, evidencias, debates, criticas_limitacoes, leituras_fundamentais. Use ### antes dos campos e --- entre abordagens. Diferencie matriz filosófico-científica, terapia e intervenção aplicada. Não invente números, revisões ou URLs. Explique limites éticos da ABA, especialmente consentimento, autonomia, objetivo socialmente válido e controvérsias no atendimento a pessoas autistas. Escreva 1–3 parágrafos por campo, sendo denso e acadêmico.'''
r = client.chat.completions.create(model='gpt-5-mini', messages=[{'role':'user','content':prompt}], max_completion_tokens=12000)
text = r.choices[0].message.content or ''
Path('/home/ubuntu/cecistudy_pesquisa/entregas/03_comportamental_lote1.md').write_text(text, encoding='utf-8')
print(f'Gerado: {len(text)} caracteres')
