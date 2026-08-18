import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DitherGrowthChart } from '../dither-growth';
import { DitherDonutChart } from '../dither-donut';
import { DitherFunnelChart } from '../dither-funnel';
import { RevenueLineChart } from '../dither-revenue';
import {
  buildDemoDonutPeriods,
  buildDemoGrowthRanges,
  DEMO_FUNNEL_VARIANTS,
  DEMO_REVENUE_VARIANTS,
} from '../../../lib/ditherChart';

describe('dither charts (smoke)', () => {
  it('DitherGrowthChart renderiza título e seletor de range sem quebrar (jsdom sem canvas)', () => {
    render(<DitherGrowthChart title="minutos de foco" subtitle="por semana" />);
    expect(screen.getByText('minutos de foco')).toBeInTheDocument();
    expect(screen.getByText('por semana')).toBeInTheDocument();
    expect(screen.getByText('7d')).toBeInTheDocument();
    expect(screen.getByText('90d')).toBeInTheDocument();
  });

  it('DitherGrowthChart usa dados próprios quando passados', () => {
    const ranges = buildDemoGrowthRanges();
    render(
      <DitherGrowthChart
        title="evolução"
        subtitle="últimos 7 dias"
        ranges={ranges}
        data={ranges[0].data}
        dates={ranges[0].dates}
      />
    );
    expect(screen.getByText('evolução')).toBeInTheDocument();
  });

  it('DitherDonutChart renderiza centro, lista e seletor de período', () => {
    render(
      <DitherDonutChart
        title="onde seu tempo foi"
        subtitle="por área"
        periods={buildDemoDonutPeriods()}
      />
    );
    expect(screen.getByText('onde seu tempo foi')).toBeInTheDocument();
    expect(screen.getByText('sessões de foco')).toBeInTheDocument();
    expect(screen.getByText('leituras')).toBeInTheDocument();
    expect(screen.getByText('mês')).toBeInTheDocument();
  });

  it('DitherFunnelChart renderiza estágios e total por variante', () => {
    render(
      <DitherFunnelChart
        title="sua jornada"
        subtitle="até aqui"
        variants={DEMO_FUNNEL_VARIANTS}
      />
    );
    expect(screen.getByText('sua jornada')).toBeInTheDocument();
    expect(screen.getByText('disciplinas')).toBeInTheDocument();
    expect(screen.getByText('aulas anotadas')).toBeInTheDocument();
    expect(screen.getByText('semestre passado')).toBeInTheDocument();
  });

  it('RevenueLineChart renderiza título e variantes', () => {
    render(
      <RevenueLineChart
        title="sua evolução"
        subtitle="minutos ao longo do tempo"
        variants={DEMO_REVENUE_VARIANTS}
      />
    );
    expect(screen.getByText('sua evolução')).toBeInTheDocument();
    expect(screen.getByText('esta semana')).toBeInTheDocument();
    expect(screen.getByText('semana passada')).toBeInTheDocument();
  });

  it('RevenueLineChart renderiza com dados próprios sem seletor', () => {
    render(
      <RevenueLineChart
        title="evolução"
        subtitle="7 dias"
        data={[1, 3, 2, 5, 4, 6, 8]}
        labels={['1', '2', '3', '4', '5', '6', '7']}
      />
    );
    expect(screen.getByText('evolução')).toBeInTheDocument();
  });
});
