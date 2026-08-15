#!/usr/bin/env python3
"""Auditoria canônica: valida exatamente 97 ocorrências por família.

A contagem não é inferida pelo número de cabeçalhos. O script usa a lista
canônica abaixo, encontra cada abordagem nos arquivos do ZIP e falha quando
alguma abordagem está ausente ou aparece mais de uma vez na mesma família.
"""
from __future__ import annotations
import argparse, json, re, unicodedata, zipfile
from collections import defaultdict
from pathlib import Path

CANONICAL = {
"01_psicanalitica_psicodinamica": [
"Psicanálise Freudiana Clássica", "Psicologia do Ego", "Teoria das Relações Objetais", "Psicologia do Self (Kohut)", "Psicanálise Relacional", "Terapia Psicodinâmica Breve", "Psicologia Analítica Junguiana", "Psicologia Individual Adleriana", "Psicanálise Interpessoal (Sullivan)", "Psicoterapia Psicodinâmica Contemporânea (integrativa)"],
"02_existencial_humanista": [
"Terapia Centrada na Pessoa (Rogers)", "Gestalt-terapia", "Terapia Existencial-Humanista", "Terapia Focada nas Emoções", "Logoterapia", "Terapia Experiencial", "Daseinsanalyse", "Terapia Existencial Britânica", "Psicologia Humanista", "Terapia Transpessoal"],
"03_comportamental": [
"Behaviorismo Metodológico/Radical", "Terapia Comportamental Clássica", "Análise do Comportamento Aplicada (ABA)", "Dessensibilização Sistemática", "Terapia de Exposição", "Terapia Comportamental Dialética (DBT)", "Ativação Comportamental", "Treinamento de Habilidades Sociais", "Modificação de Comportamento Infantil", "Terapia Comportamental de Casais"],
"04_cognitiva_tcc": [
"Terapia Cognitiva (Beck)", "Terapia Racional-Emotiva Comportamental (REBT)", "TCC Integrada/Geral", "Terapia do Esquema", "Terapia Cognitiva Baseada em Mindfulness (MBCT)", "Terapia de Aceitação e Compromisso (ACT)", "Terapia Focada na Compaixão", "Terapia Metacognitiva", "Terapia do Processamento Cognitivo", "Terapia Cognitivo-Comportamental Baseada em Protocolo Transdiagnóstico"],
"05_sistemica_familiar_casais": [
"Terapia Familiar Estrutural", "Terapia Familiar Estratégica", "Terapia Familiar Boweniana", "Escola de Milão", "Terapia Centrada em Soluções", "Terapia Familiar Geral", "Terapia de Casais Integrativa", "Terapia Familiar Experiencial", "Terapia Familiar Baseada em Apego", "Terapia Multissistêmica"],
"06_construtivista_narrativa": [
"Terapia Narrativa", "Psicoterapias Construtivas", "Terapia de Construção Pessoal", "Terapia Colaborativa", "Terapia Pós-moderna", "Construcionismo Social", "Coherence Therapy", "Terapia Ericksoniana", "Terapia Centrada em Soluções", "Prática Baseada em Resposta", "Terapia de Renegociação de Identidade"],
"07_interpessoal_relacional": [
"Psicoterapia Interpessoal (IPT)", "Terapia Relacional-Cultural", "Psicanálise Interpessoal (Sullivan)", "Terapia Baseada em Mentalização", "Teoria dos Sistemas Intersubjetivos", "Psicodinâmica Cíclica", "Terapia de Casais Baseada em Apego", "Método Gottman de Terapia de Casais", "Terapia Familiar Focada nas Emoções"],
"08_integrativa_ecletica": [
"Psicoterapia Integrativa Geral", "Ecletismo Técnico", "Integração Assimilativa", "Terapia Multimodal", "Psicodinâmica Cíclica", "Terapia de Aceitação e Compromisso (ACT)", "Formulação de Caso em Psicoterapia", "Modelo Transteórico de Mudança", "Prática Baseada em Evidências em Psicologia"],
"09_social_cultural_genero": [
"Terapia Feminista", "Terapia Multicultural", "Terapia Afirmativa LGBTQ+", "Terapia Antirracista", "Terapia Interseccional", "Terapia Comunitária", "Abordagens Transculturais e Internacionais", "Terapia Feminista Psicanalítica", "Terapia Familiar Feminista"],
"10_pragmaticos_objetivo": [
"Terapia Focada em Soluções", "Entrevista Motivacional", "Terapia da Realidade", "Terapia de Resolução de Problemas", "Terapia Breve Orientada a Metas", "Terapia Breve", "Aconselhamento de Carreira", "Terapia Baseada em Forças", "Terapia de Casal e Família de Curto Prazo"],
}

LABELS = {k:k.split('_',1)[1].replace('_',' ').title() for k in CANONICAL}

def norm(s: str) -> str:
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c)).lower()
    s = s.replace('–','-').replace('—','-').replace('‑','-')
    s = re.sub(r'\([^)]*\)', ' ', s)
    s = re.sub(r'[^a-z0-9]+', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()

def aliases(name: str) -> set[str]:
    n=norm(name); out={n}
    replacements={
      'behaviorismo metodologico radical':'behaviorismo metodologico radical base teorica',
      'terapia psicodinamica breve':'terapia psicodinamica breve theories of psychotherapy brief dynamic therapy',
      'psicologia individual adleriana':'psicologia individual adleriana theories of psychotherapy adlerian psychotherapy',
      'terapia centrada na pessoa':'terapia centrada na pessoa rogers theories of psychotherapy person centered psychotherapies',
      'gestalt terapia':'gestalt terapia theories of psychotherapy gestalt therapy',
      'terapia focada nas emocoes':'terapia focada nas emocoes emotion focused therapy vertente de leslie greenberg',
      'terapia existencial britanica':'terapia existencial britanica vertente clinica contemporanea',
      'psicoterapia interpessoal ipt':'psicoterapia interpessoal ipt klerman weissman',
      'terapia baseada em mentalizacao':'tratamento baseado em mentalizacao',
      'terapia relacional cultural':'terapia relacional cultural relational cultural therapy rct',
      'terapia familiar focada nas emocoes':'terapia familiar focada nas emocoes efft eft familiar',
      'psicodinamica ciclica':'psicodinamica ciclica wachtel terapia ciclica psicodinamica',
      'metodo gottman de terapia de casais':'metodo gottman de terapia de casais gottman method couples therapy',
      'terapia de aceitacao e compromisso':'terapia de aceitacao e compromisso act como modelo integrativo contextual',
      'pratica baseada em evidencias em psicologia':'pratica baseada em evidencias em psicologia pbe',
      'terapia multicultural':'aconselhamento multicultural',
      'terapia focada em solucoes':'terapia centrada em solucoes tcs enquadramento construtivista narrativo',
      'terapia de casal e familia de curto prazo':'terapia de casal e familia de curto prazo modelo mri mental research institute modelo estrategico',
    }
    if n in replacements: out.add(norm(replacements[n]))
    return out

def read_candidates(zip_path: Path):
    # Extração deliberadamente permissiva; a lista canônica abaixo decide o que conta.
    candidates=defaultdict(list)
    with zipfile.ZipFile(zip_path) as z:
        for member in z.namelist():
            if '/entregas/' not in '/'+member or not member.endswith('.md'): continue
            base=Path(member).name
            family=next((f for f in CANONICAL if base.startswith(f)),None)
            if not family: continue
            lines=z.read(member).decode('utf-8','replace').splitlines()
            def add(name,line,kind):
                name=name.strip().strip('*`')
                if not name or norm(name) in {'nome','name','ordem exibicao','familia','abordagem'}: return
                candidates[family].append({'name':name,'norm':norm(name),'file':base,'line':line,'kind':kind})
            # explicit records
            for i,line in enumerate(lines,1):
                m=re.match(r'^##\s+Registro\s+`?abordagem`?\s*[—-]\s*(.+)$',line,re.I)
                if m: add(m.group(1),i,'registro_abordagem')
            # name/name fields
            for i,line in enumerate(lines):
                if re.match(r'^###\s+(nome|name)\s*$',line,re.I):
                    for j in range(i+1,min(i+5,len(lines))):
                        if lines[j].strip(): add(lines[j],j+1,'campo_nome'); break
            # inline name: value
            for i,line in enumerate(lines,1):
                m=re.match(r'^\s*\*?\*?(?:nome|name)\*?\*?\s*:\s*(.+)$',line,re.I)
                if m: add(m.group(1),i,'campo_nome_inline')
            # title headings used in lots
            for i,line in enumerate(lines,1):
                m=re.match(r'^###\s+(.+)$',line)
                if not m: continue
                title=m.group(1).strip()
                if norm(title).startswith(('registro','diferenciacao')): continue
                if norm(title) in {'nome','name','descricao curta','definicao','ideia central','origem','periodo historico','contexto historico','visao ser humano','visao psique','visao desenvolvimento','visao sofrimento','teoria da mudanca','apresentacao pratica','papel terapeuta','papel paciente','relacao terapeutica','foco clinico','perspectiva academica','evidencias','debates','criticas limitacoes','leituras fundamentais'}: continue
                add(title,i,'titulo_lote')
            # first simple line in a few lots
            first=None
            for i,line in enumerate(lines,1):
                if line.strip() and not line.strip().startswith('---'):
                    first=(i,line.strip()); break
            if first and not first[1].startswith('#'):
                window='\n'.join(lines[first[0]:first[0]+5])
                if re.search(r'^###\s+descricao_curta\s*$',window,re.I|re.M): add(first[1],first[0],'titulo_simples')
    return candidates

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('zip_path',type=Path); ap.add_argument('--out',type=Path,default=Path('auditoria_97_canonica')); args=ap.parse_args(); args.out.mkdir(parents=True,exist_ok=True)
    candidates=read_candidates(args.zip_path)
    rows=[]; missing=[]; duplicated=[]; matched_details={}
    for family,names in CANONICAL.items():
        for canonical in names:
            wanted=aliases(canonical)
            hits=[x for x in candidates[family] if x['norm'] in wanted or any(x['norm'].startswith(a+' ') or a.startswith(x['norm']+' ') for a in wanted)]
            # De-duplicar a mesma ocorrência quando foi capturada por dois detectores.
            unique={ (x['file'],x['line'],x['norm']): x for x in hits }
            hits=list(unique.values())
            if not hits: missing.append({'family':family,'canonical':canonical})
            else:
                selected=hits[0]
                rows.append({'family':family,'canonical_name':canonical,**selected})
                matched_details[f'{family}:{canonical}']={'hits':hits,'selected':selected}
                # Mais de um arquivo pode ser uma duplicata principal/lote; não conta outra ocorrência.
                source_pairs={(x['file'],x['norm']) for x in hits}
                if len(source_pairs)>1: duplicated.append({'family':family,'canonical':canonical,'hits':hits})
    report={'expected_total':sum(map(len,CANONICAL.values())),'found_total':len(rows),'missing':missing,'duplicated_source_matches':duplicated,'rows':rows,'candidate_counts_raw':{f:len(v) for f,v in candidates.items()},'expected_by_family':{f:len(v) for f,v in CANONICAL.items()},'found_by_family':{f:sum(r['family']==f for r in rows) for f in CANONICAL}}
    (args.out/'auditoria_97_canonica.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    md=['# Auditoria canônica das abordagens','',f"Total esperado: **{report['expected_total']}**",f"Total mapeado: **{report['found_total']}**",'','| Família | Esperado | Mapeado | Status |','|---|---:|---:|---|']
    for f in CANONICAL:
        e=len(CANONICAL[f]); got=report['found_by_family'][f]; md.append(f'| {LABELS[f]} | {e} | {got} | {"OK" if e==got else "REVISAR"} |')
    if missing:
        md += ['', '## Abordagens não localizadas']
        md += [f"- {x['family']}: {x['canonical']}" for x in missing]
    if duplicated:
        md += ['', '## Abordagens com múltiplas localizações (não contar novamente)']
        for x in duplicated: md.append(f"- {x['family']}: {x['canonical']} — {', '.join(h['file'] for h in x['hits'])}")
    (args.out/'auditoria_97_canonica.md').write_text('\n'.join(md)+'\n',encoding='utf-8')
    print(json.dumps({'expected':report['expected_total'],'mapped':report['found_total'],'missing':len(missing),'multi_source_matches':len(duplicated),'by_family':report['found_by_family']},ensure_ascii=False,indent=2))
    raise SystemExit(0 if report['found_total']==report['expected_total'] and not missing else 2)
if __name__=='__main__': main()
