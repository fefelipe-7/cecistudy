import 'package:flutter/material.dart';
import '../theme/ceci_colors.dart';
import '../theme/ceci_spacing.dart';
import '../widgets/ui/app_card.dart';
import '../widgets/ui/app_empty_state.dart';

class _BibliotecaSection {
  const _BibliotecaSection({required this.title, required this.icon, required this.items, this.divider = false});

  final String title;
  final IconData icon;
  final List<String> items;
  final bool divider;
}

class BibliotecaScreen extends StatefulWidget {
  const BibliotecaScreen({super.key});

  @override
  State<BibliotecaScreen> createState() => _BibliotecaScreenState();
}

class _BibliotecaScreenState extends State<BibliotecaScreen> {
  String? _selectedItem;

  static final _sections = <_BibliotecaSection>[
    _BibliotecaSection(
      title: 'meus materiais',
      icon: Icons.folder_special_rounded,
      items: const ['notas avulsas', 'continuar lendo', 'salvos'],
    ),
    _BibliotecaSection(
      title: 'explorar',
      icon: Icons.explore_rounded,
      items: const [
        'entre o eu e o outro',
        'psicoterapia',
        'psicanálise',
        'behaviorismo',
        'colunas & temas',
        'templo de conhecimento',
      ],
      divider: true,
    ),
  ];

  void _select(String item) {
    setState(() => _selectedItem = item);
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // Mestre: seções da biblioteca
        SizedBox(
          width: 288,
          child: DecoratedBox(
            decoration: BoxDecoration(
              border: Border(right: BorderSide(color: Theme.of(context).extension<CeciColors>()!.borderSubtle)),
            ),
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: CeciSpacing.sm, vertical: CeciSpacing.sm),
              children: [
                for (final section in _sections) ...[
                  if (section.divider) ...[
                    const SizedBox(height: CeciSpacing.xs),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: CeciSpacing.sm),
                      child: Divider(),
                    ),
                  ],
                  Padding(
                    padding: const EdgeInsets.fromLTRB(CeciSpacing.sm, CeciSpacing.sm, CeciSpacing.sm, CeciSpacing.sm),
                    child: Row(
                      children: [
                        Icon(section.icon, size: 14, color: Theme.of(context).extension<CeciColors>()!.textTertiary),
                        const SizedBox(width: CeciSpacing.sm),
                        Text(section.title.toUpperCase(), style: Theme.of(context).textTheme.labelSmall),
                      ],
                    ),
                  ),
                  for (final item in section.items)
                    _LibraryListItem(
                      label: item,
                      selected: item == _selectedItem,
                      onTap: () => _select(item),
                    ),
                ],
              ],
            ),
          ),
        ),
        // Detalhe
        Expanded(
          child: _selectedItem == null ? _DefaultDetail() : _SectionDetail(label: _selectedItem!),
        ),
      ],
    );
  }
}

class _LibraryListItem extends StatelessWidget {
  const _LibraryListItem({required this.label, required this.selected, required this.onTap});

  final String label;
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
          child: Row(
            children: [
              Expanded(
                child: Text(
                  label,
                  style: Theme.of(context)
                      .textTheme
                      .titleMedium!
                      .copyWith(color: selected ? c.textPrimary : c.textSecondary),
                ),
              ),
              if (selected) Icon(Icons.chevron_right_rounded, size: 18, color: c.brandStrong),
            ],
          ),
        ),
      ),
    );
  }
}

class _DefaultDetail extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(CeciSpacing.xl),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('biblioteca', style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: CeciSpacing.xs),
          Text('escolha uma seção para ver o acervo.', style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: CeciSpacing.xl),
          AppEmptyState(
            title: 'seu cantinho de leitura começa aqui',
            message: 'coleções, templo de conhecimento e suas notas avulsas.',
            icon: Icons.auto_stories_rounded,
            actionLabel: 'explorar catálogo',
            onAction: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('catálogo chega com o módulo biblioteca ♡')),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _SectionDetail extends StatelessWidget {
  const _SectionDetail({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).extension<CeciColors>()!;
    return ListView(
      padding: const EdgeInsets.all(CeciSpacing.xl),
      children: [
        Text(label, style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: CeciSpacing.xs),
        Text('conteúdo de "$label"', style: Theme.of(context).textTheme.bodyMedium),
        const SizedBox(height: CeciSpacing.lg),
        Row(
          children: [
            AppCard(
              padding: const EdgeInsets.all(CeciSpacing.xl),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.menu_book_rounded, size: 20, color: c.academic),
                  const SizedBox(height: CeciSpacing.md),
                  Text('coleções', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: CeciSpacing.sm),
                  Text('acervo do catálogo por família.', style: Theme.of(context).textTheme.bodyMedium),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }
}