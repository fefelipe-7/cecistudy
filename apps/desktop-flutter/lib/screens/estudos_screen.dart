import 'package:flutter/material.dart';
import '../theme/ceci_colors.dart';
import '../theme/ceci_spacing.dart';
import '../widgets/ui/app_card.dart';

class _EstudoItem {
  const _EstudoItem({required this.title, required this.desc, required this.icon, required this.color});

  final String title;
  final String desc;
  final IconData icon;
  final Color color;
}

class EstudosScreen extends StatelessWidget {
  const EstudosScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).extension<CeciColors>()!;
    final items = [
      _EstudoItem(title: 'pomodoro', desc: 'sessões de foco', icon: Icons.timer_rounded, color: c.brand),
      _EstudoItem(title: 'flashcards', desc: 'revisão ativa', icon: Icons.style_rounded, color: c.academic),
      _EstudoItem(title: 'leituras', desc: 'ritmo de leitura', icon: Icons.menu_book_rounded, color: c.statusSuccess),
      _EstudoItem(title: 'questões', desc: 'quiz por tópico', icon: Icons.quiz_rounded, color: c.statusWarning),
      _EstudoItem(title: 'histórico', desc: 'sessões passadas', icon: Icons.history_rounded, color: c.textTertiary),
      _EstudoItem(title: 'meta do dia', desc: 'seu plano de ação', icon: Icons.flag_rounded, color: c.brandStrong),
    ];

    return ListView(
      padding: const EdgeInsets.all(CeciSpacing.xl),
      children: [
        Text('study corner', style: Theme.of(context).textTheme.displayLarge),
        const SizedBox(height: CeciSpacing.xs),
        Text('foco, revisão e leitura num lugar só.', style: Theme.of(context).textTheme.bodyMedium),
        const SizedBox(height: CeciSpacing.lg),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            mainAxisExtent: 120,
            mainAxisSpacing: CeciSpacing.md,
            crossAxisSpacing: CeciSpacing.md,
          ),
          itemCount: items.length,
          itemBuilder: (_, i) => _StudyCard(item: items[i]),
        ),
      ],
    );
  }
}

class _StudyCard extends StatelessWidget {
  const _StudyCard({required this.item});

  final _EstudoItem item;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: () {},
      padding: const EdgeInsets.all(CeciSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(item.icon, size: 18, color: item.color),
          const SizedBox(height: CeciSpacing.sm),
          Text(
            item.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 2),
          Text(
            item.desc,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}