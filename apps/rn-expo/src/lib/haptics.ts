/**
 * haptics.ts — o "toque" do app.
 *
 * No web o feedback e visual (`:active`). No RN ele e **tátil**, e isso muda a
 * sensacao do produto inteiro. Regra: haptico marca *decisao*, nao *movimento* —
 * trocar de aba, confirmar um pill, fechar um sheet. Nunca em scroll nem em
 * entrada de card.
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Toque leve — selecao, troca de aba, toggle. */
export const tap = () => {
  if (Platform.OS === 'web') return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/** Toque firme — acao primaria, "montar meu cantinho", concluir sessao. */
export const press = () => {
  if (Platform.OS === 'web') return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

/** Sucesso — registro guardado, onboarding concluido. */
export const success = () => {
  if (Platform.OS === 'web') return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

/** Aviso — estado que exige cuidado (permissao negada, streak quebrado). */
export const warn = () => {
  if (Platform.OS === 'web') return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
};