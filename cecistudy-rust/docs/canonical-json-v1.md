# Canonical JSON v1 (cecistudy)

> Spec de serialização canônica compartilhada entre **TypeScript** (cecistudy web/mobile) e
> **Rust** (desktop). Regras idênticas nos dois lados → os mesmos dados produzem **bytes
> idênticos**, o que permite golden files e comparar hashes de conteúdo no sync.
>
> Decisão **D2** (2026-09-10, plano Flutter+Rust). Lands: `cecistudy-rust/contracts/golden/`
> (fixtures) + `packages/contracts/src/canonical-json.ts` (TS) + `cecistudy-content` (Rust).
> Status: **aprovada** (2026-09-10).

## 1. Propósito

`JSON.stringify`/`serde_json::to_string` por si sós **não são canônicos**:

- Ordem de chaves de objeto é ordem de inserção (TS usa insertion order; Rust `serde_json`
  ordena por `BTreeMap`). Dois lados divergem no mesmo dado.
- Strings podem chegar em formas NFD/NFC distintas `"cafe\u0301"` vs `"caf\u00e9"`.
- Floats serializam de formas diferentes conforme o formato (`1.10` vs `1.1`).

A função `canonicalize(v: unknown): string` define **uma e apenas uma** representação para cada
valor — idêntica em TS e Rust.

## 2. Regras

| # | Regra | Detalhe |
|---|---|---|
| 1 | **Tipo raiz** | Qualquer valor (objeto/array/string/número/boolean/null). Será serializado recursivamente. |
| 2 | **Chaves ordenadas** | Em objetos, as chaves são serializadas em **ordem alfabética** (byte-at-a-time, código UTF-8). Recursivo em todos os níveis. |
| 3 | **Arrays preservam ordem** | NUNCA ordenar arrays — a ordem é intencional (blocos de documento, `topics`, etc.). Serializar os itens na ordem recebida. |
| 4 | **Strings NFC** | Toda string é normalizada para NFC antes de serializar (`String.prototype.normalize('NFC')`; Rust: `unicode_normalization`). |
| 5 | **Timestamps ISO 8601 UTC** | Strings que representam data/hora já vêm no formato ISO 8601 UTC (`2026-09-10T15:30:00.000Z`). A canonicalização é apenas o caso-string (regra 4); **não** reformata. Números com `Date.now()` continuam números. |
| 6 | **Floats** | Números seguem **ECMAScript `Number::toString`** (o mesmo de `String(n)`/`JSON.stringify`). TS usa `String(n)` nativo. Rust **deve replicar o mesmo literal**: (a) inteiro (`fract()==0`, `\|x\| < 2^53`) → sem `.0` (`1`); (b) fora disso e com `1e-6 ≤ \|x\| < 1e21` → notação decimal sem expoente (`0.00000123456789`, **não** `1.23456789e-6`); (c) demais → notação científica `Me+X`/`Me-X` com sinal (igual ao JS: `1e-7`, `1e+21`). `NaN`/`±Infinity` não ocorrem (regra 9). |
| 7 | **`null`** | `null` permanece `null`. |
| 8 | **`undefined` / omissão** | `undefined` é equivalente a "campo ausente" e **não é serializado**. No objeto pai, a chave é omitida. |
| 9 | **NaNs/infinitos** | Não ocorrem nos dados de domínio (seriam `null` no `JSON.stringify` que o JS emite; rejeitados no Rust). Documentado para invariante — não codificar caso de uso. |
| 10 | **Não-escaping idiomático** | Sem whitespace. Strings escapam apenas `"` `\` e controles (como `JSON.stringify`). U+FEFF/ZWNBSP não escapado. |

### Resultado

Um único **string JSON compacto** (sem espaços entre tokens). Ex.:

```json
{"a":1,"b":"café","list":[3,1,2],"nested":{"z":null,"y":true}}
```

## 3. Algoritmo de referência (TS)

```ts
/** Serializa `value` canonicamente (resultado é um JSON compacto determinístico). */
export function canonicalize(value: unknown): string {
  return serialize(value);
}

function serialize(v: unknown): string {
  if (v === null) return 'null';
  if (typeof v === 'string') return JSON.stringify(v.normalize('NFC'));
  if (typeof v === 'number') return numberToString(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (Array.isArray(v)) return '[' + v.map((x) => serialize(x === undefined ? null : x)).join(',') + ']';
  if (typeof v === 'object') {
    const entries = Object.entries(v as Record<string, unknown>)
      .filter(([, val]) => val !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return '{' + entries.map(([k, val]) => JSON.stringify(k) + ':' + serialize(val)).join(',') + '}';
  }
  throw new Error('canonicalize: tipo não suportado');
}

function numberToString(n: number): string {
  // Sem NaN/Infinity nos dados de domínio — preservar o mais curto com round-trip fiel.
  return String(n);
}
```

## 4. Equivalentes Rust (especificação, implementado em Fase 1)

Rust NÃO usa `serde_json` direto (ordena via BTreeMap); usa `serde_json::Value` e re-serializa
com chaves já ordenadas, ou serializa structs com `#[serde(rename_all)]` preservando
slot-order. Para paridade byte a byte com a regra 2 (alfabética), o lado Rust canonicaliza
**sobre `serde_json::Value`** ordenando chaves recursivamente:

```rust
pub fn canonicalize(value: &serde_json::Value) -> String { /* ... */ }
```

- Strings: `value.normalize(NFC)` (`unicode-normalization` crate) antes de codificar.
- Floats: `serde_json::Number` (ryu) — round-trip fiel, `1.0` → `1`.
- Arrays: ordem preservada; `null` itens mantidos.
- `Option::None` → chave omitida (equivalente ao `undefined` TS).

> ⚠️ Regra prática do contrato: dados de domínio nUNCA contêm `NaN`/`Infinity`.

## 5. Testes de paridade

- **TS:** `src/lib/__tests__/canonicalJson.test.ts` — test vectors (ver seção 6) + round-trip
  com objetos reais do domínio.
- **Rust:** `golden_parity_test.rs` (Fase 1) — mesmos fixtures → mesmos bytes.

## 6. Test vectors (compartilhados)

Cada par é `(input, outputEsperado)` — usados de forma **idêntica** nos dois lados.

| # | input (TS) | output esperado |
|---|---|---|
| 1 | `null` | `null` |
| 2 | `true` | `true` |
| 3 | `42` | `42` |
| 4 | `1.5` | `1.5` |
| 5 | `"olá"` | `"olá"` |
| 6 | `[]` | `[]` |
| 7 | `{}` | `{}` |
| 8 | `{b:1, a:2}` | `{"a":2,"b":1}` |
| 9 | `{nested:{z:null, y:true}}` | `{"nested":{"y":true,"z":null}}` |
| 10 | `{list:[3,1,2]}` | `{"list":[3,1,2]}` |
| 11 | `"cafe\u0301"` (NFD é + acento) | `"café"` (NFC) |
| 12 | `{a:undefined, b:null}` | `{"b":null}` |
| 13 | `[undefined, 1]` | `[null,1]` |
| 14 | `{date:"2026-09-10T15:30:00.000Z"}` | `{"date":"2026-09-10T15:30:00.000Z"}` |
| 15 | `{arr:[{b:2,a:1}]}` | `{"arr":[{"a":1,"b":2}]}` |
| 16 | `1e21` | `1e+21` |
| 17 | `0.00000123456789` | `0.00000123456789` |
| 18 | `1e-7` | `1e-7` |
| 19 | `123456789.123456789` | `123456789.12345679` |

## 7. Invariantes de produto

- **Não** usar em cache invisível de tela (não é hash criptográfico; é determinismo de bytes).
- Para **content hash** de sync, usar `canonicalize` + SHA-256 (Fase Sync) — canonicalização
  serve de base; hash em cima.
- **Campos novos opcionais** devem ser tipados `undefined | T` no TS e `Option<T>` no Rust,
  de modo que objetos idênticos em dados → bytes idênticos mesmo com campos a menos.