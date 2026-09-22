# SPEC-MODULO-ESTUDOS

> Módulo Estudos — Workspace Acadêmico Desktop Flutter+Rust
> Nível: Alto - UI + estado + bridge + testes
> Data: 2026-09-17

## 1. Objetivo
Suporte ao estudo ativo: Pomodoro, flashcards, leituras e questões. Foco em execução e métricas.

## 2. Escopo
### In
- Timer Pomodoro com presets 25/50/90 min
- Histórico de sessões de foco
- Flashcards com algoritmo SM-2 simplificado
- Leituras em andamento com progresso de páginas
- Questões de catálogo com modo treino/avaliativo
- Métricas de estudo: minutos/semana, streak

### Out
- Integração com Anki externo
- Leitor PDF embarcado

## 3. Entidades Rust
- `StudySession { id, course_id?, topic, start, duration, notes }`
- `Flashcard { id, concept_id, course_id?, question, answer, ease_factor, interval, due_date }`
- `ReadingItem { id, title, author, course_id?, total_pages, read_pages, status }`
- `QuizAttempt { id, user_id, category, score, duration }`

## 4. API FFI
`EstudosApi`
- `start_study_session(session) -> Result<StudySession>`
- `end_study_session(id, notes) -> Result<StudySession>`
- `list_sessions(range) -> Vec<StudySession>`
- `list_flashcards(due) -> Vec<Flashcard>`
- `review_flashcard(id, quality) -> Result<Flashcard>`
- `list_readings() -> Vec<ReadingItem>`
- `update_reading_progress(id, pages) -> Result<ReadingItem>`
- `start_quiz(category) -> QuizSession`
- `submit_quiz_answer(session_id, question_id, answer) -> Result<()>`

## 5. Estado Flutter - Riverpod
- `pomodoroProvider` - timer em execução
- `sessionsProvider`
- `flashcardsDueProvider`
- `readingsProvider`
- `quizSessionProvider`

## 6. UI Flutter
### Telas
- `EstudosScreen` com tabs: Foco / Flashcards / Leituras / Questões
- `StudyFocusScreen` - timer grande com controles
- `FlashcardViewer` - flip card com qualidade
- `ReadingList` - progresso por livro
- `QuizPlayer` - questão por questão

### Componentes
- `PomodoroTimer` - círculo progressivo
- `FlashcardCard` - frente/verso
- `ReadingProgressBar` - páginas lidas/total
- `QuizQuestionCard` - opções

### Interações
- Iniciar timer → contagem regressiva com notificação fim
- Pausar/retomar timer
- Avaliar flashcard 1-5 → atualiza intervalo
- Atualizar páginas lidas via slider
- Iniciar quiz → navega questões

## 7. Theming
- Timer com cor de foco `brand`
- Flashcards com `journal-card`
- Progresso com `ProgressBar`

## 8. Regras de Negócio
- Pomodoro pode ser interrompido; sessão salva com duração real
- Flashcard due_date calculado por algoritmo
- Leitura progresso não pode exceder total_pages
- Quiz não permite voltar questão

## 9. Critérios de Aceite
- [ ] Iniciar timer Pomodoro conta regressiva
- [ ] Parar timer salva sessão
- [ ] Revisar flashcard atualiza próximo due
- [ ] Atualizar progresso leitura persiste
- [ ] Iniciar quiz e responder sequência
- [ ] Métricas de minutos da semana exibem corretamente
- [ ] Testes widget PomodoroTimer
- [ ] Teste integração FFI timer→sessão

## 10. Testes
- Rust: `estudos_domain_test.rs` algoritmo flashcard
- Rust: `estudos_repository_test.rs`
- Flutter widget: `PomodoroTimerTest`
- Flutter integration: `EstudosFlowTest`

## 11. Dependências
- `cecistudy-domain` entities
- `cecistudy-data` repositories
- `cecistudy-content` para questões
- `cecistudy-ffi` bridge

## 12. Abertos
- Presets de Pomodoro editáveis?
- Exportar dados de estudo?
- Modo foco bloqueia distrações do sistema?
