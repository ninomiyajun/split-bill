// 割り勘の表示の文言と書式。画面の層は evaluateSplit の戻り値を、分岐を持たずにそのまま出す。

import {
  PEOPLE_MAX,
  PEOPLE_MIN,
  TOTAL_MAX,
  TOTAL_MIN,
  parsePeople,
  parseTotal,
  splitEvenly,
  type SplitResult,
} from "./split-calc";

export type SplitView = {
  totalError: string | null;
  peopleError: string | null;
  resultText: string | null;
};

const integerFormat = new Intl.NumberFormat("ja-JP");

// 整数に桁区切りを入れる（通貨記号も「円」も付けない。「円」は呼び出す側の文に書く）。
export function formatInteger(value: number): string {
  return integerFormat.format(value);
}

export const TOTAL_ERROR_MESSAGE = `合計の金額は ${formatInteger(TOTAL_MIN)} 以上 ${formatInteger(TOTAL_MAX)} 以下の整数（円）で入れてください`;
export const PEOPLE_ERROR_MESSAGE = `人数は ${formatInteger(PEOPLE_MIN)} 以上 ${formatInteger(PEOPLE_MAX)} 以下の整数で入れてください`;

export function formatSplit(result: SplitResult): string {
  const perPerson = `1 人あたり ${formatInteger(result.perPerson)} 円。`;
  if (result.remainder === 0) {
    return `${perPerson}端数なし`;
  }
  return `${perPerson}幹事は ${formatInteger(result.organizer)} 円`;
}

// 知らせは、その欄が誤りのときだけ入れる（空の欄には入れない）。結果の文は、両方が正しい値のときだけ入れる。
export function evaluateSplit(totalInput: string, peopleInput: string): SplitView {
  const total = parseTotal(totalInput);
  const people = parsePeople(peopleInput);
  return {
    totalError: total.kind === "invalid" ? TOTAL_ERROR_MESSAGE : null,
    peopleError: people.kind === "invalid" ? PEOPLE_ERROR_MESSAGE : null,
    resultText:
      total.kind === "valid" && people.kind === "valid"
        ? formatSplit(splitEvenly(total.value, people.value))
        : null,
  };
}
