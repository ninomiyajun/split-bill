"use client";

import { useState } from "react";

import { evaluateSplit } from "@/lib/split-display";

// 入力の文字列だけを状態に持ち、evaluateSplit の戻り値を分岐を持たずにそのまま出す。
// 値の判定と文言の組み立ては計算の層（src/lib/）が受け持つ。入れた値は保存も送信もしない。
export default function EvenSplitForm() {
  const [totalInput, setTotalInput] = useState("");
  const [peopleInput, setPeopleInput] = useState("");
  const view = evaluateSplit(totalInput, peopleInput);

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="total" className="text-sm font-medium">
          合計の金額（円）
        </label>
        <input
          id="total"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={totalInput}
          onChange={(event) => setTotalInput(event.target.value)}
          aria-describedby="total-error"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-lg text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-600"
        />
        <p id="total-error" className="min-h-5 text-sm text-red-600 dark:text-red-400">
          {view.totalError ?? ""}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="people" className="text-sm font-medium">
          人数
        </label>
        <input
          id="people"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={peopleInput}
          onChange={(event) => setPeopleInput(event.target.value)}
          aria-describedby="people-error"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-lg text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-600"
        />
        <p id="people-error" className="min-h-5 text-sm text-red-600 dark:text-red-400">
          {view.peopleError ?? ""}
        </p>
      </div>

      <p aria-live="polite" className="min-h-8 text-xl font-semibold">
        {view.resultText ?? ""}
      </p>
    </div>
  );
}
