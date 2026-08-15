from openai import OpenAI
from pathlib import Path
client = OpenAI()
prompt = '''Redija, em português brasileiro e somente em Markdown, três registros aprofundados para: Treinamento de Habilidades Sociais; Modificação de Comportamento Infantil; Terapia Comportamental de Casais. Para cada registro, use exatamente estes 22 campos: nome, descricao_curta, definicao, ideia_central, origem, periodo_historico, contexto_historico, visao_ser_humano, visao_psique, visao_desenvolvimento, visao_sofrimento, teoria_da_mudanca, apresentacao_pratica, papel_terapeuta, papel_paciente, relacao_terapeutica, foco_clinico, perspectiva_academica, evidencias, debates, criticas_limitacoes, leituras_fundamentais. Use ### antes de cada campo e --- entre registros. Não invente estudos, números ou URLs. Explique limites éticos para intervenções infantis, não culpabilize cuidadores e diferencie treinamento de habilidade, terapia infantil e terapia de casal. Escreva 1–3 parágrafos por campo.'''
r = client.chat.completions.create(model='gpt-5-mini', messages=[{'role':'user','content':prompt}], max_completion_tokens=10000)
text = r.choices[0].message.content or ''
Path('/home/ubuntu/cecistudy_pesquisa/entregas/03_comportamental_lote3.md').write_text(text, encoding='utf-8')
print(f'Gerado: {len(text)} caracteres')
