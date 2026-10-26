# 試験の道具に vitest を使い、ひな形を対象から外す

## 背景

計算の層（`src/lib/`）の単体試験を流す道具が無かった。モジュールのひな形の試験 `templates/module/example.test.ts` は `node:test` で
書いてあり、試験の道具を入れると既定の対象（`**/*.test.ts`）に入って、失敗するか正しく動かないおそれがあった（技術的負債 TD-2）。

## 判断

- 試験の道具に vitest（5 系）を使う。設定は根の `vitest.config.mts`、流すコマンドは `npm run test`（`vitest run`）。
- 設定の `test.include` を `["src/**/*.test.ts"]` にする。`include` を指定すると既定の対象が置き換わるので、`templates/` のひな形は
  対象に入らない。`test.environment` は `"node"` にする。
- ひな形は写しの元なので、`node:test` の形のまま置く。

## 検討した代わりの案

- `node:test` だけで行う（ひな形と同じ道具）: 依存を増やさない利点がある。型を外して流す Node.js の機能は JSX を扱えないと見込まれ
  （確かめていない）、次の機能で画面の部品の試験を足すときに道具を替え、試験の書き方と `npm run test` の中身を書き直す費用が出るので
  採らなかった。
- 計算の層は `node:test`、画面の部品は後で vitest とする併用: 試験の道具が 2 つになり、層ごとに試験の書き方の決まりを持つ手間が
  増えるので採らなかった。
- Jest: TypeScript と ESM のための変換の設定が要り、vitest より設定が多いので採らなかった。
- ひな形を vitest の書き方に直す: ひな形は写しの元なので、中身は変えないことにした。

## 結果

- `src/` の下の `*.test.ts` だけが試験の対象になる。画面の部品の試験（`.tsx`）を足すときは、`include` と `environment` を見直す。
- vitest 5 は Node.js 22.12 以上か 24 以上を求める。
