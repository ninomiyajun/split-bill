import { describe, expect, test } from "vitest";

import {
  PEOPLE_ERROR_MESSAGE,
  TOTAL_ERROR_MESSAGE,
  evaluateSplit,
  formatSplit,
  formatInteger,
} from "./split-display";

// 仕様 docs/product-specs/even-split.md の「利用者の操作の流れ」の文言と 1 字も違わないこと。
const SPEC_TOTAL_ERROR = "合計の金額は 0 以上 100,000,000 以下の整数（円）で入れてください";
const SPEC_PEOPLE_ERROR = "人数は 1 以上 100 以下の整数で入れてください";

function result(text: string) {
  return { totalError: null, peopleError: null, resultText: text };
}

const TOTAL_ERROR_ONLY = { totalError: SPEC_TOTAL_ERROR, peopleError: null, resultText: null };
const PEOPLE_ERROR_ONLY = { totalError: null, peopleError: SPEC_PEOPLE_ERROR, resultText: null };
const NOTHING = { totalError: null, peopleError: null, resultText: null };

describe("仕様の受け入れ基準（計算と入力の判定で決まるもの）", () => {
  test("SPLIT-1 割り切れる金額", () => {
    expect(evaluateSplit("3000", "3")).toEqual(result("1 人あたり 1,000 円。端数なし"));
  });

  test("SPLIT-2 割り切れない金額", () => {
    expect(evaluateSplit("1000", "3")).toEqual(result("1 人あたり 333 円。幹事は 334 円"));
  });

  test("SPLIT-3 人数が 1 人", () => {
    expect(evaluateSplit("1000", "1")).toEqual(result("1 人あたり 1,000 円。端数なし"));
  });

  test("SPLIT-5 人数が負の数", () => {
    expect(evaluateSplit("1000", "-2")).toEqual(PEOPLE_ERROR_ONLY);
  });

  test("SPLIT-7 合計の金額が数でない", () => {
    expect(evaluateSplit("abc", "3")).toEqual(TOTAL_ERROR_ONLY);
  });

  test("SPLIT-8 人数が数でない", () => {
    expect(evaluateSplit("1000", "abc")).toEqual(PEOPLE_ERROR_ONLY);
  });

  test("SPLIT-18 合計の金額が 0 円", () => {
    expect(evaluateSplit("0", "3")).toEqual(result("1 人あたり 0 円。端数なし"));
  });

  test("SPLIT-19 人数が合計の金額より多い", () => {
    expect(evaluateSplit("2", "3")).toEqual(result("1 人あたり 0 円。幹事は 2 円"));
  });

  test("SPLIT-20 合計の金額が上限ちょうど", () => {
    expect(evaluateSplit("100000000", "3")).toEqual(
      result("1 人あたり 33,333,333 円。幹事は 33,333,334 円"),
    );
  });

  test("SPLIT-21 合計の金額が上限を 1 超える", () => {
    expect(evaluateSplit("100000001", "3")).toEqual(TOTAL_ERROR_ONLY);
  });

  test("SPLIT-22 人数が上限ちょうど", () => {
    expect(evaluateSplit("1000", "100")).toEqual(result("1 人あたり 10 円。端数なし"));
  });

  test("SPLIT-23 人数が上限を 1 超える", () => {
    expect(evaluateSplit("1000", "101")).toEqual(PEOPLE_ERROR_ONLY);
  });

  test("SPLIT-24 小数の合計の金額", () => {
    expect(evaluateSplit("1000.5", "3")).toEqual(TOTAL_ERROR_ONLY);
  });

  test("SPLIT-25 小数の人数", () => {
    expect(evaluateSplit("1000", "2.5")).toEqual(PEOPLE_ERROR_ONLY);
  });

  test("SPLIT-26 全角の数字", () => {
    expect(evaluateSplit("１０００", "3")).toEqual(TOTAL_ERROR_ONLY);
  });

  test("SPLIT-27 桁区切りの入った値", () => {
    expect(evaluateSplit("1,000", "3")).toEqual(TOTAL_ERROR_ONLY);
  });

  test("SPLIT-28 円の付いた値", () => {
    expect(evaluateSplit("1000円", "3")).toEqual(TOTAL_ERROR_ONLY);
  });

  test("SPLIT-29 前後の空白", () => {
    expect(evaluateSplit(" 1000 ", " 3 ")).toEqual(result("1 人あたり 333 円。幹事は 334 円"));
  });
});

describe("画面の基準の論理の裏付け（画面での確かめは受け入れ確認で行う）", () => {
  test("SPLIT-4 人数が 0 のときは、人数の知らせだけで、結果は無い", () => {
    expect(evaluateSplit("1000", "0")).toEqual(PEOPLE_ERROR_ONLY);
  });

  test("SPLIT-6 合計の金額が負の数のときは、合計の金額の知らせだけで、結果は無い", () => {
    expect(evaluateSplit("-1000", "3")).toEqual(TOTAL_ERROR_ONLY);
  });

  test("SPLIT-15 合計の金額の欄が空のときは、結果も知らせも無い", () => {
    expect(evaluateSplit("", "3")).toEqual(NOTHING);
  });

  test("SPLIT-16 人数の欄が空のときは、結果も知らせも無い", () => {
    expect(evaluateSplit("1000", "")).toEqual(NOTHING);
  });

  test("SPLIT-30 両方が誤りのときは、2 つの知らせがあり、結果は無い", () => {
    expect(evaluateSplit("-1000", "0")).toEqual({
      totalError: SPEC_TOTAL_ERROR,
      peopleError: SPEC_PEOPLE_ERROR,
      resultText: null,
    });
  });

  test("両方の欄が空のときは、結果も知らせも無い（開いた直後の状態）", () => {
    expect(evaluateSplit("", "")).toEqual(NOTHING);
  });
});

describe("文言と書式", () => {
  test("合計の金額の知らせが仕様の文言と一致する", () => {
    expect(TOTAL_ERROR_MESSAGE).toBe(SPEC_TOTAL_ERROR);
  });

  test("人数の知らせが仕様の文言と一致する", () => {
    expect(PEOPLE_ERROR_MESSAGE).toBe(SPEC_PEOPLE_ERROR);
  });

  test("formatInteger は桁区切りを入れる", () => {
    expect(formatInteger(0)).toBe("0");
    expect(formatInteger(999)).toBe("999");
    expect(formatInteger(1000)).toBe("1,000");
    expect(formatInteger(100000000)).toBe("100,000,000");
  });

  test("formatSplit は端数の有無で文を変える", () => {
    expect(formatSplit({ perPerson: 1000, organizer: 1000, remainder: 0 })).toBe(
      "1 人あたり 1,000 円。端数なし",
    );
    expect(formatSplit({ perPerson: 333, organizer: 334, remainder: 1 })).toBe(
      "1 人あたり 333 円。幹事は 334 円",
    );
  });
});
