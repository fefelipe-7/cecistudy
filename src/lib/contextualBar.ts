/**
 * Adaptador entre o `headerConfig` (lado React) e o plano puro da barra
 * (SPEC-M-018 D1).
 *
 * Morar em `src/lib` e não em `packages/navigation` por um motivo de fronteira:
 * `HeaderAction.Icon` é um componente React, e `packages/*` nunca importa
 * `react` (`node .github/scripts/check-boundaries.mjs:73-101`). Então o pacote
 * trabalha com `{ id, role }` — e este arquivo é o único que sabe atravessar
 * essa fronteira nos dois sentidos.
 *
 * **Regra única, usada nos dois lados (D13/I11).** `buildContextualBarModel` é a
 * única fonte de "a barra existe?". O shell passa o resultado ao header (para ele
 * esconder voltar e `⋯`) e à barra (para renderizar). Não há segunda consulta ao
 * `headerConfig` em lugar nenhum, então os dois não podem divergir.
 */

import { isBarVisible, planContextualBar } from '../../packages/navigation/src/contextualBar';
import type {
  ContextualBarPlan,
  VisibleContextualBarPlan,
} from '../../packages/navigation/src/contextualBar';
import type { DynamicHeaderConfig, HeaderAction, NavScreen } from '../types';

export type { ContextualBarPlan, VisibleContextualBarPlan };
export { isBarVisible };

/** Plano visível com as ações resolvidas de volta (com `Icon` e `onClick`). */
export interface ContextualBarModel {
  readonly plan: VisibleContextualBarPlan;
  readonly primary: readonly HeaderAction[];
  readonly secondary: readonly HeaderAction[];
  /** Lookup por id. `getAction(id)` nunca devolve `undefined` para id do plano. */
  getAction: (id: string) => HeaderAction | undefined;
}

export interface ContextualBarModelInput {
  readonly currentScreen: NavScreen;
  readonly canGoBack: boolean;
  readonly headerConfig: DynamicHeaderConfig | null | undefined;
}

/**
 * Assinatura estável das ações, para o `useMemo` do shell não invalidar a cada
 * render. `headerConfig` é reconstruído a cada render do engine; comparar
 * objeto casaria por referência e a memoização não valeria nada.
 */
export function contextualBarSignature(
  headerConfig: DynamicHeaderConfig | null | undefined,
): string {
  const actions = headerConfig?.actions;
  if (!actions || actions.length === 0) return '';
  return actions.map((a) => `${a.id}:${a.role ?? 's'}`).join('|');
}

/**
 * Deriva o modelo da barra. Devolve o plano ausente quando ela não existe — o
 * componente trata os dois casos e não precisa perguntar nada ao header.
 */
export function buildContextualBarModel(
  input: ContextualBarModelInput,
): ContextualBarModel | ContextualBarPlan {
  const { currentScreen, canGoBack, headerConfig } = input;
  const actions = headerConfig?.actions ?? [];

  const plan = planContextualBar({
    kind: currentScreen.kind,
    canGoBack,
    actions: actions.map((a) => ({ id: a.id, role: a.role })),
  });

  if (!isBarVisible(plan)) return plan;

  const byId = new Map(actions.map((a) => [a.id, a]));
  const resolve = (ids: readonly string[]) =>
    ids.map((id) => byId.get(id)).filter((a): a is HeaderAction => a !== undefined);

  const model: ContextualBarModel = {
    plan,
    primary: resolve(plan.primary),
    secondary: resolve(plan.secondary),
    getAction: (id) => byId.get(id),
  };
  return model;
}

/** Estreita para o modelo com ações. Lê melhor que `isVisible(model)` no JSX. */
export function isBarModel(model: ContextualBarModel | ContextualBarPlan): model is ContextualBarModel {
  return 'plan' in model;
}