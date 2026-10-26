# 型の検査でモジュールのひな形も調べるため、拡張子つきの import を許す

## 背景

モジュールのひな形の試験 `templates/module/example.test.ts` は、`./example.ts` を拡張子つきで import する（型を外して直接実行できる Node.js の `node:test` で流すための形）。create-next-app が作った `tsconfig.json` のままでは、`npm run typecheck`（`next typegen && tsc --noEmit`）が TS5097（拡張子つきの import は `allowImportingTsExtensions` が要る）で失敗し、`npm run check` が通らなかった。

## 判断

`tsconfig.json` の `compilerOptions` に `"allowImportingTsExtensions": true` を足し、ひな形も型の検査の対象に残す。

## 検討した代わりの案

- `tsconfig.json` の `exclude` に `templates/` を足す: 設定はひな形だけに閉じるが、ひな形が型の検査を通らなくなっても気づかない。ひな形は `src/` の下へ写して使うので、写す前から型が合っていることを確かめられる案を採った。

## 結果

- アプリのコードでも `.ts` の拡張子つきの import が書けるようになる。
- この設定は、出力しない設定（`noEmit: true`）がある間だけ使える。後で `tsc` に出力させる設定（`noEmit` を外す、`declaration` を出す）を足すと TS5096 になるので、そのときはこの判断を見直す。
