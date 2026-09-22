import 'package:flutter/material.dart';
import '../theme/ceci_colors.dart';
import '../theme/ceci_spacing.dart';
import '../widgets/ui/app_card.dart';

class PerfilScreen extends StatelessWidget {
  const PerfilScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).extension<CeciColors>()!;
    return ListView(
      padding: const EdgeInsets.all(CeciSpacing.xl),
      children: [
        Text('perfil', style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: CeciSpacing.xs),
        Text('sua jornada até a psicologia. este módulo chega em breve.', style: Theme.of(context).textTheme.bodyMedium),
        const SizedBox(height: CeciSpacing.lg),
        AppCard(
          padding: const EdgeInsets.all(CeciSpacing.xl),
          child: Row(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: c.surfaceRose,
                child: Text('C', style: TextStyle(color: c.brandStrong, fontSize: 24, fontWeight: FontWeight.w600)),
              ),
              const SizedBox(width: CeciSpacing.lg),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('sua jornada', style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: CeciSpacing.xs),
                    Text(
                      'streak, stickers, estágio e TCC aqui.',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}