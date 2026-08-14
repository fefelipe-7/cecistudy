import {
  Course,
  ClassNote,
  Task,
  Exam,
  PsychologyAuthor,
  PsychologyConcept,
  PsychologyApproach,
  ReadingItem,
  Flashcard,
  MaterialItem,
  InternshipLog,
  TccData,
  Sticker,
  UserProfile,
  StudySession
} from '../types';

export const initialProfile: UserProfile = {
  name: 'Ceci',
  semester: 6,
  totalSemesters: 10,
  university: 'Universidade de Psicologia',
  targetCareer: 'Psicóloga Clínica & Pesquisadora',
  avatarMood: '🌸 estudando com foco e amor',
  dailyQuote: 'compreender o ser humano é a forma mais bonita de cuidado.',
  stickersCollected: 6
};

export const initialCourses: Course[] = [
  {
    id: 'c1',
    name: 'Psicopatologia I',
    code: 'PSI-301',
    professor: 'Dra. Helena Martins',
    semester: '6º Semestre',
    category: 'obrigatoria',
    schedule: 'Segundas, 08:00 - 11:30',
    room: 'Bloco C - Sala 204',
    color: '#E8AFC0',
    icon: 'Brain',
    progress: 68,
    description: 'estudo das manifestações psíquicas, semiologia e critérios diagnósticos do DSM-5-TR e CID-11.'
  },
  {
    id: 'c2',
    name: 'Avaliação Psicológica II',
    code: 'PSI-302',
    professor: 'Prof. Dr. Ricardo Fonseca',
    semester: '6º Semestre',
    category: 'obrigatoria',
    schedule: 'Terças, 14:00 - 17:30',
    room: 'Laboratório de Testes',
    color: '#BFDDED',
    icon: 'FileText',
    progress: 55,
    description: 'aplicação e interpretação de testes de personalidade, projetivos e psicométricos (HTP, BFP, WAIS).'
  },
  {
    id: 'c3',
    name: 'Terapia Cognitivo-Comportamental',
    code: 'PSI-303',
    professor: 'Dra. Camilla Rossi',
    semester: '6º Semestre',
    category: 'obrigatoria',
    schedule: 'Quartas, 09:00 - 12:00',
    room: 'Bloco A - Sala 102',
    color: '#DCCBB8',
    icon: 'Sparkles',
    progress: 80,
    description: 'princípios conceituais, formulação de caso e intervenções estruturadas na abordagem da TCC.'
  },
  {
    id: 'c4',
    name: 'Psicologia Social e Saúde Mental',
    code: 'PSI-304',
    professor: 'Prof. Marcos Andrade',
    semester: '6º Semestre',
    category: 'obrigatoria',
    schedule: 'Quintas, 13:30 - 17:00',
    room: 'Bloco C - Auditório B',
    color: '#A8C9B0',
    icon: 'Users',
    progress: 40,
    description: 'processos psicossociais, relações interpessoais, subjetividades contemporâneas e Políticas Públicas de Saúde.'
  },
  {
    id: 'c5',
    name: 'Estágio Básico Supervisão I',
    code: 'PSI-305',
    professor: 'Dra. Beatriz Lima',
    semester: '6º Semestre',
    category: 'obrigatoria',
    schedule: 'Sextas, 08:30 - 12:30',
    room: 'Clínica Escola',
    color: '#E8C98C',
    icon: 'HeartHandshake',
    progress: 75,
    description: 'observação, escuta analítica, ética do acolhimento e escuta qualificada na Clínica Escola.'
  }
];

export const initialClasses: ClassNote[] = [
  {
    id: 'cl-1',
    courseId: 'c1',
    title: 'Semiologia dos Transtornos do Humor (Depressão e Bipolaridade)',
    number: 8,
    date: '2026-08-04',
    summary: 'Análise da altimia, anedonia, lentificação psicomotora e alteração do sono. Diferenciação clínica entre episódio depressivo maior e distimia.',
    fullNotes: `• Conceito de Altimia e Reatividade Afetiva
• Anedonia profunda x Labilidade emocional
• Critérios DSM-5-TR: humor deprimido na maior parte do dia, perda de interesse, insônia/hipersonia por mais de 2 semanas
• Aprofundamento no conceito de Tríade Cognitiva de Aaron Beck (visão de si, do mundo e do futuro)`,
    conceptIds: ['con-1', 'con-2'],
    authorIds: ['aut-1'],
    materials: ['Capítulo 4 - Dalgalarrondo (Psicopatologia e Semiologia dos Transtornos Mentais)'],
    hasQuestions: true,
    rating: 5
  },
  {
    id: 'cl-2',
    courseId: 'c3',
    title: 'Modelo Cognitivo e Conceituação de Caso na TCC',
    number: 7,
    date: '2026-07-28',
    summary: 'Diagrama de conceituação cognitiva, pensamentos automáticos, crenças intermediárias (regras e pressupostos) e crenças centrais.',
    fullNotes: `• Situação → Pensamento Automático → Reação (Emocional, Comportamental, Fisiológica)
• Identificação de distorções cognitivas: catastrofização, leitura mental, filtro negativo, pensamento tudo-ou-nada
• Estratégia de reestruturação cognitiva: RPD (Registro de Pensamentos Disfuncionais)`,
    conceptIds: ['con-1', 'con-3'],
    authorIds: ['aut-1'],
    materials: ['Beck, J. S. (2021) - Terapia Cognitivo-Comportamental: Teoria e Prática'],
    hasQuestions: true,
    rating: 4
  },
  {
    id: 'cl-3',
    courseId: 'c2',
    title: 'Introdução às Técnicas Projetivas e Desenho H-T-P',
    number: 6,
    date: '2026-07-29',
    summary: 'Instruções de aplicação do House-Tree-Person (HTP), simbolismo do traço, proporção, localização na folha e inquérito pós-desenho.',
    fullNotes: `• HTP de Buck (Casa = ambiente familiar e autoimagem; Árvore = desenvolvimento e impulsos inconscientes; Pessoa = autoconceito e relações interpessoais)
• Importância de cruzar dados projetivos com o relato da anamnese e a conduta observada`,
    conceptIds: ['con-4'],
    authorIds: ['aut-2'],
    materials: ['Manual de Aplicação do HTP (Buck)'],
    hasQuestions: false,
    rating: 4
  },
  {
    id: 'cl-4',
    courseId: 'c5',
    title: 'Acolhimento Inicial na Clínica Escola e Ética da Escuta',
    number: 5,
    date: '2026-08-01',
    summary: 'Manejo do primeiro contato, sigilo profissional conforme Código de Ética do Psicólogo (Art. 9º) e construção da aliança terapêutica.',
    fullNotes: `• Acolhimento não é entrevista diagnóstica rígida; é a construção do vínculo seguro
• Atitude empática e neutralidade benevolente
• Registro em prontuário restrito (com cuidados éticos de guarda de documentos)`,
    conceptIds: ['con-5'],
    authorIds: ['aut-3'],
    materials: ['Código de Ética Profissional do Psicólogo (CFP)'],
    hasQuestions: true,
    rating: 5
  }
];

export const initialTasks: Task[] = [
  {
    id: 't1',
    title: 'Ler Capítulo 4 do Dalgalarrondo sobre Semiologia da Afetividade',
    disciplineId: 'c1',
    classId: 'cl-1',
    dueDate: '2026-08-10',
    completed: false,
    priority: 'alta',
    category: 'leitura'
  },
  {
    id: 't2',
    title: 'Elaborar Diagrama de Conceituação de Caso Prático de TCC',
    disciplineId: 'c3',
    classId: 'cl-2',
    dueDate: '2026-08-12',
    completed: false,
    priority: 'alta',
    category: 'trabalho'
  },
  {
    id: 't3',
    title: 'Treinar inquérito do HTP com a dupla de estágio',
    disciplineId: 'c2',
    classId: 'cl-3',
    dueDate: '2026-08-14',
    completed: true,
    priority: 'media',
    category: 'estagio'
  },
  {
    id: 't4',
    title: 'Revisar flashcards de Distorções Cognitivas',
    disciplineId: 'c3',
    dueDate: '2026-08-09',
    completed: false,
    priority: 'media',
    category: 'revisao'
  },
  {
    id: 't5',
    title: 'Organizar diário de reflexão da supervisão de estágio',
    disciplineId: 'c5',
    dueDate: '2026-08-11',
    completed: false,
    priority: 'alta',
    category: 'estagio'
  }
];

export const initialExams: Exam[] = [
  {
    id: 'e1',
    courseId: 'c1',
    title: 'Avaliação Teórica I - Psicopatologia e Transtornos de Humor',
    date: '2026-08-25',
    weight: '35% da média final',
    topics: ['Semiologia das funções psíquicas', 'Depressão Maior', 'Distimia', 'Transtorno Bipolar I e II'],
    completed: false
  },
  {
    id: 'e2',
    courseId: 'c3',
    title: 'Estudo de Caso Prático - Formulação em TCC',
    date: '2026-09-02',
    weight: '40% da média final',
    topics: ['Tríade Cognitiva', 'Modelo ABC', 'Estratégia de RPD', 'Distorções Cognitivas'],
    completed: false
  },
  {
    id: 'e3',
    courseId: 'c2',
    title: 'Entrega do Relatório Técnico de Avaliação HTP',
    date: '2026-09-10',
    weight: '30% da média final',
    topics: ['Síntese quantitativa e qualitativa', 'Laudo Técnico de Testagem'],
    completed: false
  }
];

export const initialApproaches: PsychologyApproach[] = [
  {
    id: 'app-1',
    name: 'Terapia Cognitivo-Comportamental',
    shortName: 'TCC',
    description: 'Foco na identificação e modificação de pensamentos automáticos e crenças disfuncionais para transformar emoções e comportamentos.',
    foundingAuthors: ['Aaron Beck', 'Albert Ellis'],
    color: '#E8AFC0'
  },
  {
    id: 'app-2',
    name: 'Psicanálise',
    shortName: 'Psicanálise',
    description: 'Exploração dos processos inconscientes, transferência, pulsões e determinação do sujeito através da linguagem e da história infantil.',
    foundingAuthors: ['Sigmund Freud', 'Jacques Lacan', 'Donald Winnicott'],
    color: '#BFDDED'
  },
  {
    id: 'app-3',
    name: 'Abordagem Centrada na Pessoa / Humanismo',
    shortName: 'Humanismo',
    description: 'Valorização da tendência atualizante, empatia genuína, consideração positiva incondicional e congruência na relação terapêutica.',
    foundingAuthors: ['Carl Rogers', 'Abraham Maslow'],
    color: '#DCCBB8'
  },
  {
    id: 'app-4',
    name: 'Psicologia Histórico-Cultural',
    shortName: 'Socio-Histórica',
    description: 'Compreensão do psiquismo humano como produto das mediações sociais, linguagem e contexto cultural.',
    foundingAuthors: ['Lev Vygotsky', 'A. R. Luria'],
    color: '#A8C9B0'
  }
];

export const initialAuthors: PsychologyAuthor[] = [
  {
    id: 'aut-1',
    name: 'Aaron Beck',
    bio: 'Psiquiatra norte-americano, considerado o pai da Terapia Cognitiva. Desenvolveu a teoria da depressão baseada nos esquemas cognitivos e na tríade cognitiva.',
    lifespan: '1921 - 2021',
    approachId: 'app-1',
    keyConcepts: ['Pensamentos Automáticos', 'Crenças Centrais', 'Tríade Cognitiva da Depressão', 'Distorções Cognitivas'],
    majorWorks: ['Terapia Cognitiva da Depressão', 'Terapia Cognitivo-Comportamental: Teoria e Prática']
  },
  {
    id: 'aut-2',
    name: 'Sigmund Freud',
    bio: 'Médico neurologista austríaco e criador da Psicanálise. Postulou a existência do inconsciente, o complexo de Édipo e os mecanismos de defesa do Ego.',
    lifespan: '1856 - 1939',
    approachId: 'app-2',
    keyConcepts: ['Inconsciente', 'Transferência', 'Mecanismos de Defesa', 'Pulsão de Vida e Morte'],
    majorWorks: ['A Interpretação dos Sonhos (1900)', 'O Mal-Estar na Civilização (1930)']
  },
  {
    id: 'aut-3',
    name: 'Carl Rogers',
    bio: 'Psicólogo norte-americano criador da Abordagem Centrada na Pessoa. Defendia as três condições necessárias de atitude no terapeuta: empatia, congruência e consideração positiva.',
    lifespan: '1902 - 1987',
    approachId: 'app-3',
    keyConcepts: ['Empatia Genuína', 'Tendência Atualizante', 'Consideração Positiva Incondicional', 'Congruência'],
    majorWorks: ['Tornar-se Pessoa (1961)', 'Um Jeito de Ser (1980)']
  },
  {
    id: 'aut-4',
    name: 'Lev Vygotsky',
    bio: 'Psicólogo soviético pioneiro na pesquisa sobre desenvolvimento cognitivo sócio-histórico, destacando a função da linguagem na mediação do pensamento.',
    lifespan: '1896 - 1934',
    approachId: 'app-4',
    keyConcepts: ['Zona de Desenvolvimento Proximal (ZDP)', 'Mediação Semiótica', 'Funções Mentais Superiores'],
    majorWorks: ['A Formação Social da Mente', 'Pensamento e Linguagem']
  }
];

export const initialConcepts: PsychologyConcept[] = [
  {
    id: 'con-1',
    name: 'Pensamentos Automáticos',
    definition: 'Fluxos de cognições que surgem de forma espontânea e involuntária diante de situações, influenciados pelas crenças centrais subjacentes.',
    approachId: 'app-1',
    authorIds: ['aut-1'],
    courseIds: ['c1', 'c3'],
    tags: ['TCC', 'Cognição', 'Psicopatologia']
  },
  {
    id: 'con-2',
    name: 'Anedonia',
    definition: 'Incapacidade total ou parcial de sentir prazer e interesse em atividades que anteriormente traziam satisfação.',
    approachId: 'app-1',
    authorIds: ['aut-1'],
    courseIds: ['c1'],
    tags: ['Semiologia', 'Depressão', 'Sintoma']
  },
  {
    id: 'con-3',
    name: 'Tríade Cognitiva da Depressão',
    definition: 'Visão disfuncional e sistematicamente negativa sobre si mesmo ("sou incapaz"), sobre o mundo ("o mundo é hostil") e sobre o futuro ("nada vai melhorar").',
    approachId: 'app-1',
    authorIds: ['aut-1'],
    courseIds: ['c1', 'c3'],
    tags: ['TCC', 'Depressão', 'Esquema']
  },
  {
    id: 'con-4',
    name: 'Projeção / Testes Projetivos',
    definition: 'Mecanismo em que o sujeito atribui ao mundo externo (como no desenho do HTP) seus impulsos, conflitos e estados afetivos internos não conscientizados.',
    approachId: 'app-2',
    authorIds: ['aut-2'],
    courseIds: ['c2'],
    tags: ['Avaliação', 'Psicodiagnóstico', 'HTP']
  },
  {
    id: 'con-5',
    name: 'Empatia Genuína',
    definition: 'Capacidade do psicólogo de se colocar no lugar do cliente, percebendo o seu mundo privado como se fosse o seu próprio, sem perder a condição do "como se".',
    approachId: 'app-3',
    authorIds: ['aut-3'],
    courseIds: ['c5'],
    tags: ['Acolhimento', 'Relação Terapêutica', 'Humanismo']
  }
];

export const initialReadings: ReadingItem[] = [
  {
    id: 'r1',
    title: 'Psicopatologia e Semiologia dos Transtornos Mentais',
    author: 'Paulo Dalgalarrondo',
    courseId: 'c1',
    type: 'livro',
    totalPages: 520,
    readPages: 215,
    status: 'lendo',
    highlights: [
      'O afeto é a tonalidade emocional que acompanha o estado psíquico.',
      'A anedonia é um dos marcadores biológicos e subjetivos mais fortes nos episódios depressivos.'
    ]
  },
  {
    id: 'r2',
    title: 'Terapia Cognitivo-Comportamental: Teoria e Prática (3ª ed.)',
    author: 'Judith S. Beck',
    courseId: 'c3',
    type: 'livro',
    totalPages: 480,
    readPages: 310,
    status: 'lendo',
    highlights: [
      'Conceituação de caso não é um formulário estático; renova-se a cada sessão.',
      'A aliança terapêutica na TCC baseia-se no empirismo colaborativo.'
    ]
  },
  {
    id: 'r3',
    title: 'Tornar-se Pessoa: O Processo de Crescimento Humano',
    author: 'Carl Rogers',
    courseId: 'c5',
    type: 'livro',
    totalPages: 350,
    readPages: 350,
    status: 'concluido',
    highlights: [
      'Curiosa paradoxia: quando me aceito exatamente como sou, posso mudar.'
    ]
  },
  {
    id: 'r4',
    title: 'O Manual do Desenho H-T-P: Casa-Árvore-Pessoa',
    author: 'John N. Buck',
    courseId: 'c2',
    type: 'pdf',
    totalPages: 180,
    readPages: 90,
    status: 'lendo',
    highlights: [
      'A folha de papel representa o espaço vital do sujeito.'
    ]
  }
];

export const initialFlashcards: Flashcard[] = [
  {
    id: 'f1',
    courseId: 'c3',
    question: 'O que define a Tríade Cognitiva na Depressão?',
    answer: 'É a visão sistematicamente negativa em três esferas: Si mesmo (incapaz/sem valor), Mundo/Experiências (exigente/injusto) e Futuro (sem esperança).',
    timesReviewed: 4
  },
  {
    id: 'f2',
    courseId: 'c1',
    question: 'Qual a diferença entre Humor e Afeto na Semiologia?',
    answer: 'Humor é o tom emocional de fundo, mais duradouro e estável. Afeto é a manifestação emocional imediata, fluida e reativa a estímulos.',
    timesReviewed: 6
  },
  {
    id: 'f3',
    courseId: 'c3',
    question: 'O que é a distorção cognitiva de Catastrofização?',
    answer: 'É a tendência de prever o futuro negativamente sem considerar outros resultados mais prováveis ou realistas, assumindo o pior cenário.',
    timesReviewed: 3
  },
  {
    id: 'f4',
    courseId: 'c2',
    question: 'O que simboliza a figura da Árvore no teste HTP?',
    answer: 'Simboliza o desenvolvimento inconsciente do sujeito, a força do Ego (tronco), o contato com a realidade (raízes/chão) e a busca de satisfação no ambiente (copa).',
    timesReviewed: 2
  }
];

export const initialMaterials: MaterialItem[] = [
  {
    id: 'm1',
    title: 'Manual do DSM-5-TR (Critérios Diagnósticos de Transtornos do Humor)',
    type: 'pdf',
    author: 'American Psychiatric Association (APA)',
    courseId: 'c1',
    tags: ['DSM-5', 'Diagnóstico', 'Depressão'],
    addedAt: '2026-08-01'
  },
  {
    id: 'm2',
    title: 'Planilha RPD - Registro de Pensamentos Disfuncionais',
    type: 'pdf',
    author: 'Instituto Beck',
    courseId: 'c3',
    tags: ['TCC', 'Técnica', 'Prática Clinica'],
    addedAt: '2026-08-03'
  },
  {
    id: 'm3',
    title: 'Artigo: A Atitude Empática no Atendimento Inicial do Estágio Acadêmico',
    type: 'artigo',
    author: 'Revista Brasileira de Psicologia Clínica',
    courseId: 'c5',
    tags: ['Estágio', 'Acolhimento', 'Ética'],
    addedAt: '2026-08-05'
  }
];

export const initialInternshipLogs: InternshipLog[] = [
  {
    id: 'ilog-1',
    date: '2026-08-01',
    hours: 4,
    activity: 'Observação de acolhimento na Triagem da Clínica Escola',
    supervisionNotes: 'Discutida a postura corporal e a manutenção do contato visual sem causar intimidação. A supervisora ressaltou a importância do silêncio empático.',
    reflections: 'Percebi como o nervosismo inicial do paciente diminui quando oferecemos uma escuta sem julgamento moral.',
    conceptIds: ['con-5']
  },
  {
    id: 'ilog-2',
    date: '2026-08-05',
    hours: 4,
    activity: 'Supervisão de Grupo de Estágio Básico I',
    supervisionNotes: 'Estudo do Código de Ética Profissional referente ao guarda de arquivos de prontuários e a conduta em casos de risco iminente.',
    reflections: 'A responsabilidade ética me faz perceber a profundidade da nossa futura profissão. O acolhimento exige rigor e sensibilidade.',
    conceptIds: ['con-5']
  }
];

export const initialTcc: TccData = {
  title: 'A Reestruturação Cognitiva no Manejo da Ansiedade Acadêmica em Estudantes de Graduação',
  advisor: 'Prof.ª Dra. Camilla Rossi',
  field: 'Psicologia Clínica / Terapia Cognitivo-Comportamental',
  problemStatement: 'Como a aplicação de intervenções cognitivas estruturadas da TCC pode mitigar o impacto da ansiedade de desempenho acadêmico em universitários?',
  objectives: [
    'Mapear as principais distorções cognitivas associadas à ansiedade de provas e prazos.',
    'Identificar a eficácia do RPD e de ensaios comportamentais no alívio do sofrimento psíquico.',
    'Propor um guia prático de acolhimento preventivo para o serviço de apoio estudantil.'
  ],
  status: 'em_andamento',
  chapters: [
    { title: '1. Introdução e Justificativa Teórica', completed: true, dueDate: '2026-07-30' },
    { title: '2. Revisão Integrativa da Literatura sobre Ansiedade Acadêmica', completed: true, dueDate: '2026-08-15' },
    { title: '3. Fundamentação Teórica da TCC e do Modelo de Beck', completed: false, dueDate: '2026-09-10' },
    { title: '4. Metodologia da Pesquisa Qualitativa', completed: false, dueDate: '2026-10-01' },
    { title: '5. Discussão e Considerações Finais', completed: false, dueDate: '2026-11-15' }
  ],
  references: [
    'Beck, A. T. (1979). Cognitive Therapy of Depression. New York: Guilford Press.',
    'Beck, J. S. (2021). Terapia Cognitivo-Comportamental: Teoria e Prática. Artmed.',
    'Dalgalarrondo, P. (2019). Psicopatologia e Semiologia dos Transtornos Mentais. Artmed.'
  ]
};

export const initialStickers: Sticker[] = [
  {
    id: 'st-1',
    name: 'primeira leitura concluída',
    emoji: '📚',
    description: 'você terminou de ler um livro ou capítulo acadêmico importante!',
    unlocked: true,
    unlockedAt: '2026-08-02',
    category: 'leituras'
  },
  {
    id: 'st-2',
    name: 'cantinho organizado',
    emoji: '🌷',
    description: 'você completou a organização do plano de estudos semanal no cecistudy.',
    unlocked: true,
    unlockedAt: '2026-08-03',
    category: 'faculdade'
  },
  {
    id: 'st-3',
    name: 'mestre dos flashcards',
    emoji: '🧠',
    description: 'você revisou mais de 10 conceitos fundamentais de psicologia.',
    unlocked: true,
    unlockedAt: '2026-08-04',
    category: 'estudo'
  },
  {
    id: 'st-4',
    name: 'primeiro dia de estágio',
    emoji: '🩺',
    description: 'você registrou o primeiro relatório de supervisão no diário de campo.',
    unlocked: true,
    unlockedAt: '2026-08-05',
    category: 'jornada'
  },
  {
    id: 'st-5',
    name: 'semana do café & livros',
    emoji: '☕',
    description: 'você manteve constância de 5 dias seguidos estudando.',
    unlocked: true,
    unlockedAt: '2026-08-06',
    category: 'estudo'
  },
  {
    id: 'st-6',
    name: 'rumo ao CRP!',
    emoji: '🎓',
    description: 'você alcançou mais da metade da graduação em psicologia.',
    unlocked: true,
    unlockedAt: '2026-08-07',
    category: 'jornada'
  },
  {
    id: 'st-7',
    name: 'análise de autor',
    emoji: '✨',
    description: 'você conectou 3 obras e conceitos no seu mapa de conhecimento.',
    unlocked: false,
    category: 'faculdade'
  },
  {
    id: 'st-8',
    name: 'defesa do tcc',
    emoji: '🏆',
    description: 'você concluiu a revisão final e apresentação do seu tcc de psicologia.',
    unlocked: false,
    category: 'jornada'
  }
];

export const initialStudySessions: StudySession[] = [
  {
    id: 'ss-1',
    courseId: 'c1',
    topic: 'Semiologia dos Transtornos do Humor (Depressão)',
    date: '2026-08-06',
    durationMinutes: 45,
    mood: 'com_foco',
    notes: 'Li o capítulo do Dalgalarrondo e resumi os critérios diagnósticos principais.'
  },
  {
    id: 'ss-2',
    courseId: 'c3',
    topic: 'Treino de RPD e Esquemas de Beck',
    date: '2026-08-07',
    durationMinutes: 30,
    mood: 'produtivo',
    notes: 'Revisei flashcards e fiz simulação de caso clínico para a prova.'
  }
];
