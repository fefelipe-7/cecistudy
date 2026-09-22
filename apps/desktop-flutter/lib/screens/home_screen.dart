import 'package:flutter/material.dart';
import '../theme/ceci_colors.dart';
import '../theme/ceci_spacing.dart';
import '../widgets/ui/app_card.dart';
import '../widgets/ui/app_badge.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).extension<CeciColors>()!;
    return ListView(
      padding: const EdgeInsets.all(CeciSpacing.xl),
      children: [
        // Saudação
        Row(
          children: [
            const Icon(Icons.wb_sunny_rounded, size: 28),
            const SizedBox(width: CeciSpacing.sm),
            Text('Bom dia', style: Theme.of(context).textTheme.displayLarge),
          ],
        ),
        const SizedBox(height: CeciSpacing.sm),
        Text('hoje é um ótimo dia para estudar psicologia.', style: Theme.of(context).textTheme.bodyMedium),
        const SizedBox(height: CeciSpacing.lg),

        // Stat cards
        Row(
          children: [
            Expanded(child: _StatCard(label: 'streak', value: '12 dias', badge: _VariationBadge(label: '+2', good: true))),
            const SizedBox(width: CeciSpacing.md),
            Expanded(child: _StatCard(label: 'tarefas', value: '3 hoje', badge: _VariationBadge(label: '2 pós', good: false))),
            const SizedBox(width: CeciSpacing.md),
            Expanded(child: _StatCard(label: 'provas', value: 'em 1 semana', badge: null)),
            const SizedBox(width: CeciSpacing.md),
            Expanded(child: _StatCard(label: 'leitura', value: '42 pgs', badge: _VariationBadge(label: 'on track', good: true))),
          ],
        ),
        const SizedBox(height: CeciSpacing.lg),

        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              flex: 3,
              child: _AttentionCard(c: c),
            ),
            const SizedBox(width: CeciSpacing.lg),
            Expanded(
              flex: 2,
              child: _QuickActionsCard(),
            ),
          ],
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value, this.badge});

  final String label;
  final String value;
  final Widget? badge;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(CeciSpacing.lg),
      trailing: badge,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: CeciSpacing.sm),
          Text(
            value,
            style: Theme.of(context).textTheme.headlineMedium!.copyWith(fontSize: 22, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

class _VariationBadge extends StatelessWidget {
  const _VariationBadge({required this.label, required this.good});

  final String label;
  final bool good;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).extension<CeciColors>()!;
    return AppBadge(label: label, color: good ? c.statusSuccess : c.statusWarning);
  }
}

class _AttentionCard extends StatelessWidget {
  const _AttentionCard({required this.c});

  final CeciColors c;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(CeciSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.notifications_rounded, size: 18, color: c.brandStrong),
              const SizedBox(width: CeciSpacing.sm),
              Text('Atenção do dia', style: Theme.of(context).textTheme.titleMedium!.copyWith(color: c.brandStrong)),
            ],
          ),
          const SizedBox(height: CeciSpacing.md),
          const _AttentionRow(icon: Icons.menu_book_rounded, text: 'Revisar anotações de psicologia do desenvolvimento'),
          const SizedBox(height: CeciSpacing.sm),
          const _AttentionRow(icon: Icons.description_rounded, text: 'Entregar resumo de TCC'),
          const SizedBox(height: CeciSpacing.sm),
          const _AttentionRow(icon: Icons.style_rounded, text: 'Revisar flashcards de teorias'),
          const SizedBox(height: CeciSpacing.md),
          Wrap(
            spacing: CeciSpacing.sm,
            runSpacing: CeciSpacing.sm,
            children: [
              AppBadge(label: '3 tarefas', color: c.brand),
              AppBadge(label: '1 prova', color: c.academic),
            ],
          ),
        ],
      ),
    );
  }
}

class _AttentionRow extends StatelessWidget {
  const _AttentionRow({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).extension<CeciColors>()!;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: c.textTertiary),
        const SizedBox(width: CeciSpacing.sm),
        Expanded(
          child: Text(text, style: Theme.of(context).textTheme.bodyMedium),
        ),
      ],
    );
  }
}

class _QuickActionsCard extends StatelessWidget {
  const _QuickActionsCard();

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).extension<CeciColors>()!;
    return AppCard(
      padding: const EdgeInsets.all(CeciSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('bora estudar?', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: CeciSpacing.md),
          _ActionButton(icon: Icons.timer_rounded, label: 'foco', accent: c.brand, onTap: () {}),
          const SizedBox(height: CeciSpacing.sm),
          _ActionButton(icon: Icons.style_rounded, label: 'revisar flashcards', accent: c.academic, onTap: () {}),
          const SizedBox(height: CeciSpacing.sm),
          _ActionButton(icon: Icons.menu_book_rounded, label: 'continuar leitura', accent: c.statusSuccess, onTap: () {}),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.icon,
    required this.label,
    required this.accent,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color accent;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).extension<CeciColors>()!;
    return Material(
      color: c.surfaceSubtle,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: CeciSpacing.md, vertical: 10),
          child: Row(
            children: [
              Icon(icon, size: 18, color: accent),
              const SizedBox(width: CeciSpacing.sm),
              Expanded(child: Text(label, style: Theme.of(context).textTheme.titleMedium)),
              Icon(Icons.chevron_right_rounded, size: 18, color: c.textTertiary),
            ],
          ),
        ),
      ),
    );
  }
}