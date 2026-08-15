from openai import OpenAI
from pathlib import Path
client = OpenAI()
prompt = '''Redija, em português brasileiro e somente em Markdown, quatro registros aprofundados para um banco de dados: Dessensibilização Sistemática (Wolpe); Terapia de Exposição; Terapia Comportamental Dialética (DBT); Ativação Comportamental. Para cada registro, use estes 22 campos exatamente: nome, descricao_curta, definicao, ideia_central, origem, periodo_historico, contexto_historico, visao_ser_humano, visao_psique, visao_desenvolvimento, visao_sofrimento, teoria_da_mudanca, apresentacao_pratica, papel_terapeuta, papel_paciente, relacao_terapeutica, foco_clinico, perspectiva_academica, evidencias, debates, criticas_limitacoes, leituras_fundamentais. Use ### antes dos campos e --- entre registros. Diferencie técnica e abordagem ampla. Explique exposição sem incentivar autoaplicação e DBT como tratamento estruturado de Marsha Linehan. Não invente dados, pesquisas ou URLs. Qualifique evidência e riscos. Escreva 1–3 parágrafos por campo.'''
r = client.chat.completions.create(model='gpt-5-mini', messages=[{'role':'user','content':prompt}], max_completion_tokens=12000)
text = r.choices[0].message.content or ''
Path('/home/ubuntu/cecistudy_pesquisa/entregas/03_comportamental_lote2.md').write_text(text, encoding='utf-8')
print(f'Gerado: {len(text)} caracteres')
