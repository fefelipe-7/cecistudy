/**
 * Tipos de dados compartilhados por todos os charts dithered.
 * Objetivo: separar a lógica de cálculo da UI e permitir
 * que qualquer componente receba dados já formatados.
 * Todos os valores numéricos vêm como dados puros (number),
 * e cores são hex strings usadas como dados (via style={}), nunca em className.
 */

// ----- Série única de um segmento (ex.: "sessões de foco", 1240) -----

export interface ChartSeries {
  /** Rótulo exibido (ex.: "sessões de foco") */
  label: string;
  /** Valor bruto (contagem, minutos, etc.) */
  value: number;
  /** Cor hex opcional (usada via style={{ backgroundColor: color }}) */
  color?: string;
}

// ----- Configuração visual do chart (título, ícone, subtítulo) -----

export interface ChartConfig {
  /** Título principal (ex.: "Tempo por Área") */
  title: string;
  /** Subtítulo explicativo (ex.: "Onde seu tempo foi") */
  subtitle: string;
  /** Ícone React node no canto superior direito */
  icon: React.ReactNode;
}

// ----- Dados do Donut Chart (fatias + total) -----

export interface DonutData {
  /** Série de segmentos [label, value, color?] */
  series: ChartSeries[];
  /** Soma total de todos os valores (ex.: 3250) */
  total: number;
  /** Configuração visual padrão */
  config: ChartConfig;
}

// ----- Dados do Growth Chart (série temporal + tendência) -----

export interface GrowthData {
  /** Valores numéricos ao longo do tempo [n.minutos, ...] */
  data: number[];
  /** Rótulos do eixo X (datas ou períodos) */
  labels: string[];
  /** Crescimento percentual primeiro→último ponto */
  trend: {
    /** Valor percentual, ex.: +14 ou -3 */
    value: number;
    /** true se cresceu, false se diminuiu, null se indetectável */
    up: boolean | null;
  };
  /** Configuração visual padrão */
  config: ChartConfig;
}

// ----- Dados do Funnel Chart (estágios + conversão) -----

export interface FunnelData {
  /** Etapas do funil [label, value, color?] */
  stages: ChartSeries[];
  /** Valor do estágio inicial (para cálculo de porcentagem) */
  firstValue: number;
  /** Configuração visual padrão */
  config: ChartConfig;
}

// ----- Dados da Revenue Line Chart (linha temporal + resumo) -----

export interface RevenueData {
  /** Valores ao longo do tempo [minutos/dia, ...] */
  data: number[];
  /** Rótulos do eixo X (Datas) */
  labels: string[];
  /** Soma total de todos os valores */
  total: number;
  /** Média arredondada dos valores */
  average: number;
  /** Configuração visual padrão */
  config: ChartConfig;
}

// ----- Dados unificados para integração com o AppContext -----

export interface UserChartData {
  /** Dados do donut (tempo por área) */
  donut?: DonutData;
  /** Dados do growth (evolução temporal) */
  growth?: GrowthData;
  /** Dados do funil (jornada de estudo) */
  funnel?: FunnelData;
  /** Dados da revenue line (evolução de minutos) */
  revenue?: RevenueData;
}