import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import HeroSection from '../HeroSection';
import AttentionSection from '../AttentionSection';
import { DataClientCoursesContext } from '../../../../context/DataClientProvider';
import { NavValueContext } from '../../../../context/shellNavContexts';
import { MobileAppProvider } from '../../../../../apps/mobile/src/MobileAppProvider';

/** Mínimo suficiente para renderizar `AttentionSection` (lista vazia não toca
   `tasks`/`exams` nem `nav`). */
const COURSES_CTX = { courses: [], tasks: [], exams: [] } as never;
const NAV_CTX = { openCalendar: () => {} } as never;

const heroProps = {
  formattedDate: 'segunda-feira',
  greeting: 'oi',
  name: 'Ceci',
  dayMessage: 'x',
  mascote: 'books-cozy' as const,
};

describe('Home — coreografia de abertura (SPEC-M-028 D27 / F4.5)', () => {
  it('hero entra só na primeira montagem: classe presente quando entrada=true', () => {
    render(<HeroSection entrada={true} {...heroProps} />);
    expect(
      screen.getByText(/oi/).closest('section')?.classList.contains('home-hero-entrada'),
    ).toBe(true);
  });

  it('hero não reanima na volta: classe ausente quando entrada=false', () => {
    render(<HeroSection entrada={false} {...heroProps} />);
    expect(
      screen.getByText(/oi/).closest('section')?.classList.contains('home-hero-entrada'),
    ).toBe(false);
  });

  it('lista vazia não anima: estado vazio renderizado sem wrapper de movimento', () => {
    render(
      <MobileAppProvider>
        <NavValueContext.Provider value={NAV_CTX}>
          <DataClientCoursesContext.Provider value={COURSES_CTX}>
            <AttentionSection items={[]} remainingCount={0} entrada={true} />
          </DataClientCoursesContext.Provider>
        </NavValueContext.Provider>
      </MobileAppProvider>,
    );
    expect(screen.getByText(/nada urgente por aqui/)).toBeInTheDocument();
  });
});
