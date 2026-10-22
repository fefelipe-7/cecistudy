/**
 * BibliotecaScreen — o acervo, o que e seu, e o que da para explorar.
 *
 * A tela do web e a unica sem hero: comeca num label + h1 e cai direto em
 * "minhas colecoes". Foi uma escolha boa no web (a biblioteca nao e sobre a
 * pessoa, e sobre o acervo), e aqui continua sendo — mas o primeiro bloco
 * ganhou o **avatar de leitura**: quantos livros, quanto lido, o que esta
 * aberto agora. Sem isso, a tela abre sem rosto.
 *
 * As capas sao o detalhe que mais importa aqui. No web cada `MiniBookCard` e
 * um retangulo com a cor do livro. No RN a capa vira um livro de verdade:
 * lombada, sombra projetada e o titulo em serifa na parte de baixo. E o unico
 * lugar do app onde a **cor vem do dado** — o token `cover.ink` garante que o
 * texto leia em qualquer tom escolhido.
 */
import React, { useState } from 'react';
import { Text, View } from 'react-native';

import { ProgressBar } from '../components/Feedback';
import { Card } from '../components/HeroCard';
import { PillGroup } from '../components/PillGroup';
import { Section } from '../components/Section';
import { Tappable } from '../components/Tappable';
import { collections, myBooks, shelfSections } from '../mocks';
import { border, ceci, cover, radius, shadow, status, surface } from '../tokens';

const FILTROS = [
  { value: 'tudo', label: 'tudo' },
  { value: 'clinica', label: 'clínica' },
  { value: 'teorias', label: 'teorias' },
  { value: 'autor', label: 'autor' },
];

export function BibliotecaScreen() {
  const [filtro, setFiltro] = useState('tudo');

  return (
    <View className="gap-5">
      {/* 1. o que e seu */}
      <Section index={0}>
        <View className="flex-row items-end justify-between">
          <View className="flex-1">
            <Text className="text-[10px] font-bold text-ceci-tertiary uppercase tracking-[1.4px]">biblioteca & repertório</Text>
            <Text className="font-serif text-[28px] leading-[34px] text-ceci-primary mt-1">minhas coleções ♡</Text>
          </View>
          <Tappable onPress={() => {}} scaleTo={0.92} accessibilityRole="button" accessibilityLabel="abrir templo">
            <View style={styles.squareBtn}>
              <Text className="text-[16px]">🏛️</Text>
            </View>
          </Tappable>
        </View>
      </Section>

      {/* 2. leitura em andamento */}
      <Section index={1} label="continuar lendo" accent="brand">
        <View className="flex-row gap-3">
          {myBooks.slice(0, 2).map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </View>
      </Section>

      {/* 3. suas notas */}
      <Section index={2} label="suas notas" accent="academic">
        <Tappable onPress={() => {}} accessibilityRole="button" accessibilityLabel="anotações rápidas">
          <Card padded={false} className="p-4">
            <View className="flex-row items-center gap-3">
              <View style={[styles.iconTile, { backgroundColor: surface.blue, borderColor: border.academic }]}>
                <Text className="text-[17px]">📄</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-semibold text-ceci-primary">anotações rápidas</Text>
                <Text className="text-[12px] text-ceci-tertiary mt-0.5">
                  12 notas soltas · 4 transformadas em flashcard
                </Text>
              </View>
              <Text style={{ fontSize: 15, color: ceci.faded }}>→</Text>
            </View>
          </Card>
        </Tappable>
      </Section>

      {/* 4. explorar */}
      <Section index={3} label="explorar o acervo" accent="brand">
        <PillGroup options={FILTROS} value={filtro} onChange={setFiltro} variant="rose" />
      </Section>

      {/* 5. as prateiras */}
      <Section index={4}>
        <View className="gap-4">
          {shelfSections.map((shelf) => (
            <View key={shelf.id}>
              <Text className="text-[10px] font-bold text-ceci-tertiary uppercase tracking-[1.2px] mb-2.5">
                {shelf.title}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {shelf.items.map((it) => (
                  <Tappable key={it.id} onPress={() => {}} accessibilityRole="button" accessibilityLabel={it.label}>
                    <View style={styles.shelfChip}>
                      <Text className="text-[13px] font-semibold text-ceci-primary">{it.label}</Text>
                      <View style={styles.countDot}>
                        <Text className="text-[10px] font-bold text-ceci-secondary">{it.count}</Text>
                      </View>
                    </View>
                  </Tappable>
                ))}
              </View>
            </View>
          ))}
        </View>
      </Section>

      {/* 6. as colecoes */}
      <Section index={5} label="o acervo" accent="academic">
        <View className="flex-row flex-wrap gap-2">
          {collections.map((c) => (
            <Tappable key={c.id} onPress={() => {}} accessibilityRole="button" accessibilityLabel={c.title}>
              <View
                style={[
                  styles.collection,
                  c.tone === 'rose' ? { backgroundColor: surface.rose, borderColor: border.brand }
                  : c.tone === 'blue' ? { backgroundColor: surface.blue, borderColor: border.academic }
                  : c.tone === 'green' ? { backgroundColor: status['success-surface'], borderColor: status['success-border'] }
                  : { backgroundColor: status['warning-surface'], borderColor: status['warning-border'] },
                ]}
              >
                <Text className="text-[13px] font-bold text-ceci-primary">{c.title}</Text>
                <Text className="text-[11px] text-ceci-tertiary mt-0.5">{c.count} itens</Text>
              </View>
            </Tappable>
          ))}
        </View>
      </Section>
    </View>
  );
}

/* ── pecas ───────────────────────────────────────────────────────────────── */

/**
 * Capa de livro.
 *
 * `coverColor` vem do dado. O texto usa `cover.ink` (#3B3233), que e
 * theme-invariant de proposito: uma capa escolhida como "creme claro" ficaria
 * ilegivel se o texto herdasse a cor da surface.
 */
function BookCard({ book }: { book: (typeof myBooks)[number] }) {
  return (
    <Tappable onPress={() => {}} accessibilityRole="button" accessibilityLabel={book.title} className="flex-1">
      <View
        className="overflow-hidden"
        style={[{ backgroundColor: surface.DEFAULT, borderRadius: radius.lg, borderWidth: 1, borderColor: border.subtle }, shadow.sm]}
      >
        <View style={[styles.cover, { backgroundColor: book.coverColor }]}>
          <View style={styles.spine} />
          <Text numberOfLines={3} style={{ color: book.ink, fontSize: 11, fontWeight: '700', lineHeight: 14 }}>
            {book.title}
          </Text>
          <Text numberOfLines={1} style={{ color: book.ink, fontSize: 9, opacity: 0.7, marginTop: 4 }}>
            {book.author}
          </Text>
        </View>

        <View className="p-3">
          <View className="flex-row items-center justify-between mb-1.5">
            <Text className="text-[10px] text-ceci-muted">
              {book.progress > 0 ? 'em andamento' : 'salvo pra depois'}
            </Text>
            {book.progress > 0 ? (
              <Text className="text-[10px] font-bold text-ceci-brand-strong">{Math.round(book.progress * 100)}%</Text>
            ) : null}
          </View>
          <ProgressBar value={book.progress || 0.001} tone="brand" height={4} />
        </View>
      </View>
    </Tappable>
  );
}

const styles = {
  squareBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: surface.glassStrong,
    borderWidth: 1,
    borderColor: border.subtle,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  cover: {
    height: 132,
    padding: 12,
    paddingLeft: 16,
    justifyContent: 'flex-end' as const,
    overflow: 'hidden' as const,
  },
  spine: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: 'rgba(0,0,0,0.10)',
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
  },
  shelfChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 7,
    paddingLeft: 13,
    paddingRight: 7,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: surface.DEFAULT,
    borderWidth: 1,
    borderColor: border.DEFAULT,
  },
  countDot: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: surface.muted,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  collection: {
    width: '48%',
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
};

export default BibliotecaScreen;