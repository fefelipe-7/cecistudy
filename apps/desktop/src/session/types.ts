/**
 * Tipos de estado de sessão da experiência desktop (Fase 8).
 * Canônico em `apps/desktop` — saiu de `src/types.ts` durante a separação
 * mobile/desktop. É importado como type-only por `src/context/AppContext`
 * (facade em decomposição) até o `DataClient` assumir esse estado.
 */

export type CanvasClarity = 'calmo' | 'foco' | 'denso';
export type UiDensity = 'conforto' | 'compacto';

export interface DesktopSessionState {
  /** Último workspace ativo (default = ws-academico). */
  lastWorkspaceId: string;
  /** Workspace ativo espelhado na casca desktop (default = ws-academico). */
  activeWorkspaceId: string;
  /** Documentos abertos no editor mestre (master-detail). */
  openDocuments: string[];
  /** Painéis ativos na área de trabalho (ex.: 'graph', 'calendar'). */
  activePanels: string[];
  /** Módulo atual da área de trabalho. */
  activeModule: 'conhecimento' | 'marketing' | 'projetos' | 'calendario';
  /** Estado de layout livre (posições/redimensionamento de painéis). */
  layoutState: Record<string, unknown>;
  /** Nó selecionado no grafo de conhecimento. */
  selectedGraphNodeId?: string;
  /** Viewport do grafo (pan/zoom) para restauração. */
  graphViewport?: { x: number; y: number; zoom: number };
  /** Sidebar recolhida (default = false). */
  sidebarCollapsed: boolean;
  /** Clareza da tela (calmo/foco/denso — densidade visual). */
  canvasClarity: CanvasClarity;
  /** Densidade de UI (conforto/compacto). */
  density: UiDensity;
  /** Inspector de contexto aberto (default = false). */
  inspectorOpen: boolean;
  /** Command palette aberto (default = false). */
  isCommandPaletteOpen: boolean;
  /** Histórico de comandos (últimos ids/queries). */
  commandHistory: string[];
  /** Painel do grafo de conhecimento aberto (default = false). */
  isKnowledgeGraphOpen: boolean;
  /** Painel de projetos & TCC aberto (default = false). */
  isProjectsOpen: boolean;
  /** Inbox de curadoria aberto (default = false). */
  isInboxOpen: boolean;
}
