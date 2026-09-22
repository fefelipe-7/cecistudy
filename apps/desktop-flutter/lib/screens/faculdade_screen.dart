import 'package:flutter/material.dart';
import '../theme/ceci_colors.dart';
import '../theme/ceci_spacing.dart';
import '../widgets/ui/app_card.dart';
import '../widgets/ui/app_badge.dart';

class _Curso {
  const _Curso({
    required this.id,
    required this.nome,
    required this.prof,
    required this.status,
  });

  final String id;
  final String nome;
  final String prof;
  final String status;
}

const _cursos = [
  _Curso(id: 'desenvolvimento', nome: 'Psicologia do Desenvolvimento', prof: 'Prof. Ana Souza', status: 'cursando'),
  _Curso(id: 'neuro', nome: 'Neuropsicologia', prof: 'Prof. Carlos Lima', status: 'em breve'),
  _Curso(id: 'cognitivas', nome: 'Terapias Cognitivas', prof: 'Prof. Marina Teles', status: 'concluída'),
];

class FaculdadeScreen extends StatefulWidget {
  const FaculdadeScreen({super.key});

  @override
  State<FaculdadeScreen> createState() => _FaculdadeScreenState();
}

class _FaculdadeScreenState extends State<FaculdadeScreen> {
  String? _selectedId = _cursos.first.id;

  _Curso get _selected =>
      _cursos.firstWhere((c) => c.id == _selectedId, orElse: () => _cursos.first);

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // Mestre: lista de disciplinas
        SizedBox(
          width: 288,
          child: DecoratedBox(
            decoration: BoxDecoration(
              border: Border(right: BorderSide(color: Theme.of(context).extension<CeciColors>()!.borderSubtle)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.all(CeciSpacing.lg),
                  child: Text('disciplinas', style: Theme.of(context).textTheme.titleLarge),
                ),
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: CeciSpacing.sm),
                    itemCount: _cursos.length,
                    separatorBuilder: (_, _) => const SizedBox(height: CeciSpacing.sm),
                    itemBuilder: (context, i) {
                      final curso = _cursos[i];
                      final isSel = curso.id == _selectedId;
                      return _CourseTile(
                        curso: curso,
                        selected: isSel,
                        onTap: () => setState(() => _selectedId = curso.id),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
        // Detalhe
        Expanded(
          child: _CourseDetail(curso: _selected, key: ValueKey(_selected.id)),
        ),
      ],
    );
  }
}

class _CourseTile extends StatelessWidget {
  const _CourseTile({required this.curso, required this.selected, required this.onTap});

  final _Curso curso;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).extension<CeciColors>()!;
    return Material(
      color: selected ? c.surfaceRose : Colors.transparent,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: CeciSpacing.md, vertical: 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(child: Text(curso.nome, style: Theme.of(context).textTheme.titleMedium)),
                  if (selected)
                    Icon(Icons.chevron_right_rounded, size: 18, color: c.brandStrong),
                ],
              ),
              const SizedBox(height: 2),
              Text(curso.prof, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
      ),
    );
  }
}

class _CourseDetail extends StatelessWidget {
  const _CourseDetail({super.key, required this.curso});

  final _Curso curso;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).extension<CeciColors>()!;
    final statusColor = switch (curso.status) {
      'cursando' => c.academic,
      'concluída' => c.statusSuccess,
      _ => c.statusWarning,
    };

    return ListView(
      padding: const EdgeInsets.all(CeciSpacing.xl),
      children: [
        Row(
          children: [
            Expanded(child: Text(curso.nome, style: Theme.of(context).textTheme.headlineMedium)),
            AppBadge(label: curso.status, color: statusColor),
          ],
        ),
        const SizedBox(height: CeciSpacing.sm),
        Text(curso.prof, style: Theme.of(context).textTheme.bodyMedium),
        const SizedBox(height: CeciSpacing.lg),
        AppCard(
          padding: const EdgeInsets.all(CeciSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('ementa & objetivos', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: CeciSpacing.sm),
              Text(
                'essa disciplina acompanha o semestre com aulas anotadas, leituras de repertório e avaliações.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ],
          ),
        ),
        const SizedBox(height: CeciSpacing.xl),
        Row(
          children: [
            Expanded(child: _SectionHeader(icon: Icons.edit_note_rounded, title: 'aulas anotadas')),
            const SizedBox(width: CeciSpacing.md),
            Expanded(child: _SectionHeader(icon: Icons.collections_bookmark_rounded, title: 'repertório')),
          ],
        ),
        const SizedBox(height: CeciSpacing.md),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: _EmptyListHint(icon: Icons.edit_note_rounded, text: 'ainda não tem aula anotada', actionLabel: 'anotar aula'),
            ),
            const SizedBox(width: CeciSpacing.md),
            Expanded(
              child: _EmptyListHint(icon: Icons.collections_bookmark_rounded, text: 'repertório vazio por aqui', actionLabel: 'adicionar leitura'),
            ),
          ],
        ),
        const SizedBox(height: CeciSpacing.xl),
        _SectionHeader(icon: Icons.event_note_rounded, title: 'avaliações próximas'),
        const SizedBox(height: CeciSpacing.md),
        _EmptyListHint(icon: Icons.event_note_rounded, text: 'sem avaliações agendadas', actionLabel: 'agendar prova'),
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.icon, required this.title});

  final IconData icon;
  final String title;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).extension<CeciColors>()!;
    return Row(
      children: [
        Icon(icon, size: 16, color: c.textTertiary),
        const SizedBox(width: CeciSpacing.sm),
        Text(title, style: Theme.of(context).textTheme.titleMedium),
      ],
    );
  }
}

class _EmptyListHint extends StatelessWidget {
  const _EmptyListHint({required this.icon, required this.text, required this.actionLabel});

  final IconData icon;
  final String text;
  final String actionLabel;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).extension<CeciColors>()!;
    return AppCard(
      onTap: () {},
      padding: const EdgeInsets.all(CeciSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: c.textTertiary),
          const SizedBox(height: CeciSpacing.sm),
          Text(text, style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: CeciSpacing.sm),
          Text(
            '$actionLabel →',
            style: Theme.of(context).textTheme.titleMedium!.copyWith(
              color: c.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}