//! **Canonical JSON v1** — serialização determinística, paridade byte a byte
//! com `packages/contracts/src/canonical-json.ts` (TS). Spec:
//! `cecistudy-rust/docs/canonical-json-v1.md`.
//!
//! Regras:
//! - chaves de objeto em **ordem alfabética** (byte-a-byte UTF-8);
//! - arrays mantêm a ordem original (nunca ordenar);
//! - strings normalizadas **NFC**;
//! - números seguem **ECMAScript `Number::toString`** (integrais sem `.0`,
//!   decimais sem notação científica exceto fora de `[1e-6, 1e21)`, `NaN`/`∞` não
//!   existem nos dados de domínio).

use serde_json::Value;
use unicode_normalization::UnicodeNormalization;

/// Serializa `value` canonicamente (JSON compacto determinístico).
pub fn canonicalize(value: &Value) -> String {
  let mut out = String::with_capacity(256);
  write_value(value, &mut out);
  out
}

fn write_value(v: &Value, out: &mut String) {
  match v {
    Value::Null => out.push_str("null"),
    Value::Bool(b) => out.push_str(if *b { "true" } else { "false" }),
    Value::Number(n) => out.push_str(&write_number(n)),
    Value::String(s) => write_string_escaped(&s.nfc().collect::<String>(), out),
    Value::Array(items) => {
      out.push('[');
      for (i, item) in items.iter().enumerate() {
        if i > 0 {
          out.push(',');
        }
        write_value(item, out);
      }
      out.push(']');
    }
    Value::Object(map) => {
      // serde_json::Map (sem feature preserve_order) = BTreeMap → chaves ordenadas.
      out.push('{');
      for (i, (key, val)) in map.iter().enumerate() {
        if i > 0 {
          out.push(',');
        }
        write_string_escaped(key, out);
        out.push(':');
        write_value(val, out);
      }
      out.push('}');
    }
  }
}

/// Números: replicam ECMAScript `Number::toString` (ver módulo).
fn write_number(n: &serde_json::Number) -> String {
  // Diferença de serde_json: para inteiros usamos o literal i64/u64 exato;
  // para `>= 2^53` (fora do espaço f64 exato) cai no f64 (como o JS faria).
  if let Some(i) = n.as_i64() {
    if is_exact_f64(i as f64) {
      return format!("{i}");
    }
    return ecma_number(i as f64);
  }
  if let Some(u) = n.as_u64() {
    if is_exact_f64(u as f64) {
      return format!("{u}");
    }
    return ecma_number(u as f64);
  }
  match n.as_f64() {
    Some(x) => ecma_number(x),
    None => "null".to_owned(),
  }
}

fn is_exact_f64(x: f64) -> bool {
  // Inteiros possuem representação exata até 2^53 ± 1.
  const LIMIT: f64 = 9_007_199_254_740_992.0; // 2^53
  x.abs() < LIMIT
}

/// ECMAScript `Number::toString(x)` — mesmo literal de `String(x)`/`JSON.stringify`.
///
/// Usa os dígitos mais curtos com round-trip fiel (ryu) e escolhe a notação
/// pelas regras do ECMA-262 §6.1.6.1.20 (`k ≤ n ≤ 21` inteiro; `-6 < n ≤ 21`
/// decimal; demais exponencial).
fn ecma_number(x: f64) -> String {
  if x == 0.0 {
    return "0".to_owned(); // String(-0) === "0"
  }
  // Invariante de domínio: NaN/Infinity não ocorrem nos dados persistidos.
  debug_assert!(!(x.is_nan() || x.is_infinite()), "número não finito em canonicalize");

  let neg = x.is_sign_negative();
  let abs = x.abs();

  // Dígitos mais curtos (ryu) — pode vir decimal ou científico.
  let mut buf = ryu::Buffer::new();
  let raw = buf.format_finite(abs);
  let (digits, n) = parse_shortest_digits(raw);

  let rendered = render_ecma(&digits, n);
  if neg { format!("-{rendered}") } else { rendered }
}

/// Extrai (dígitos mais curtos, expoente `n`) tais que `valor = 0.digits × 10^n`,
/// com `valor = mx * 10^{\exp}` (ver docstring de [`render_ecma`]).
fn parse_shortest_digits(repr: &str) -> (String, i32) {
  // Separa mantissa e expoente ("1.23e-6" → mantissa "1.23",  -6).
  let (mantissa, exp) = split_exponent(repr);
  // Separa parte inteira e fracionária.
  let (int_part, frac_part) = match mantissa.split_once('.') {
    Some((i, f)) => (i, f),
    None => (mantissa, ""),
  };
  // Dígitos crus (inteira + fracionária), ainda com zeros à frente/cauda.
  let mut raw_digits = int_part.to_owned();
  raw_digits.push_str(frac_part);
  // Posição efetiva da vírgula (após aplicar o expoente).
  let p = int_part.len() as i32;
  let eff = p + exp;
  // Remove zeros à frente (ajusta n) e zeros à cauda (n não muda — provado no
  // doc do módulo): 0.D0 × 10^n == 0.D × 10^n quando D0 = D com zeros à cauda.
  let leading = raw_digits.len() as i32 - raw_digits.trim_start_matches('0').len() as i32;
  let digits = raw_digits.trim_start_matches('0');
  if digits.is_empty() {
    // Não ocorre (zero tratado antes); mantém invariante seguro.
    return ("0".to_owned(), eff - leading);
  }
  let n = eff - leading;
  let trimmed_tail = digits.trim_end_matches('0');
  if trimmed_tail.is_empty() {
    // Caso "1.00"→ reduzimos a "1". (não muda)
    let d = digits.as_bytes()[0];
    return (String::from_utf8(vec![d]).expect("dígito ASCII"), n);
  }
  (trimmed_tail.to_owned(), n)
}

fn split_exponent(repr: &str) -> (&str, i32) {
  let bytes = repr.as_bytes();
  for (idx, &b) in bytes.iter().enumerate() {
    if b == b'e' || b == b'E' {
      let exp: i32 = repr[idx + 1..].parse().expect("expoente válido do ryu");
      return (&repr[..idx], exp);
    }
  }
  (repr, 0)
}

/// Aplica as regras de notação do ECMA-262 (com `n` = posição decimal e
/// `k` = quantidade de dígitos significativos).
fn render_ecma(digits: &str, n: i32) -> String {
  let k = digits.len() as i32;
  if k <= n && n <= 21 {
    // Inteiro: dígitos + zeros à cauda.
    let zeros = (n - k) as usize;
    let mut out = String::with_capacity(digits.len() + zeros);
    out.push_str(digits);
    for _ in 0..zeros {
      out.push('0');
    }
    out
  } else if 0 < n && n <= 21 {
    // Decimal: "int.frac".
    let split = n as usize;
    format!("{}.{}", &digits[..split], &digits[split..])
  } else if -6 < n && n <= 0 {
    // Decimal pequeno: "0.000…digits".
    let zeros = (-n) as usize;
    format!("0.{}{}", "0".repeat(zeros), digits)
  } else {
    // Exponencial: "d.ddd e{sgn}{n-1}".
    let exp = n - 1;
    let sign = if exp >= 0 { "+" } else { "" };
    if k == 1 {
      format!("{digits}e{sign}{exp}")
    } else {
      format!("{}.{}e{sign}{exp}", &digits[..1], &digits[1..])
    }
  }
}

/// Escapa uma string como `JSON.stringify` (sem normalização; chamador normaliza).
fn write_string_escaped(s: &str, out: &mut String) {
  out.push('"');
  for c in s.chars() {
    match c {
      '"' => out.push_str("\\\""),
      '\\' => out.push_str("\\\\"),
      '\n' => out.push_str("\\n"),
      '\r' => out.push_str("\\r"),
      '\t' => out.push_str("\\t"),
      c if (c as u32) < 0x20 => {
        out.push_str(&format!("\\u{:04x}", c as u32));
      }
      c => out.push(c),
    }
  }
  out.push('"');
}

#[cfg(test)]
mod tests {
  use super::*;
  use serde_json::json;

  /// MESMOS test vectors de `src/lib/__tests__/canonicalJson.test.ts` (seção 6
  /// da spec). Paridade TS ↔ Rust é exigida aqui.
  fn vectors() -> Vec<(Value, &'static str)> {
    vec![
      (Value::Null, "null"),
      (json!(true), "true"),
      (json!(42), "42"),
      (json!(1.5), "1.5"),
      (json!("olá"), "\"olá\""),
      (json!([]), "[]"),
      (json!({}), "{}"),
      (json!({ "b": 1, "a": 2 }), "{\"a\":2,\"b\":1}"),
      (json!({ "nested": {"z": null, "y": true } }), "{\"nested\":{\"y\":true,\"z\":null}}"),
      (json!({ "list": [3, 1, 2] }), "{\"list\":[3,1,2]}"),
      (json!("cafe\u{0301}"), "\"café\""),
      (
        // a: undefined não existe no JSON — equivalente a omitir; b:null preservado
        json!({ "b": null, "c": 0 }),
        "{\"b\":null,\"c\":0}",
      ),
      (json!([null, 1]), "[null,1]"),
      (json!({ "date": "2026-09-10T15:30:00.000Z" }), "{\"date\":\"2026-09-10T15:30:00.000Z\"}"),
      (json!({ "arr": [{ "b": 2, "a": 1 }] }), "{\"arr\":[{\"a\":1,\"b\":2}]}"),
      (json!(1e21), "1e+21"),
      (json!(0.00000123456789), "0.00000123456789"),
      (json!(1e-7), "1e-7"),
      (json!(123_456_789.123_456_79), "123456789.12345679"),
    ]
  }

  #[test]
  fn vetores_paridade_ts() {
    for (input, expected) in vectors() {
      assert_eq!(canonicalize(&input), expected, "input: {input}");
    }
  }

  #[test]
  fn ecma_number_edge_cases() {
    assert_eq!(ecma_number(-0.0), "0");
    assert_eq!(ecma_number(0.5), "0.5");
    assert_eq!(ecma_number(123000.0), "123000");
    assert_eq!(ecma_number(-1.5), "-1.5");
    assert_eq!(ecma_number(f64::from_bits(1)), "5e-324");
    assert_eq!(ecma_number(1e22), "1e+22");
    assert_eq!(ecma_number(123.456e10), "1234560000000");
  }

  #[test]
  fn chaves_ordenadas_recursivo() {
    let v = json!({ "c": { "f": 1, "e": 2 }, "a": { "d": [3, 1], "b": 2 } });
    assert_eq!(canonicalize(&v), "{\"a\":{\"b\":2,\"d\":[3,1]},\"c\":{\"e\":2,\"f\":1}}");
  }

  #[test]
  fn nfc_profundo() {
    let v = json!({ "nota": "caf\u{e9}", "arr": ["telefone\u{301}"] });
    assert_eq!(canonicalize(&v), "{\"arr\":[\"telefoné\"],\"nota\":\"café\"}");
  }

  #[test]
  fn arrays_preservam_ordem() {
    let v = json!({ "topics": ["ansiedade", "medo", "ansiedade"] });
    assert_eq!(canonicalize(&v), "{\"topics\":[\"ansiedade\",\"medo\",\"ansiedade\"]}");
  }

  #[test]
  fn escapa_controles_como_json_stringify() {
    assert_eq!(canonicalize(&json!("\"\\\n\t\x01")), "\"\\\"\\\\\\n\\t\\u0001\"");
  }
}
