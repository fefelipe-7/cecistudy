# SPEC-MODULO-FACULDADE

> Módulo Faculdade — Workspace Acadêmico Desktop Flutter+Rust
> Nível: Alto - UI + estado + bridge + testes
> Data: 2026-09-17

## 1. Objetivo
Gerenciar disciplinas, anotações de aula, tarefas, provas e diário de estágio. Master-detail com lista de cursos à esquerda e detalhe à direita.

## 2. Escopo
### In
- Lista de cursos com progresso e cor
- Detalhe de curso: info, aulas, avaliações, tarefas
- Criar/editar curso
- Anotações de aula com rating 1-5
- Tarefas vinculadas a curso/aula
- Provas/avaliações com peso e nota
- Diário de estágio integrado

### Out
- Matrícula automática
- Integração com sistema acadêmico externo

## 3. Entidades Rust
- `Course { id, name, code, professor, semester, color, icon, progress }`
- `ClassNote { id, course_id, title, number, date, summary, full_notes, rating }`
- `Task { id, title, course_id, class_id?, due_date, completed, priority }`
- `Exam { id, course_id, title, date, weight, grade, completed }`

## 4. API FFI
`FaculdadeApi`
- `list_courses(workspace_id) -> Vec<Course>`
- `get_course(id) -> Option<Course>`
- `create_course(course) -> Result<Course>`
- `update_course(id, patch) -> Result<Course>`
- `list_class_notes(course_id) -> Vec<ClassNote>`
- `create_class_note(note) -> Result<ClassNote>`
- `list_tasks(course_id) -> Vec<Task>`
- `create_task(task) -> Result<Task>`
- `list_exams(course_id) -> Vec<Exam>`
- `create_exam(exam) -> Result<Exam>`

## 5. Estado Flutter - Riverpod
- `coursesProvider`
- `selectedCourseProvider`
- `classNotesProvider(course_id)`
- `tasksProvider(course_id)`
- `examsProvider(course_id)`

## 6. UI Flutter
### Telas
- `FaculdadeScreen` split master-detail
- `CourseDetailPane` com tabs: Info / Aulas / Avaliações / Tarefas
- `ClassNoteEditor` com rating estrelas
- `TaskExamWizard` criação rápida

### Componentes
- `CourseMasterList` - lista com cor/icon
- `CourseDetailHeader` - info + progresso
- `ClassNoteListItem` - preview com rating
- `TaskToggleItem` - checkbox tarefa
- `ExamCard` - data + peso + nota

### Interações
- Click curso → carregar detalhe
- Botão + → wizard de criação
- Drag tarefa entre cursos
- Rating estrelas salva imediatamente

## 7. Theming
- Cor do curso aplicada a card e header
- Cards com `journal-card`
- Progresso com `ProgressBar`

## 8. Regras de Negócio
- Curso pertence a workspace
- ClassNote pode vincular a Task
- Progresso calculado a partir de aulas anotadas e tarefas concluídas
- Rating opcional 1-5

## 9. Critérios de Aceite
- [ ] Listar cursos com cor/icon
- [ ] Abrir detalhe carrega aulas/tarefas/provas
- [ ] Criar curso persiste
- [ ] Criar anotação de aula com rating
- [ ] Marcar tarefa concluída atualiza progresso
- [ ] Criar prova com peso e nota
- [ ] Testes widget CourseMasterList
- [ ] Teste integração FFI criar curso→anotar aula

## 10. Testes
- Rust: `faculdade_domain_test.rs`
- Rust: `faculdade_repository_test.rs`
- Flutter widget: `CourseDetailPaneTest`
- Flutter integration: `FaculdadeFlowTest`

## 11. Dependências
- `cecistudy-domain` entities
- `cecistudy-data` repositories
- `cecistudy-app` use cases
- `cecistudy-ffi` bridge

## 12. Abertos
- Cálculo de progresso: fórmula exata?
- Importação de grade horária?
- Compartilhamento de curso entre workspaces?
