/**
 * Dataset da biblioteca no nativo: lê as obras do banco do catálogo SQLite e
 * passa pela MESMA curadoria do facade web (`curateLibrary`) — estruturas
 * idênticas, fonte diferente.
 *
 * Fallback: qualquer falha devolve `null` e a view segue com o facade estático
 * (embutido no bundle), sem quebrar nada.
 */
import type { LibraryDataset } from '../data/books/curate.ts';
import { curateLibrary } from '../data/books/curate.ts';
import type { Article, CatalogBook, InterdisciplinaryBook } from '../data/books/types.ts';
import { getCatalogWorksByType } from './db/catalogDb.ts';
import { isNativePlatform } from './storage.ts';

/**
 * Carrega o dataset completo da biblioteca do catálogo.
 * `null` = web ou catálogo indisponível/vazio (usar facade estático).
 */
export async function loadNativeLibraryDataset(): Promise<LibraryDataset | null> {
  if (!isNativePlatform) return null;
  try {
    const [catalogRows, interdisciplinaryRows, articleRows] = await Promise.all([
      getCatalogWorksByType('catalog'),
      getCatalogWorksByType('interdisciplinary'),
      getCatalogWorksByType('article'),
    ]);
    if (catalogRows.length === 0 && interdisciplinaryRows.length === 0 && articleRows.length === 0) {
      return null;
    }
    const catalogBooks = catalogRows as CatalogBook[];
    const interdisciplinaryBooks = interdisciplinaryRows as InterdisciplinaryBook[];
    const articles = articleRows as Article[];

    return {
      catalogBooks,
      interdisciplinaryBooks,
      articles,
      ...curateLibrary({ catalogBooks, interdisciplinaryBooks, articles }),
    };
  } catch (e) {
    console.error('[catalogLibrary] falha ao carregar obras do catálogo', e);
    return null;
  }
}
