from openai import OpenAI
from pathlib import Path

client = OpenAI()
prompt = r'''Você é redator acadêmico em psicoterapia. Continue um arquivo Markdown em português brasileiro para inserção em banco de dados. Produza registros densos, factuais e clinicamente responsáveis para as abordagens restantes da família Existencial-Humanista: Terapia Existencial-Humanista; Terapia Focada nas Emoções; Logoterapia; Terapia Experiencial; Daseinsanalyse; Terapia Existencial Britânica; Psicologia Humanista; Terapia Transpessoal.

Para CADA abordagem, use exatamente os 22 cabeçalhos abaixo e redija 1 a 3 parágrafos por campo, exceto campos simples. Não ofereça aconselhamento individual. Diga claramente quando uma teoria tem pouca evidência direta. Diferencie escola ampla, abordagem, técnica e tradição filosófica. Evite inventar estatísticas ou estudos.

### nome
### descricao_curta
### definicao
### ideia_central
### origem
### periodo_historico
### contexto_historico
### visao_ser_humano
### visao_psique
### visao_desenvolvimento
### visao_sofrimento
### teoria_da_mudanca
### apresentacao_pratica
### papel_terapeuta
### papel_paciente
### relacao_terapeutica
### foco_clinico
### perspectiva_academica
### evidencias
### debates
### criticas_limitacoes
### leituras_fundamentais

Contexto-fonte permitido: a SAMHSA/NCBI descreve abordagens humanistas/existenciais como centradas em experiência, cliente, aceitação/crescimento (humanista) e responsabilidade/liberdade/sentido (existencial), ao mesmo tempo que alerta para desafios de mensuração da experiência vivida; a APA lista terapia centrada na pessoa, Gestalt e existencial como variantes humanistas influentes. Não cite números de referência nem URLs; deixe referências fundantes em leituras_fundamentais. Use tom técnico e explique termos.
'''
resp = client.chat.completions.create(
    model="gpt-5",
    messages=[
        {"role": "system", "content": "Escreva somente Markdown acadêmico de alta qualidade. Não faça alegações factuais sem qualificar limites."},
        {"role": "user", "content": prompt},
    ],
    max_completion_tokens=24000,
    extra_body={"reasoning": {"effort": "medium"}},
)
text = resp.choices[0].message.content or ""
Path("/home/ubuntu/cecistudy_pesquisa/entregas/02_existencial_humanista_restante.md").write_text(text, encoding="utf-8")
print(f"Gerado: {len(text)} caracteres")
print(resp.usage)
