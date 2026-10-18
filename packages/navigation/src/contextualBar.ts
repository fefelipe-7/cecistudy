/**
 * Barra contextual — **regras puras**, sem React, sem plataforma, sem DOM
 * (SPEC-M-018 D1).
 *
 * O motivo deste arquivo existir separada do componente: o componente é
 * apresentacional e não pode saber nada de tela. Tudo que é *regra* — quando a
 * barra existe, o que é primário, o que é secundário, qual entra por padrão, se o
 * botão `⋯` tem o que mostrar — mora aqui e é testável sem renderizar nada.
 *
 * ## O predicado é único, e é o mesmo dos dois lados
 *
 * D13: a barra aparece **exatamente** onde o `HeaderNav` perde o `⋯` e o voltar.
 * `HeaderNav` renderiza o voltar quando `headerConfig.onBack` é truthy
 * (`src/components/HeaderNav.tsx:104`) e o `⋯` quando `actions` tem conteúdo
 * (`src/components/ui/HeaderActionMenu.tsx:29`). Se a barra calculasse a
 * presença por conta própria, os dois divergiriam e a usuária veria uma tela sem
 * retorno, ou dois retornos. Por isso quem calcula é **esta** função, e o shell
 * passa o mesmo resultado para o header e para a barra (invariante `I11`).
 *
 * ## A3 está aberta — e isso é visível no tipo
 *
 * `primary` pode ser vazio, e quando é a barra renderiza em **dois** controles
 * (`⋯` + `‹`), sem cápsula central. Isso **não** é um estado provisorio esquecido:
 * é a leitura `A3.a` da SPEC-M-018, que é a fiel ao que está escrito hoje em
 * `SPEC-010 D1` ("a ação primária fica no hero; a barra inferior só leva
 * secundárias"). Ligar a cápsula é marcar **uma** ação com `role: 'primary'` em
 * `src/lib/headerConfig.ts` — nenhuma linha desta spec precisa mudar.
 */

import type { NavScreen } from './types';

/** Papel de uma ação na barra. `secondary` é o padrão e o que toda tela declara hoje. */
export type BarActionRole = 'primary' | 'secondary';

/**
 * Referência React-free a uma ação. O `id` é o que torna a seleção um dado e não
 * um índice — é o que sobrevive a reordenar a lista.
 */
export interface BarActionRef {
  readonly id: string;
  readonly role?: BarActionRole;
}

/** Por que a barra não existe. Útil para teste e para o caso de borda "não montar nada". */
export type ContextualBarAbsentReason =
  /** Tela de aba: quem mora no rodapé é a pílula (`isBottomNavVisible`). */
  | 'aba'
  /** Nada para voltar: montar a seta seria um botão que não faz nada (§6.1). */
  | 'sem-voltar'
  /** Nenhuma ação contextual declarada por esta tela. */
  | 'sem-opcoes';

export type ContextualBarPlan =
  | { readonly visible: false; readonly reason: ContextualBarAbsentReason }
  | {
      readonly visible: true;
      /**
       * Ids das ações que ocupam a cápsula central, em ordem de preferência.
       * **Pode ser vazia** enquanto A3 estiver aberta — ver o cabeçalho.
       */
      readonly primary: readonly string[];
      /** Ids das demais, na ordem em que vão para o painel. */
      readonly secondary: readonly string[];
      /** Entra em `expanded` quando a usuária ainda não escolheu. Sempre existe. */
      readonly defaultPrimaryId: string;
      /** `false` enquanto A3 estiver aberta: sem primária não há cápsula. */
      readonly hasCenterCapsule: boolean;
      /**
       * `false` quando não há **nada além** do que a cápsula (ou a seta) já
       * executa: o `⋯` não é montado (§5.1, seção vazia). Quando não há
       * cápsula e sobrou uma ação, ele é `true` — é a única via até ela, e
       * escondê-la deixaria a ação inalcançável.
       */
      readonly hasOptionsButton: boolean;
      /** Sempre `true` quando visível (SPEC-M-018 A2 rejeitou o botão condicional). */
      readonly back: true;
    };

export interface ContextualBarInput {
  readonly kind: NavScreen['kind'];
  readonly canGoBack: boolean;
  readonly actions: readonly BarActionRef[];
}

const ABSENT = {
  aba: { visible: false, reason: 'aba' },
  semVoltar: { visible: false, reason: 'sem-voltar' },
  semOpcoes: { visible: false, reason: 'sem-opcoes' },
} as const;

/**
 * Deriva o plano da barra a partir do topo da pilha.
 *
 * Puro e total: para qualquer entrada devolve um plano, e o plano nunca exige
 * que o chamador "limpe" o resultado antes de usar.
 */
export function planContextualBar(input: ContextualBarInput): ContextualBarPlan {
  const { kind, canGoBack, actions } = input;

  // A pílula de abas e a barra são disjuntas: a pílula vive nas telas de aba e a
  // barra nas empilhadas. Verificar isto primeiro mantém o motivo honesto quando
  // uma tela de aba também declarasse ações.
  if (kind === 'tab') return ABSENT.aba;
  if (!canGoBack) return ABSENT.semVoltar;
  if (actions.length === 0) return ABSENT.semOpcoes;

  const primary: string[] = [];
  const secondary: string[] = [];
  for (const action of actions) {
    if (action.role === 'primary') primary.push(action.id);
    else secondary.push(action.id);
  }

  // Sem primária declarada (estado atual, enquanto A3 está aberta) a primeira
  // ação ainda é executável pelo `⋯` — só não ganha cápsula. Garante que
  // `defaultPrimaryId` nunca seja inventado: sai de uma lista que existe.
  const fallbackId = actions[0]?.id;
  const defaultPrimaryId = primary[0] ?? secondary[0] ?? fallbackId;

  // Só acontece com lista vazia, que já saiu em `sem-opcoes` acima. O throw é
  // para transformar um invariante quebrado em falha barulhenta em vez de
  // `undefined` silencioso renderizando um botão morto.
  if (defaultPrimaryId === undefined) {
    throw new Error('planContextualBar: lista de ações não vazia sem id — invariante I6');
  }

  return {
    visible: true,
    primary,
    secondary,
    defaultPrimaryId,
    hasCenterCapsule: primary.length > 0,
    hasOptionsButton: secondary.length > 0,
    back: true,
  };
}

/** O plano visível, para o componente ler sem repetir o discriminante. */
export type VisibleContextualBarPlan = Extract<ContextualBarPlan, { visible: true }>;

/** Guard de estreitamento — `plan.visible` sozinho não é o bastante para o TS. */
export function isBarVisible(
  plan: ContextualBarPlan,
): plan is VisibleContextualBarPlan {
  return plan.visible;
}