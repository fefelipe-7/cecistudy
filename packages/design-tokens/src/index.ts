// Source of truth: src/index.css @theme block.
// This barrel exists so tooling and packages can reference the token contract
// without importing React or UI components.
export const DESIGN_TOKENS = {
  colors: {
    canvas: '#FFFCF8',
    surfaceDefault: '#FFFFFF',
    surfaceSubtle: '#FFF8F1',
    surfaceMuted: '#FAF8F5',
    surfaceRose: '#FFF5F7',
    surfaceBlue: '#F3F9FC',
    ceciPrimary: '#40383A',
    ceciSecondary: '#6D6366',
    ceciTertiary: '#918689',
    ceciMuted: '#ADA3A5',
    ceciBrand: '#D85F79',
    ceciBrandStrong: '#B94862',
    ceciAcademic: '#4A879F',
    ceciAcademicStrong: '#396D82',
    ceciBorderSubtle: '#F2EBE8',
    ceciBorderDefault: '#E9DFDC',
    ceciBorderStrong: '#DCCFCA',
    ceciBorderBrand: '#FFD3DD',
    ceciBorderAcademic: '#CEE7F0',
  } as const,
} satisfies Record<string, Readonly<Record<string, string>>>;

export type DesignTokenColor = (typeof DESIGN_TOKENS.colors)[keyof typeof DESIGN_TOKENS.colors];