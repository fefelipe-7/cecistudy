import 'package:flutter/material.dart';
import '../../theme/ceci_colors.dart';

/// Input padronizado (wrapper fino sobre [TextField], herda o InputDecoration
/// do tema). Nunca usar TextField cru — garante fill `surfaceSubtle`, label
/// acima do campo e foco com borda accent.
class AppInput extends StatelessWidget {
  const AppInput({
    super.key,
    required this.controller,
    this.hintText,
    this.label,
    this.prefixIcon,
    this.suffixIcon,
    this.autofocus = false,
    this.multiline = false,
    this.textInputAction,
    this.onChanged,
    this.onSubmitted,
    this.keyboardType,
  });

  final TextEditingController controller;
  final String? hintText;
  final String? label;
  final IconData? prefixIcon;
  final Widget? suffixIcon;
  final bool autofocus;
  final bool multiline;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final TextInputType? keyboardType;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).extension<CeciColors>()!;
    final input = TextField(
      controller: controller,
      autofocus: autofocus,
      onChanged: onChanged,
      onSubmitted: onSubmitted,
      textInputAction: textInputAction,
      keyboardType: keyboardType,
      maxLines: multiline ? null : 1,
      style: TextStyle(fontSize: 14, height: 1.4, color: c.textPrimary),
      decoration: InputDecoration(
        hintText: hintText,
        prefixIcon: prefixIcon != null ? Icon(prefixIcon, size: 18, color: c.textTertiary) : null,
        suffixIcon: suffixIcon,
      ),
    );
    if (label == null) return input;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label!,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, height: 1.4),
        ),
        const SizedBox(height: 6),
        input,
      ],
    );
  }
}