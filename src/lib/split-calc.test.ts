import { describe, expect, test } from "vitest";

import {
  PEOPLE_MAX,
  PEOPLE_MIN,
  TOTAL_MAX,
  TOTAL_MIN,
  parsePeople,
  parseTotal,
  splitEvenly,
} from "./split-calc";

const EMPTY = { kind: "empty" };
const INVALID = { kind: "invalid" };
const valid = (value: number) => ({ kind: "valid", value });

describe("入力の解釈", () => {
  test("空の文字列と空白だけの入力は empty", () => {
    expect(parseTotal("")).toEqual(EMPTY);
    expect(parseTotal("   ")).toEqual(EMPTY);
    expect(parsePeople("")).toEqual(EMPTY);
    expect(parsePeople(" \t ")).toEqual(EMPTY);
  });

  test("先頭に 0 のある 007 は 7 として受け付ける", () => {
    expect(parseTotal("007")).toEqual(valid(7));
    expect(parsePeople("007")).toEqual(valid(7));
  });

  test("符号・指数・16 進の形は invalid", () => {
    for (const input of ["+3", "-0", "1e3", "0x10"]) {
      expect(parseTotal(input)).toEqual(INVALID);
      expect(parsePeople(input)).toEqual(INVALID);
    }
  });

  test("全角の空白で囲んだ値は、前後の空白として除く", () => {
    expect(parseTotal("　1000　")).toEqual(valid(1000));
    expect(parsePeople("　3　")).toEqual(valid(3));
  });

  test("21 桁以上の数字の並びは invalid", () => {
    expect(parseTotal("1".repeat(21))).toEqual(INVALID);
    expect(parsePeople("9".repeat(25))).toEqual(INVALID);
  });

  test("合計の金額の境目", () => {
    expect(TOTAL_MIN).toBe(0);
    expect(TOTAL_MAX).toBe(100000000);
    expect(parseTotal(String(TOTAL_MIN))).toEqual(valid(TOTAL_MIN));
    expect(parseTotal(String(TOTAL_MAX))).toEqual(valid(TOTAL_MAX));
    expect(parseTotal(String(TOTAL_MAX + 1))).toEqual(INVALID);
  });

  test("人数の境目", () => {
    expect(PEOPLE_MIN).toBe(1);
    expect(PEOPLE_MAX).toBe(100);
    expect(parsePeople(String(PEOPLE_MIN - 1))).toEqual(INVALID);
    expect(parsePeople(String(PEOPLE_MIN))).toEqual(valid(PEOPLE_MIN));
    expect(parsePeople(String(PEOPLE_MAX))).toEqual(valid(PEOPLE_MAX));
    expect(parsePeople(String(PEOPLE_MAX + 1))).toEqual(INVALID);
  });
});

describe("splitEvenly", () => {
  test("端数が 0 のとき", () => {
    expect(splitEvenly(3000, 3)).toEqual({ perPerson: 1000, organizer: 1000, remainder: 0 });
  });

  test("端数があるとき、幹事は端数を含めて払う", () => {
    expect(splitEvenly(1000, 3)).toEqual({ perPerson: 333, organizer: 334, remainder: 1 });
    expect(splitEvenly(2, 3)).toEqual({ perPerson: 0, organizer: 2, remainder: 2 });
    expect(splitEvenly(100000000, 3)).toEqual({
      perPerson: 33333333,
      organizer: 33333334,
      remainder: 1,
    });
  });
});
