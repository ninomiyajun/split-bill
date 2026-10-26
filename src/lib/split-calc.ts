// 割り勘の入力の判定と計算。文言を持たず、構造化した値だけを返す。
// 入力の上限と下限は、ここの定数の 1 か所にだけ持つ（知らせの文言も、この定数から組み立てる）。

export const TOTAL_MIN = 0;
export const TOTAL_MAX = 100000000;
export const PEOPLE_MIN = 1;
export const PEOPLE_MAX = 100;

export type ParsedInput =
  | { kind: "empty" }
  | { kind: "invalid" }
  | { kind: "valid"; value: number };

export type SplitResult = {
  perPerson: number;
  organizer: number;
  remainder: number;
};

const DIGITS_ONLY = /^[0-9]+$/;

// 前後の空白を除いた値が、半角の数字だけでできた整数で、範囲の中にあれば valid にする。
function parseInteger(input: string, min: number, max: number): ParsedInput {
  const trimmed = input.trim();
  if (trimmed === "") {
    return { kind: "empty" };
  }
  if (!DIGITS_ONLY.test(trimmed)) {
    return { kind: "invalid" };
  }
  const value = Number(trimmed);
  if (value < min || value > max) {
    return { kind: "invalid" };
  }
  return { kind: "valid", value };
}

export function parseTotal(input: string): ParsedInput {
  return parseInteger(input, TOTAL_MIN, TOTAL_MAX);
}

export function parsePeople(input: string): ParsedInput {
  return parseInteger(input, PEOPLE_MIN, PEOPLE_MAX);
}

// 1 人あたりの額は 1 円未満を切り捨て、残り（端数）は幹事が払う。
export function splitEvenly(total: number, people: number): SplitResult {
  const perPerson = Math.floor(total / people);
  const remainder = total - perPerson * people;
  return { perPerson, organizer: perPerson + remainder, remainder };
}
