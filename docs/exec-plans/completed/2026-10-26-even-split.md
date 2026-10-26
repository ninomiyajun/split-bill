# 割り勘の計算を実装する（計算の層、依存の向きの検査、試験の道具、Node.js の版）

## 作業の場所

- ブランチ: `feat/split-calculator`（分岐元は `origin/main` の `b4077b2`）
- worktree のディレクトリ名: `wt-split-bill-feat`
- 承認済みの仕様 `docs/product-specs/even-split.md`（未追跡）と、その目録の行を足した `docs/product-specs/README.md`（変更）は、
  この worktree の中にしか無く、まだコミットしていない。計画の起票の時点で、この 2 つのほかに worktree の変更は無かった。
  この 2 つは、この計画の実装と同じコミットに含める（手順 17）。

## 目的

最初の機能「割り勘の計算」を作る。合計の金額と人数を入れると、1 人あたりの額と、端数を含めて幹事が払う額がブラウザの画面に
出て、誤った入力は欄の下の知らせで伝える。あわせて、この機能を支える土台（計算の層と画面の層の分け方、その依存の向きを
機械で確かめる検査、試験の道具、Node.js の版の基準）を入れる。最初の機能で層と検査を決めておくと、後の機能が同じ形に
沿って足せて、逆向きの依存が入っても検査が止めるためである。

### 引く仕様と、関係する設計の箇所

- 引く仕様: `docs/product-specs/even-split.md`（目録 `docs/product-specs/README.md` の状態は `approved`。略号 `SPLIT`）。
  受け入れ基準 SPLIT-1〜SPLIT-30 を、すべて実装する（実装しない基準は無い）。
- `ARCHITECTURE.md`: 「層と責務」（8 行目）、「依存の向き」（12 行目）、「不変条件」（16 行目）、「中核的な原則」（20 行目）の
  4 か所が、どれも `[NEEDS CLARIFICATION: …]` のままである（起票の時点で行を読んで確かめた）。この計画で 4 か所を埋める（手順 8）。
- ADR: `docs/adr/0001-allow-importing-ts-extensions.md`（型の検査でモジュールのひな形 `templates/module/` も調べるため、
  拡張子つきの import を許す）が関係する。ひな形を型の検査の対象に残す判断なので、この計画でも `tsconfig.json` の
  `include` と `allowImportingTsExtensions` は変えない。ほかの ADR は無い。この計画で 0002〜0004 を足す（手順 8）。
- 技術的負債: `docs/exec-plans/tech-debt-tracker.md` の TD-1（PR の CI の合否に lint・型・試験が入らない）と TD-2
  （ひな形の試験が `node:test` で書いてあり、試験の道具の既定の対象に入る）に、この計画で対処する。TD-2 は手順 3 で解消する。
  TD-1 は、利用者の判断 1 の答え（案 A）により、残りを TD-4 に移して閉じる（手順 12）。

### 変えるもの、変えないもの

- 変えるもの: `src/lib/`（新しく作る計算の層）、`src/app/`（画面の層）、`package.json` と `package-lock.json`、
  `.nvmrc`（新規）、`vitest.config.mts`（新規）、`.dependency-cruiser.cjs`（新規）、`ARCHITECTURE.md`、`AGENTS.md`（文書の地図と
  検査のコマンドの表）、`docs/harness-log.md`、`docs/exec-plans/tech-debt-tracker.md`、`docs/QUALITY_SCORE.md`、
  `.claude/skills/run-split-bill/SKILL.md`、`docs/adr/`（0002〜0004 と目録の行）、`.github/workflows/app-checks.yml`（新規。判断 1 の
  答えが案 A のため）、`docs/PRODUCT_SENSE.md`（判断 2 で利用者が決めた文面で埋める）。
- 変えないもの: `scripts/harness/` の下の、冒頭に `harness-copy` の行があるファイル（検査の本体の写し。`check-docs.sh`、
  `notify.sh`、`drift-scan.sh`、`stack-adapter.sh`、`check-secrets.sh`、`check-secrets.mjs`、各 `.test.sh`、`checks.d/README.md`）。
  `docs/PLANS.md` の `plan-status-spec` と `plan-cost-spec` の区画の印の間（ひな形の写し）。既存のワークフロー
  `.github/workflows/harness-docs.yml`・`harness-secrets.yml`・`drift-scan.yml`（どれも冒頭に `harness-copy` の行は無いが、
  ひな形から敷いたもので、この計画の目的に変える必要が無い。`drift-scan.yml` は `package.json` を変える PR で走り、検査の一式の
  段を読み直すだけなので、段を足しても直す所が無い）。`templates/module/` の 3 つのファイル（ひな形。手順 3 で試験の道具の
  対象から外すだけで、中身は変えない）。

### 利用者の判断（2026-10-26 に利用者が答えた）

利用者は、2026-10-26 に次の 3 つの判断に答え、計画をこのまま進めることを確かめた。各判断の背景と案は、答えの下に残す。

- 判断 1（CI を足すか）: 答えは案 A（足す）。`.github/workflows/app-checks.yml` を足し、PR で lint・型・依存の向き・試験を
  流す。TD-1 は、残り（段の読み取りの試験を PR の CI が流さないこと）を TD-4 に移して閉じる（手順 12）。
  - 背景: いまの PR の CI で、失敗すると PR が失敗になるのは、文書の検査・秘匿値の検査・検査の試験の 3 本だけである（TD-1）。
    手元で `npm run check` を流し忘れた変更も、PR の CI を通ってしまう。
  - 案 A（足す。推奨）: 利点は、lint・型・依存の向き・試験の失敗が PR の画面で分かり、手元の流し忘れを CI が拾うこと。
    TD-1 のうち lint・型・試験の部分を解消できる。欠点は、PR ごとに CI の実行が 1 本増えること（依存の入れ直しを含め、数分の見込み。
    測っていない）と、ワークフローのファイルが 1 つ増えて保守の対象になること。
  - 案 B（足さない）: 利点は、CI の構成と実行の時間が今のままで済むこと。欠点は、lint・型・依存の向き・試験が PR の合否に入らず、
    手元の `npm run check` だけに頼ること。TD-1 は残る。定期の走査（`drift-scan.yml`）は `package.json` などを変える PR で検査の
    一式を流すが、失敗を報告に残すだけで PR を失敗にしない。
  - 推奨の理由: この計画で依存の向きの検査と試験を足しても、PR の合否に入らなければ、逆向きの依存や計算の誤りが、手元で流し
    忘れた変更から入りうる。検査を足す目的（機械で止める）を PR の段で果たすには、CI に載せるのが要る。
  - あわせて決めること: 足したジョブを、GitHub のブランチの保護でマージの必須条件にするか。必須にする設定は、リポジトリの
    設定の画面で利用者が行う操作で、この計画の手順には入れない（既存の 3 本が必須になっているかも、起票の時点では確かめていない）。
- 判断 2（製品の前提の文書の中身）: 答えは、仕様の担当の案のとおりに書く。`docs/PRODUCT_SENSE.md` の「目的」「対象の利用者」
  「作らないもの」を、次の案の文面で埋める（「作らないもの」には理由を短く添えてよい）。利用者が文面を決めたので、この計画の
  中で書き換える（手順 11 の後に行う。この計画の完了の条件には入れない。どの基準も、この文書の中身に依らない）。
  - 仕様の担当の案: 目的は「割り勘のときに、1 人あたりの額と端数を誰が払うかを、迷わずにすぐ出すこと。」。対象の利用者は
    「会計の場にいる幹事などが、手元のスマートフォンやパソコンのブラウザで、その場で使う。」。作らないものは「外部の API・API キー・
    有料のサービス、入れた値の保存と履歴、ログイン、参加者の名前の入力、傾斜の割り勘（人ごとに額を変える割り方）、円以外の通貨、
    税やサービス料の計算」。
- 判断 3（検査の由来の記録に載せるか）: 答えは案 A（載せる）。依存の向きの検査（手順 6）と、判断 1 で足す CI（手順 12）を、
  「設計で足した検査で、出どころの数の目安に満たないが利用者が選んだ」と書いて、検査の由来の記録 `docs/harness-log.md` に載せる（手順 13）。
  - 背景: 文書の検査の検査 12 は、地図の 1 列目が「検査」か「検査（」で始まる行のパスを変えた変更に、記録の表の行を求める
    （`scripts/harness/check-docs.sh` の 88〜96 行目の注釈）。記録の「使い方」は、指摘を検査にした変更で行を足し、出どころを
    2 件以上書き、目安に満たない候補は「利用者が承知で選んだこと」を書くと定める（`docs/harness-log.md` の 8〜13 行目）。この
    2 つの検査は指摘から作るものではなく、この計画の設計で足すもので、出どころはこの計画の 1 件（CI はこれに TD-1 を加えた 2 件）
    である。
  - 推奨: 載せる。行には「設計で足した検査（指摘から作ったものではない）。目安の出どころの数に満たないが利用者が選んだ」と書く。
    載せないと検査 12 が失敗し、`npm run check:docs` が通らないため。利用者が計画を確かめたことは、この個別の判断を利用者が
    決めたことにはならないので、別に答えを得る。
  - 答えが「載せない」のときは、検査 12 を通す形が無くなる（`.dependency-cruiser.cjs` を地図の検査の行に載せない、などの形に
    なる）ので、手順 5・6・12・13 を組み直して計画を改訂し、設計レビューからやり直す。
  - この判断が止めるのは、記録の行を書く手順 13 と、すべての検査を流す手順 14（と、その後の手順）だけである。手順 1〜11 は、
    答えを待たずに進める。

### 受け取った前提の棚卸し

選択肢の範囲を限っているか、変えると採る案が変わる前提だけを載せる。

(a) 変えうる判断として扱わず、守る前提:

- コミット・push・PR は、利用者の名指しの指示の後に、まとめ役が行う（利用者単位の規約の「安全性とコマンド制限」）。
- `scripts/harness/` の下の写しと、`docs/PLANS.md` の区画の印の間は手で変えない（`AGENTS.md` の 17 行目、`docs/PLANS.md` の
  区画の `harness-copy` の行）。
- 外部の API・API キー・有料のサービスを使わず、入れた値を保存しない（利用者が承認した仕様 `docs/product-specs/even-split.md` の
  「目的」）。
- 受け入れ確認の記録は、受け入れ確認の担当（app-evaluator）だけが書く（`docs/PLANS.md` の「受け入れ確認の記録」）。

(b) 上位の設計・依頼にある設計判断、(c) 既存のコードの作り:

| 前提 | 種類 | 出どころ | 理由の有無 | 変えた場合の得失 |
|---|---|---|---|---|
| 計算の関数を画面から分けた層に置き、画面から計算への向きの依存だけを許す | (b) | まとめ役の依頼文（計画に書くことの 1） | 理由の記載なし（推測: 計算を画面なしで単体試験できるようにするため） | 分けないと、ファイルは減るが、計算を試すのに画面の部品を描く試験が要り、層の規則も機械で確かめられない |
| 依存の検査の設定を、地図の 1 列目が「検査（」で始まる行に載せ、`scripts/harness/checks.d/` には置かない | (b) | まとめ役の依頼文（計画に書くことの 2） | 理由あり: 「文書の検査と早期通知が『検査を定めるファイル』と見なすのは、地図の 1 列目が『検査』か『検査（』で始まる行の 2 列目のパスだけだから」（依頼文。`check-docs.sh` の 88〜89 行目と `notify.sh` の流れの 3 で照合した） | checks.d に置くと、本体が `*.sh` として実行しようとし、設定のファイルは置けない（`checks.d/README.md` の「決まり」） |
| `npm run check` は `npm run <名前>` を `&&` でつないだ形にする | (b) | `scripts/harness/stack-adapter.sh` の 11 行目 | 理由あり: 「check は『npm run <名前>』を && でつないだ形だけを受け取る」 | 形を崩すと、定期の走査が段を読めずに止まる |
| ひな形 `templates/module/` を型の検査の対象に残す | (b) | `docs/adr/0001-allow-importing-ts-extensions.md` の「検討した代わりの案」 | 理由あり: 「ひな形は `src/` の下へ写して使うので、写す前から型が合っていることを確かめられる案を採った」 | 外すと、試験の道具の設定と型の検査の設定がそろうが、ひな形の型の崩れに気づかなくなる |
| 試験の道具の対象から `templates/` を外す | (b) | `docs/exec-plans/tech-debt-tracker.md` の TD-2 | 理由あり: 「後で vitest などの試験の道具を入れると、既定の対象（`**/*.test.ts`）に入り、失敗するか正しく動かない」 | 外さずにひな形を試験の道具の書き方に直す案もあるが、ひな形は写しの元なので、`node:test` の形のまま置く |
| 画面の確かめは app-evaluator が `npm run dev` で起動したアプリをブラウザで操作して行う | (b) | まとめ役の依頼文（計画に書くことの 8）と `docs/PLANS.md` の 168〜169 行目 | 理由あり: 「動いているアプリを、実装した本人とは別の担当が操作して確かめる」（`docs/PLANS.md` の要旨） | 開発の形は手元の準備が少ない。開発用の表示や再接続が混ざる SPLIT-11 だけは、本番の形（`next build` と `next start`）で確かめる（判断の記録の 8） |
| CI の `setup-node` は `lts/*`、`@types/node` は `^20` | (c) | `.github/workflows/harness-secrets.yml` の 30 行目、`drift-scan.yml` の 44 行目、`package.json` の 25 行目 | 理由の記載なし（推測: ひな形と create-next-app の既定のまま） | 24 系を検証の基準にし、`@types/node` を `^24` にする。既存のワークフローの `lts/*` は変えない（判断の記録の 6） |
| 画面は create-next-app のままで、`layout.tsx` の言語は `en`、字体は `next/font/google` の Geist | (c) | `src/app/layout.tsx`、`src/app/page.tsx` | 理由の記載なし（推測: 生成したままの既定） | 画面を作り直す。言語は `ja` にする。字体は変えない（ブラウザは Google に通信しない。`node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md` の 96 行目） |

### 選択肢を絞る前の確かめ

- 層の分け方: 採る案は、画面の層 `src/app/` と計算の層 `src/lib/` の 2 つに分ける案。
  - 両方を行う案: 当たらない（両立しないとされる案の組が無い）。
  - 前提を変える案（分けない）: 計算を画面の部品の中に書く。外した理由は、計算の誤りを画面なしで確かめられず、仕様の 18 の
    基準を単体試験で覆えないという害があるため。
  - 既存の実装を変える案: いまの `src/` には `app/` しか無く、変える妨げの作りは無い。
  - 画面の部品を別の層（例: `src/components/`）に分けて 3 層にする案: 外した。部品は 1 つで、`src/app/_components/`
    （Next.js の非公開のフォルダー。`02-project-structure.md` の「Private folders」）に置けば、経路にならずに画面の層の中に置ける。
    層を増やしても、変えた場合の得を 1 文で示せない。
  - やらない案: 外した。仕様の機能を作ることが目的なので。
- 計算の層で、外の包みと Node.js の組み込みのモジュールまで禁じる（依頼文の「画面の層・Next.js・React を読み込まない」より強めた
  制約）: 理由は 3 つ。(1) 計算の層のコードは、画面の部品から読み込まれてブラウザに配られるので、Node.js の組み込みのモジュール
  （`fs` など）を読み込むと、ブラウザで動かないか、通信や保存の口が計算の層に入る。(2) 許す先を「計算の層の中」の 1 つに
  書けば、禁じる先を並べずに済み、並べ漏れが無い。(3) いまの計算には外の包みが要らない。後で外の包み（例: 10 進の計算の包み）が
  要るときは、ADR を書いて規則に許す先を足す。
- 依存の向きの検査の道具: 採る案は dependency-cruiser だけで行う案。
  - ESLint の `no-restricted-imports`（読み込む名前の正規表現で禁じる）で行う案: 依存を増やさずに済み、編集中にエディタで気づける
    利点がある。外した理由は、読み込む名前の文字列で判定するので、`../app/page` と `@/app/page` のように同じ先を指す書き方を
    すべて並べる必要があり、Node.js の組み込みのモジュールも名前を 1 つずつ並べることになって、並べ漏れを検査が拾わない害がある
    ため。
  - ESLint の `import/no-restricted-paths`（`eslint-config-next` が読み込む `eslint-plugin-import` の規則。入っていることを
    `node_modules` で確かめた）で行う案: 解決した先のパスで判定するので、画面の層への読み込みは書き方を問わず禁じられる。外した
    理由は、Node.js の組み込みのモジュールはファイルのパスに解決されないので、この規則では禁じられず、上の強めた制約を表せない
    ため。
  - ESLint と dependency-cruiser で役割を分ける案（包みの名前の禁止は ESLint、層の向きと循環は dependency-cruiser）: 編集中に
    気づける利点がある。外した理由は、検査を定めるファイルが 2 つになり、`eslint.config.mjs` を地図の検査の行に載せることになって、
    lint の設定のどの変更にも検査の由来の記録が要るようになる害があるため。dependency-cruiser だけで、すべての規則を表せる。
  - 文書の検査の追加の口（`checks.d/`）に自前の検査を書く案: 外した。import の解決（`@/` の別名、型だけの import）を自前で
    書くことになり、誤りやすい。
  - やらない案（文書の決まりだけにする）: 外した。依頼の目的（機械で確かめる）に反する害がある。
- 試験の道具: 採る案は vitest。
  - `node:test` だけで行う最小の案（ひな形と同じ道具）: 依存を増やさない利点がある。計算の層の中を相対パスで読み込む決まり
    （手順 8）にすれば、`@/` の別名の解決は要らない。外した理由は、型を外して流す Node.js の機能は JSX を扱えない（学習した
    知識で、この計画では確かめていない）ので、次の機能で画面の部品の試験を足すときに道具を替えることになり、試験の書き方と
    `npm run test` の中身を、その時点で書き直す費用が出るため。
  - 計算の層は `node:test`、画面の部品は後で vitest とする併用の案: 外した理由は、試験の道具が 2 つになり、`npm run test` が 2 つの
    道具を順に呼ぶ形になって、試験の書き方の決まり（どちらの API で書くか）を層ごとに持つ保守の手間が増えるため。いま vitest に
    そろえる費用は、依存を 1 つ足すことと設定のファイル 1 つである。
  - Jest: 外した。TypeScript と ESM のための変換の設定が要り、vitest より設定が多い。
  - やらない案: 外した。依頼の目的（計算の層の単体試験）に反する。
- Node.js の版: 採る案は、24 系を検証の基準（`.nvmrc` と、足す CI）にし、26 系での実行も許す（`engines` は `^24 || >=26`）案（判断の記録の 6）。
  比べた案は、22 系を基準にする案・26 系を基準にする案・基準を置かない案。
- CI: 判断 1 として利用者に諮る（案 A と案 B は上のとおり）。
  - 既存の `harness-docs.yml` にジョブとして足す案: ファイルが増えない利点がある。外した理由は、`harness-docs.yml` はひな形から
    敷いたファイルで、冒頭の注釈が「言語ごとの lint・型・試験は、既存の CI が受け持つ（このファイルには足さない）」と定めており、
    足すとひな形の更新のたびに手で混ぜ直す手間が出る害があるため。別のファイルにすれば、ひな形のファイルは変えずに済む。

## 検証（完了の条件）

仕様の基準は、計算と入力の判定の結果で決まる 18 の基準を、計算の層の単体試験（`src/lib/split-display.test.ts`）で確かめる。
単体試験は、画面に出す文と、どちらの欄に知らせを出すかを、計算の層の関数 `evaluateSplit` の戻り値として確かめる。
画面の上での振る舞い（開いた直後、入力のたびの変化、直す・消す、再読み込み、通信なし、知らせの位置と同時の表示）で決まる
12 の基準は、app-evaluator が動いているアプリを操作して確かめる。この分け方は、画面の部品が `evaluateSplit` の戻り値を分岐を
持たずにそのまま出す、という前提に立つ（判断の記録の 7。前提が守られているかは、手順 16 の実装レビューで確かめる）。

単体試験の基準の前提・操作・期待する結果は、どれも次の形である。前提は仕様の同じ識別子の前提。操作は、仕様の同じ識別子の
操作の 2 つの入力（合計の金額の文字列と人数の文字列）を `evaluateSplit` に渡す試験を、`npm run test` で流すこと。期待する
結果は、戻り値の結果の文と、2 つの知らせの有無が、仕様の同じ識別子の期待する結果と一致し、試験が通ること。試験の名前は
識別子で始める（例: `SPLIT-2 割り切れない金額`）。

app-evaluator が確かめる基準の対象ファイルは、どれも `src/app/page.tsx`、`src/app/layout.tsx`、
`src/app/_components/even-split-form.tsx`、`src/lib/split-calc.ts`、`src/lib/split-display.ts` の 5 つである。

### SPLIT-1 割り切れる金額

- 前提: 仕様の SPLIT-1 の前提。
- 操作: 仕様の SPLIT-1 の入力を `evaluateSplit` に渡す試験を流す。
- 期待する結果: 戻り値が仕様の SPLIT-1 の期待する結果と一致し、試験が通る。
- 確かめ方: 自動テスト

### SPLIT-2 割り切れない金額

- 前提: 仕様の SPLIT-2 の前提。
- 操作: 仕様の SPLIT-2 の入力を `evaluateSplit` に渡す試験を流す。
- 期待する結果: 戻り値が仕様の SPLIT-2 の期待する結果と一致し、試験が通る。
- 確かめ方: 自動テスト

### SPLIT-3 人数が 1 人

- 前提: 仕様の SPLIT-3 の前提。
- 操作: 仕様の SPLIT-3 の入力を `evaluateSplit` に渡す試験を流す。
- 期待する結果: 戻り値が仕様の SPLIT-3 の期待する結果と一致し、試験が通る。
- 確かめ方: 自動テスト

### SPLIT-4 人数が 0（画面で、知らせが人数の欄の下だけに出る）

- 前提: 仕様の SPLIT-4 の前提。アプリを `npm run dev` で起動し、ブラウザで画面を開いている。
- 操作: 仕様の SPLIT-4 の操作を画面で行う。
- 期待する結果: 仕様の SPLIT-4 の期待する結果のとおりに表示される（知らせが人数の入力欄のすぐ下にあり、合計の金額の欄の下には無い）。
- 確かめ方: 受け入れ確認
- 対象ファイル: `src/app/page.tsx`、`src/app/layout.tsx`、`src/app/_components/even-split-form.tsx`、`src/lib/split-calc.ts`、`src/lib/split-display.ts`

### SPLIT-5 人数が負の数

- 前提: 仕様の SPLIT-5 の前提。
- 操作: 仕様の SPLIT-5 の入力を `evaluateSplit` に渡す試験を流す。
- 期待する結果: 戻り値が仕様の SPLIT-5 の期待する結果と一致し（人数の知らせだけがあり、結果の文が無い）、試験が通る。
- 確かめ方: 自動テスト

### SPLIT-6 合計の金額が負の数（画面で、知らせが合計の金額の欄の下だけに出る）

- 前提: 仕様の SPLIT-6 の前提。アプリを `npm run dev` で起動し、ブラウザで画面を開いている。
- 操作: 仕様の SPLIT-6 の操作を画面で行う。
- 期待する結果: 仕様の SPLIT-6 の期待する結果のとおりに表示される。
- 確かめ方: 受け入れ確認
- 対象ファイル: `src/app/page.tsx`、`src/app/layout.tsx`、`src/app/_components/even-split-form.tsx`、`src/lib/split-calc.ts`、`src/lib/split-display.ts`

### SPLIT-7 合計の金額が数でない

- 前提: 仕様の SPLIT-7 の前提。
- 操作: 仕様の SPLIT-7 の入力を `evaluateSplit` に渡す試験を流す。
- 期待する結果: 戻り値が仕様の SPLIT-7 の期待する結果と一致し、試験が通る。
- 確かめ方: 自動テスト

### SPLIT-8 人数が数でない

- 前提: 仕様の SPLIT-8 の前提。
- 操作: 仕様の SPLIT-8 の入力を `evaluateSplit` に渡す試験を流す。
- 期待する結果: 戻り値が仕様の SPLIT-8 の期待する結果と一致し、試験が通る。
- 確かめ方: 自動テスト

### SPLIT-9 誤りを直すと、知らせが消えて結果が出る

- 前提: 仕様の SPLIT-9 の前提を画面で作る。アプリを `npm run dev` で起動している。
- 操作: 仕様の SPLIT-9 の操作を画面で行う。
- 期待する結果: 仕様の SPLIT-9 の期待する結果のとおりに表示が変わる。
- 確かめ方: 受け入れ確認
- 対象ファイル: `src/app/page.tsx`、`src/app/layout.tsx`、`src/app/_components/even-split-form.tsx`、`src/lib/split-calc.ts`、`src/lib/split-display.ts`

### SPLIT-10 再読み込みすると、値と結果が残らない

- 前提: 仕様の SPLIT-10 の前提を画面で作る。アプリを `npm run dev` で起動している。
- 操作: 仕様の SPLIT-10 の操作を画面で行う（ブラウザの再読み込み）。
- 期待する結果: 仕様の SPLIT-10 の期待する結果のとおりに表示される。
- 確かめ方: 受け入れ確認
- 対象ファイル: `src/app/page.tsx`、`src/app/layout.tsx`、`src/app/_components/even-split-form.tsx`、`src/lib/split-calc.ts`、`src/lib/split-display.ts`

### SPLIT-11 画面を開いた後は、通信なしで計算できる

- 前提: アプリを本番の形（`npm run build` の後に `npm run start -- --hostname 127.0.0.1 --port <ポート>`）で起動し、ブラウザで画面を
  開き終えている。app-evaluator の道具には端末の通信を切る操作が無いので、次の順で通信の無い状態に代える: (1) 画面を開き終えた
  時点の通信の一覧（ブラウザの道具の通信の一覧）を控える。(2) 最後に、本番の形のサーバーを止める（止め方は
  `.claude/skills/run-split-bill/SKILL.md`）。
- 操作: サーバーを止めた後に、仕様の SPLIT-11 の操作を画面で行う。
- 期待する結果: 仕様の SPLIT-11 の期待する結果のとおりに表示される。入力の前後で、通信の一覧に新しい要求が増えない。
  開発用の表示が出たときと、ページが読み込み直されたときは、この基準を未確認とする。
- 確かめ方: 受け入れ確認
- 対象ファイル: `src/app/page.tsx`、`src/app/layout.tsx`、`src/app/_components/even-split-form.tsx`、`src/lib/split-calc.ts`、`src/lib/split-display.ts`

### SPLIT-12 開いた直後は、欄が空で、結果も知らせもボタンも無い

- 前提: 仕様の SPLIT-12 の前提。アプリを `npm run dev` で起動している。
- 操作: 仕様の SPLIT-12 の操作を画面で行う。
- 期待する結果: 仕様の SPLIT-12 の期待する結果のとおりに表示される。
- 確かめ方: 受け入れ確認
- 対象ファイル: `src/app/page.tsx`、`src/app/layout.tsx`、`src/app/_components/even-split-form.tsx`、`src/lib/split-calc.ts`、`src/lib/split-display.ts`

### SPLIT-13 入力を変えると、その時点で結果が変わる

- 前提: 仕様の SPLIT-13 の前提を画面で作る。アプリを `npm run dev` で起動している。
- 操作: 仕様の SPLIT-13 の操作を画面で行う。
- 期待する結果: 仕様の SPLIT-13 の期待する結果のとおりに、ボタンを押さずに表示が変わる。
- 確かめ方: 受け入れ確認
- 対象ファイル: `src/app/page.tsx`、`src/app/layout.tsx`、`src/app/_components/even-split-form.tsx`、`src/lib/split-calc.ts`、`src/lib/split-display.ts`

### SPLIT-14 入力の途中で誤った値になると、その時点で知らせが出る

- 前提: 仕様の SPLIT-14 の前提を画面で作る。アプリを `npm run dev` で起動している。
- 操作: 仕様の SPLIT-14 の操作を画面で行う（1 文字ずつ打つ）。
- 期待する結果: 仕様の SPLIT-14 の期待する結果のとおりに表示が変わる。
- 確かめ方: 受け入れ確認
- 対象ファイル: `src/app/page.tsx`、`src/app/layout.tsx`、`src/app/_components/even-split-form.tsx`、`src/lib/split-calc.ts`、`src/lib/split-display.ts`

### SPLIT-15 合計の金額の欄が空

- 前提: 仕様の SPLIT-15 の前提。アプリを `npm run dev` で起動している。
- 操作: 仕様の SPLIT-15 の操作を画面で行う。
- 期待する結果: 仕様の SPLIT-15 の期待する結果のとおりに表示される。
- 確かめ方: 受け入れ確認
- 対象ファイル: `src/app/page.tsx`、`src/app/layout.tsx`、`src/app/_components/even-split-form.tsx`、`src/lib/split-calc.ts`、`src/lib/split-display.ts`

### SPLIT-16 人数の欄が空

- 前提: 仕様の SPLIT-16 の前提。アプリを `npm run dev` で起動している。
- 操作: 仕様の SPLIT-16 の操作を画面で行う。
- 期待する結果: 仕様の SPLIT-16 の期待する結果のとおりに表示される。
- 確かめ方: 受け入れ確認
- 対象ファイル: `src/app/page.tsx`、`src/app/layout.tsx`、`src/app/_components/even-split-form.tsx`、`src/lib/split-calc.ts`、`src/lib/split-display.ts`

### SPLIT-17 値を消して欄を空にすると、結果と知らせが消える

- 前提: 仕様の SPLIT-17 の前提を画面で作る。アプリを `npm run dev` で起動している。
- 操作: 仕様の SPLIT-17 の操作を画面で行う。
- 期待する結果: 仕様の SPLIT-17 の期待する結果のとおりに表示が変わる。
- 確かめ方: 受け入れ確認
- 対象ファイル: `src/app/page.tsx`、`src/app/layout.tsx`、`src/app/_components/even-split-form.tsx`、`src/lib/split-calc.ts`、`src/lib/split-display.ts`

### SPLIT-18 合計の金額が 0 円

- 前提: 仕様の SPLIT-18 の前提。
- 操作: 仕様の SPLIT-18 の入力を `evaluateSplit` に渡す試験を流す。
- 期待する結果: 戻り値が仕様の SPLIT-18 の期待する結果と一致し、試験が通る。
- 確かめ方: 自動テスト

### SPLIT-19 人数が合計の金額より多い

- 前提: 仕様の SPLIT-19 の前提。
- 操作: 仕様の SPLIT-19 の入力を `evaluateSplit` に渡す試験を流す。
- 期待する結果: 戻り値が仕様の SPLIT-19 の期待する結果と一致し、試験が通る。
- 確かめ方: 自動テスト

### SPLIT-20 合計の金額が上限ちょうど

- 前提: 仕様の SPLIT-20 の前提。
- 操作: 仕様の SPLIT-20 の入力を `evaluateSplit` に渡す試験を流す。
- 期待する結果: 戻り値が仕様の SPLIT-20 の期待する結果と一致し（桁区切りを含む）、試験が通る。
- 確かめ方: 自動テスト

### SPLIT-21 合計の金額が上限を 1 超える

- 前提: 仕様の SPLIT-21 の前提。
- 操作: 仕様の SPLIT-21 の入力を `evaluateSplit` に渡す試験を流す。
- 期待する結果: 戻り値が仕様の SPLIT-21 の期待する結果と一致し、試験が通る。
- 確かめ方: 自動テスト

### SPLIT-22 人数が上限ちょうど

- 前提: 仕様の SPLIT-22 の前提。
- 操作: 仕様の SPLIT-22 の入力を `evaluateSplit` に渡す試験を流す。
- 期待する結果: 戻り値が仕様の SPLIT-22 の期待する結果と一致し、試験が通る。
- 確かめ方: 自動テスト

### SPLIT-23 人数が上限を 1 超える

- 前提: 仕様の SPLIT-23 の前提。
- 操作: 仕様の SPLIT-23 の入力を `evaluateSplit` に渡す試験を流す。
- 期待する結果: 戻り値が仕様の SPLIT-23 の期待する結果と一致し、試験が通る。
- 確かめ方: 自動テスト

### SPLIT-24 小数の合計の金額

- 前提: 仕様の SPLIT-24 の前提。
- 操作: 仕様の SPLIT-24 の入力を `evaluateSplit` に渡す試験を流す。
- 期待する結果: 戻り値が仕様の SPLIT-24 の期待する結果と一致し、試験が通る。
- 確かめ方: 自動テスト

### SPLIT-25 小数の人数

- 前提: 仕様の SPLIT-25 の前提。
- 操作: 仕様の SPLIT-25 の入力を `evaluateSplit` に渡す試験を流す。
- 期待する結果: 戻り値が仕様の SPLIT-25 の期待する結果と一致し、試験が通る。
- 確かめ方: 自動テスト

### SPLIT-26 全角の数字

- 前提: 仕様の SPLIT-26 の前提。
- 操作: 仕様の SPLIT-26 の入力を `evaluateSplit` に渡す試験を流す。
- 期待する結果: 戻り値が仕様の SPLIT-26 の期待する結果と一致し、試験が通る。
- 確かめ方: 自動テスト

### SPLIT-27 桁区切りの入った値

- 前提: 仕様の SPLIT-27 の前提。
- 操作: 仕様の SPLIT-27 の入力を `evaluateSplit` に渡す試験を流す。
- 期待する結果: 戻り値が仕様の SPLIT-27 の期待する結果と一致し、試験が通る。
- 確かめ方: 自動テスト

### SPLIT-28 円の付いた値

- 前提: 仕様の SPLIT-28 の前提。
- 操作: 仕様の SPLIT-28 の入力を `evaluateSplit` に渡す試験を流す。
- 期待する結果: 戻り値が仕様の SPLIT-28 の期待する結果と一致し、試験が通る。
- 確かめ方: 自動テスト

### SPLIT-29 前後の空白

- 前提: 仕様の SPLIT-29 の前提。
- 操作: 仕様の SPLIT-29 の入力（前後に半角の空白を 1 つずつ付けた文字列）を `evaluateSplit` に渡す試験を流す。
- 期待する結果: 戻り値が仕様の SPLIT-29 の期待する結果と一致し、試験が通る。
- 確かめ方: 自動テスト

### SPLIT-30 両方が誤り（画面で、2 つの知らせが同時に出る）

- 前提: 仕様の SPLIT-30 の前提。アプリを `npm run dev` で起動している。
- 操作: 仕様の SPLIT-30 の操作を画面で行う。
- 期待する結果: 仕様の SPLIT-30 の期待する結果のとおりに表示される。
- 確かめ方: 受け入れ確認
- 対象ファイル: `src/app/page.tsx`、`src/app/layout.tsx`、`src/app/_components/even-split-form.tsx`、`src/lib/split-calc.ts`、`src/lib/split-display.ts`

### V1 手元の検査と PR の CI がすべて通る

- 前提: 手順 1〜16 を終え、worktree `wt-split-bill-feat` にすべての変更がある。手順 17 で PR を作った後。
- 操作: worktree の中で `npm run check`、`npm run lint`、`npm run typecheck` を 1 つずつ流し、終了コードを見る。PR の画面の検査の一覧
  （`gh pr checks <PR の番号> --repo <所有者>/split-bill`。所有者は `git remote get-url origin` で確かめる）を見る。
- 期待する結果: 3 つのコマンドの終了コードが、どれも 0 である。PR の CI のジョブが、すべて成功である（判断 1 で CI を足したときは、
  足したジョブも含む）。
- 確かめ方: 自動テスト

### V2 作業の途中で、ハーネスの早期通知が少なくとも 1 回出た

- 前提: 早期通知 `scripts/harness/notify.sh` は、Claude Code の Edit と Write の直後にフックから呼ばれ、文書の検査が失敗したときだけ
  知らせを出す（`notify.sh` の冒頭の注釈の「流れ」の 5）。
- 操作: 会話の記録（まとめ役と担当の記録）で、フックの追加の文脈として出た早期通知を探す。
- 期待する結果: 知らせが少なくとも 1 回あり、その日時と、知らせが挙げた失敗を進捗の節に書いてある。手順 5 で知らせが出れば、
  それは追加の証拠として進捗に書く。
- 確かめ方: 人が確認

### V3 受け入れ確認の記録が、基準ごとの合否と証拠を持ち、PR に含まれる

- 前提: 手順 15 を終えた。
- 操作: 計画と同じディレクトリの `2026-10-26-even-split.acceptance.md` を開き、PR の変更のファイルの一覧を見る。
- 期待する結果: 記録に、SPLIT-4・SPLIT-6・SPLIT-9〜SPLIT-17・SPLIT-30 の 12 の基準のそれぞれについて、確かめた者が
  `app-evaluator` の実行のうち最新の結果が合格の行と、その下の証拠の行がある。記録のファイルが PR の変更に含まれる。
- 確かめ方: 人が確認

### V4 依存の向きの検査が、禁じた依存を失敗にする

- 前提: 手順 6 を終え、`npm run check:deps` の終了コードが 0 である。
- 操作: 一時のファイルを 4 つ作って `npm run check:deps` を流す。(1) `src/lib/zz-violation-react.ts` に
  `import { useState } from "react";` と、それを使う 1 行を書く。(2) `src/lib/zz-violation-app.ts` に
  `import Home from "../app/page";` と、それを使う 1 行を書く。(3) `src/lib/zz-violation-test.ts` に
  `import "./split-display.test";` を書く（計算の層の本番のコードから試験を読み込む）。(4) `src/app/_components/zz-violation-test.tsx` に
  `import "@/lib/split-display.test";` を書く（画面の部品から計算の層の試験を読み込む）。流した後に 4 つのファイルを消し、もう一度流す。
  実装レビューの後に、次の一時のファイルを (1)〜(4) に加えて流す（判断の記録の 18）: `src/lib` での `node:fs` の読み込み、`src/lib` での
  `import type` による `react` の読み込み、`src/lib` の試験での `node:test` の読み込み、`templates` から `@/lib/split-calc` の読み込み、
  `src/app` から `templates/module/example` の読み込み、`src/lib` の 2 つのファイルの相互の読み込み、解決できない読み込み、画面の部品から
  `split-calc.ts` の読み込み、`src` の直下の別の場所のファイルからの読み込み、`src/lib` での `process.getBuiltinModule` の呼び出し。
- 期待する結果: 一時のファイルがある間は終了コードが 0 でなく、出力に規則の名前 `lib-only-lib` が (1) と (2) の 2 件、
  `no-prod-to-test` が (3) と (4) の 2 件出る。広げた確かめでは、`.dependency-cruiser.cjs` の 9 つの規則の名前が、どれも 1 件以上出る。
  消した後は終了コードが 0 である。出力の要旨を進捗の節に書いてある。
- 確かめ方: 人が確認

## 手順

各手順は、前の番号の手順を終えてから進める（順序の依存は各手順に書いた）。コマンドは、どれも worktree `wt-split-bill-feat` の
根で流す（別のディレクトリから流すときは `npm --prefix <worktree の絶対パス> run <名前>` か `git -C <worktree の絶対パス>` の形）。
ファイルの編集は Claude Code の Edit と Write で行う（早期通知のフックは、この 2 つでしか動かないため）。

手順 6 で検査を定めるファイル（`.dependency-cruiser.cjs`）を作ってから、手順 13 で検査の由来の記録の行を書くまでは、
`npm run check:docs` が検査 12（検査の由来の記録）で失敗し、`.md` を編集するたびに早期通知が出る。この間の手順の
`npm run check:docs` は、失敗が検査 12 の 1 件だけであることを確かめる。

1. 前提を確かめる。
   - `git worktree list` で、ディレクトリ名 `wt-split-bill-feat` とブランチ `feat/split-calculator` の組を確かめる。
   - `git status --short` で、変更が `docs/product-specs/README.md`（変更）、`docs/product-specs/even-split.md`（未追跡）と
     この計画（未追跡）だけであることを確かめる。
   - `node --version` で 24 以上であることを確かめ（手元は 26 系でよい）、`npm ci` を流し、`npm run check` の終了コードが 0 である
     ことを確かめる（変更の前の基点）。
   - Next.js 16 の説明を読む: `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`、
     `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md`、
     `node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`（`src` と非公開のフォルダー）、
     `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`。学習した知識と食い違う点は「発見」に書く。
2. Node.js の版の基準を置く（手順 1 の後）。
   - 根に `.nvmrc` を作り、中身を `24` の 1 行にする（検証の基準の版。足す CI もこれを読む）。
   - `package.json` に `"engines": { "node": "^24 || >=26" }` を足す（26 系での実行も許す）。
   - `npm install --save-dev @types/node@^24` を流す（`package.json` と `package-lock.json` が変わる）。
   - `npm run typecheck` の終了コードが 0 であることを確かめる。
3. 試験の道具 vitest を入れ、ひな形を対象から外す（手順 2 の後。vitest 5 は Node.js 22.12 以上か 24 以上を求める）。
   - `npm install --save-dev vitest@^5` を流す。
   - 入った vitest の設定の型（`node_modules/vitest/dist/` の中の `include` の説明）を読み、`include` を指定すると既定の対象が
     置き換わることを確かめる。違えば「発見」に書き、`exclude` に `templates/**` を足す形に変える。
   - 根に `vitest.config.mts` を作る。`vitest/config` の `defineConfig` で、`test.include` を `["src/**/*.test.ts"]`、
     `test.environment` を `"node"` にする。
   - `package.json` の `scripts` に `"test": "vitest run"` を足す。
   - `docs/exec-plans/tech-debt-tracker.md` の TD-2 の行を消す（「次に使う識別子」の行は変えない）。
4. 計算の層を、試験から先に書く（手順 3 の後）。計算の層は 2 つのファイルに分け、計算の層の中の読み込みは相対パスで書く。
   - `src/lib/split-calc.ts`（判定と計算。文言を持たず、構造化した値を返す）:
     - 上限と下限の名前付きの定数 `TOTAL_MIN`（0）、`TOTAL_MAX`（100000000）、`PEOPLE_MIN`（1）、`PEOPLE_MAX`（100）。
     - `parseTotal(input: string)` と `parsePeople(input: string)`: 戻り値は `{ kind: "empty" }`・`{ kind: "invalid" }`・
       `{ kind: "valid"; value: number }` のどれか。`input.trim()` が空なら `empty`。`/^[0-9]+$/` に合わなければ `invalid`。
       合えば数にし、上の定数の範囲の中なら `valid`、外れれば `invalid`。
     - `splitEvenly(total: number, people: number)`: `{ perPerson, organizer, remainder }` を返す。`perPerson` は
       `Math.floor(total / people)`、`remainder` は `total - perPerson * people`、`organizer` は `perPerson + remainder`。
   - `src/lib/split-display.ts`（文言と書式。`./split-calc` だけを読み込む）:
     - `formatInteger(value: number)`: `Intl.NumberFormat("ja-JP")` で桁区切りを入れた数の文字列。
     - `TOTAL_ERROR_MESSAGE` と `PEOPLE_ERROR_MESSAGE`: `split-calc.ts` の定数と `formatInteger` から組み立てる
       （例: `合計の金額は ${formatInteger(TOTAL_MIN)} 以上 ${formatInteger(TOTAL_MAX)} 以下の整数（円）で入れてください`）。
     - `formatSplit(result)`: 端数が 0 なら `1 人あたり <額> 円。端数なし`、そうでなければ `1 人あたり <額> 円。幹事は <額> 円`。
     - `evaluateSplit(totalInput: string, peopleInput: string)`: 2 つのファイルの結果を合わせた表示用の値
       `SplitView`（`{ totalError, peopleError, resultText }`。どれも `string | null`）を返す。知らせは、その欄が `invalid` のときだけ
       入れる。結果の文は、両方が `valid` のときだけ入れる。
   - 公開の範囲: 画面から使う口は `evaluateSplit` と型 `SplitView` だけで、画面の部品はこの 2 つのほかを読み込まない。試験から使う
     ものは、上のほかの関数と定数（`parseTotal`・`parsePeople`・`splitEvenly`・`formatInteger`・`formatSplit`・2 つの文言・4 つの定数）である。
   - 試験を 2 つのファイルに書く。vitest の `describe`・`test`・`expect` を使う。
     - `src/lib/split-display.test.ts`: 検証の節で単体試験とした 18 の基準を 1 つずつ試験にし、名前を識別子で始める。加えて、
       SPLIT-4・SPLIT-6・SPLIT-15・SPLIT-16・SPLIT-30 の入力での戻り値（画面の基準の論理の裏付け）と、2 つの文言が仕様の
       「利用者の操作の流れ」の文言と 1 字も違わないことを確かめる試験を書く。
     - `src/lib/split-calc.test.ts`: 空白だけの入力（`empty`）、先頭に 0 のある `007`（7）、`+3`・`-0`・`1e3`・`0x10`（`invalid`）、
       全角の空白で囲んだ値（前後の空白として除く）、21 桁以上の数字の並び（`invalid`）、4 つの定数の境目の値、`splitEvenly` の
       端数 0 と端数ありの値。
   - 計算の層は `src/lib/` の中のほかに何も読み込まない（Next.js・React・ほかの包み・Node.js の組み込みのモジュールを含む）。日時・
     乱数・通信・保存を使わない。
   - `npm run test`、`npm run typecheck`、`npm run lint` の終了コードが 0 であることと、`npm run test` の出力に
     `templates/module/example.test.ts` が出ないことを確かめる。書いた試験の件数を進捗に書く。
5. 文書の地図に依存の向きの検査の行を足す（手順 4 の後）。
   - `AGENTS.md` の「文書の地図」の表に、Edit で次の行を足す: 1 列目「検査（依存の向き）」、2 列目 `` `.dependency-cruiser.cjs` ``、
     3 列目「層の間の依存の規則を足すか変えるとき（流すコマンドは、検査のコマンドの表の依存の向きの行）」。3 列目にバッククォートを
     使わない（検査 3 は、地図のどの列でもバッククォートの中の文字列をパスとして実在を確かめるため。`check-docs.sh` の 381〜392 行目）。
   - この時点では `.dependency-cruiser.cjs` が無いので、文書の検査の検査 3 が失敗し、早期通知が出る見込みである。知らせが出たら、
     日時と、知らせが挙げた失敗を、V2 の追加の証拠として進捗に書く。出なければ、その事実を「発見」に書く。
6. 依存の向きの検査を入れる（手順 5 の後。検査の由来の記録の行は手順 13 で書く）。
   - `npm install --save-dev dependency-cruiser@^18` を流す（起票の時点の最新は 18.7.0 で、Node.js 22・24・26 以上を受け付ける）。
   - 根に `.dependency-cruiser.cjs` を作る。中身は、下のコードブロックの規則と設定にする。入った版の説明
     （`node_modules/dependency-cruiser/doc/` か `--help`）で、各項目の名前を確かめ、違えば「発見」に書いて直す。
   - `package.json` の `scripts` に `"check:deps": "depcruise src templates --config .dependency-cruiser.cjs"` を足す。
   - `npm run check:deps` と `npm run lint` の終了コードが 0 であることと、`npm run check:docs` の失敗が検査 12 の 1 件だけであることを
     確かめる。lint が `.dependency-cruiser.cjs` で失敗したら、規則の名前を「発見」に書き、設定のファイルの書き方を直す（lint の対象から
     外さない）。
   - V4 の操作を行い、結果を進捗に書く。一時のファイルが残っていないことを `git status --short` で確かめる。

```js
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "lib-only-lib",
      comment: "計算の層（試験を除く）は、計算の層の中だけを読み込む。画面の層、Next.js、React、ほかの包み、Node.js の組み込みのモジュールを読み込まない",
      severity: "error",
      from: { path: "^src/lib/", pathNot: "\\.test\\.ts$" },
      to: { pathNot: "^src/lib/" },
    },
    {
      name: "lib-test-only-lib-and-vitest",
      comment: "計算の層の試験は、計算の層と vitest だけを読み込む",
      severity: "error",
      from: { path: "^src/lib/.+\\.test\\.ts$" },
      to: { pathNot: ["^src/lib/", "^node_modules/vitest/"] },
    },
    {
      name: "no-prod-to-test",
      comment: "本番のコード（src の下の試験でないファイル）は、試験のファイルを読み込まない",
      severity: "error",
      from: { path: "^src/", pathNot: "\\.test\\.tsx?$" },
      to: { path: "\\.test\\.tsx?$" },
    },
    { name: "no-circular", severity: "error", from: {}, to: { circular: true } },
    { name: "src-not-to-templates", severity: "error", from: { path: "^src/" }, to: { path: "^templates/" } },
    { name: "templates-not-to-src", severity: "error", from: { path: "^templates/" }, to: { path: "^src/" } },
    { name: "not-to-unresolvable", severity: "error", from: {}, to: { couldNotResolve: true } },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
  },
};
```

上のコードブロックは起票の時点の形である。実装レビューの後に、規則 `app-only-display` と `src-only-known-layers`、検出の設定
`detectJSDocImports`・`detectImportsInAmbientModules`・`detectProcessBuiltinModuleCalls` を足した（判断の記録の 18）。現在の正本は `.dependency-cruiser.cjs` である。

7. 画面の層を作る（手順 6 の後）。
   - `src/app/_components/even-split-form.tsx` を作る。1 行目に `"use client";` を置き、React の `useState` で 2 つの入力の文字列を
     持つ（初めは空の文字列）。描くたびに `evaluateSplit`（`@/lib/split-display` から読み込む）を呼び、戻り値の 3 つの文字列を、
     分岐を持たずにそのまま出す（`null` は空の文字列として出す）。部品の中で値を判定したり、文言を組み立てたりしない。`useEffect` と
     保存（`localStorage`、Cookie、サーバーへの送信）は使わない。
   - 入力欄は 2 つで、どちらも `type="text"`、`inputMode="numeric"`、`autoComplete="off"` にし、`label` で「合計の金額（円）」と
     「人数」を付ける。`type="number"` にしない（`abc`・`1,000`・`3a`・全角の数字を、ブラウザが値を空にするか打てなくして、
     仕様の知らせを出せなくなるため）。
   - 各入力欄のすぐ下に、その欄の知らせ（`totalError`・`peopleError`）を出す要素を置く。結果の文（`resultText`）は、入力欄の後の
     `aria-live="polite"` の要素に出す。知らせの 2 つの要素と結果の要素は、初めの表示から置いておき、中の文字列だけを切り替える
     （要素を出したり消したりしない。`aria-live` の要素が後から現れると、読み上げが働かないことがあるため）。入力欄には、知らせの
     要素を指す `aria-describedby` を付ける。計算のためのボタンと `form` の送信は置かない。
   - `src/app/page.tsx` を作り直す。create-next-app の内容（`next/image` の画像と案内の文）を消し、見出し「割り勘の計算」と
     `EvenSplitForm` を置く。Server Component のままにする。スマートフォンの幅でも 1 列で読める Tailwind CSS の指定にする。
   - `src/app/layout.tsx` の `html` の `lang` を `ja` にし、`metadata` の `title` を「割り勘の計算」、`description` を
     「合計の金額と人数から、1 人あたりの額と幹事が払う額を出す」にする。字体の指定は変えない。
   - `npm run lint`、`npm run typecheck`、`npm run check:deps` の終了コードが 0 であることを確かめる。実装の担当は、
     `npm run dev -- --hostname 127.0.0.1 --port <空いているポート>` で起動して画面の動きを見てよいが、これは判定に数えない。
8. `ARCHITECTURE.md` の 4 か所を埋め、ADR を書く（手順 4・6・7 の後。書いたパスが実在しないと検査 7 が失敗するため）。
   - 「層と責務」（8 行目）を、次の 2 行の表（列は「層」「パス」「責務」）に置き換える:
     画面の層 `src/app/`（経路、画面の部品、入力の文字列の状態、表示。部品は非公開のフォルダー `src/app/_components/` に置き、
     計算の層の戻り値を分岐を持たずに出す）と、計算の層 `src/lib/`（入力の文字列の解釈と範囲の判定、割り勘の計算、表示の文言と
     書式。純粋な関数だけ）。
   - 「依存の向き」（12 行目）: 画面の層は計算の層を読み込んでよい。計算の層は計算の層の中だけを読み込み、画面の層・Next.js・
     React・ほかの包み・Node.js の組み込みのモジュールを読み込まない（型だけの読み込みも含む）。計算の層の中は相対パスで読み込む。
     計算の層の試験は、計算の層と vitest だけを読み込む。本番のコードは試験のファイルを読み込まない。`src/` と `templates/` は互いに
     読み込まない。循環する依存を作らない。副作用のあるコード（通信・保存など）は、それを置く層を足す ADR を書いてから置く。
     これらの規則は `npm run check:deps`（dependency-cruiser、設定は `.dependency-cruiser.cjs`）が失敗にする（相対パスの決まりと、
     副作用のあるコードの決まりは除く）。
   - 「不変条件」（16 行目）: 計算の層の関数は、同じ入力に同じ出力を返し、日時・乱数・通信・保存を使わない。画面は入れた値を
     保存せず、通信しない。入力の上限と下限は計算の層の名前付きの定数の 1 か所にだけ持ち、誤りの知らせの文言はその定数から組み立てる。
   - 「中核的な原則」（20 行目）: 誤った額を出さないことを、見た目や速さより先にする。計算と入力の判定は、画面なしで単体試験で
     確かめられる場所に置く。外部の API・API キー・有料のサービスに頼らない。
   - ADR を 3 件足し、`docs/adr/README.md` の目録に行を足す（状態は「採用」）。書式は同じ目録の「書式」のとおり（背景・判断・
     検討した代わりの案・結果）。
     - `0002`: 計算の層と画面の層に分けること、表示の文言と書式を計算の層に置くこと、依存の向きの検査に dependency-cruiser を使うこと、
       検査の対象に `templates/` を含めること。代わりの案は、目的の節の「選択肢を絞る前の確かめ」の層と道具の項目から写す。
     - `0003`: 試験の道具に vitest を使い、`templates/` を対象から外すこと。
     - `0004`: 24 系を検証の基準（`.nvmrc` と足す CI）にし、26 系での実行も許す（`engines` は `^24 || >=26`）こと。既存のワークフローの
       `lts/*` を変えない理由も書く。
   - `npm run check:docs` の失敗が検査 12 の 1 件だけであることを確かめる。ADR は手順 16 の実装レビューの対象に含める。
9. 検査のコマンドの表と `npm run check` を直す（手順 6 の後）。
   - `package.json` の `check` を `npm run check:secrets && npm run lint && npm run typecheck && npm run check:deps && npm run test && npm run check:docs && npm run test:harness` にする。
   - `AGENTS.md` の「検査のコマンド」の表で、「試験」の行のコマンドを `npm run test` にし、「依存の向き（計算の層が画面の層・
     Next.js・React を読み込まない）」の行（コマンド `npm run check:deps`）を足す。「全部」の行の括弧書きは、
     手順 12 で直す（判断 1 の答えは案 A）。
   - `npm run check:secrets`、`npm run lint`、`npm run typecheck`、`npm run check:deps`、`npm run test`、`npm run test:harness` を
     1 つずつ流して終了コードが 0 であることと、`npm run check:docs` の失敗が検査 12 の 1 件だけであることを確かめる。
10. `docs/QUALITY_SCORE.md` の目標の表を埋める（手順 9 の後。検査の識別子が `package.json` の `scripts` にある必要があるため）。
    - 10 行目の `[NEEDS CLARIFICATION]` の行を、次の 2 行に置き換える。1 行目: 目標「計算の層が画面の層・Next.js・React に依存しない」、
      測る項目「依存の規則の違反の数（0 を保つ）」、確かめ方の列「`npm run check:deps`」、検査の識別子「`check:deps`」。
      2 行目: 目標「割り勘の計算と入力の判定が仕様どおりである」、測る項目「計算の層の単体試験の失敗の数（0 を保つ）」、
      確かめ方の列「`npm run test`」、検査の識別子「`test`」。
    - 「現在の評価」の表は、この計画では足さない。
11. `.claude/skills/run-split-bill/SKILL.md` の 5 か所を埋める（手順 7 の後）。
    - 「前提」（12 行目）: Node.js 24 以上（検証の基準は `.nvmrc` の 24 系。26 系での実行も許す）と npm を使う。依存は `npm ci` で
      入れる。待ち受けは `127.0.0.1` に限る。ポートは 3000 から順に、`lsof -nP -iTCP:<ポート> -sTCP:LISTEN` の出力が空の番号を選ぶ。
    - 「起動のコマンド」（16 行目）: 開発の形は `npm run dev -- --hostname 127.0.0.1 --port <ポート>`。本番の形は `npm run build` の後に
      `npm run start -- --hostname 127.0.0.1 --port <ポート>`（`-H` と `-p` の名前は
      `node_modules/next/dist/docs/01-app/03-api-reference/06-cli/next.md` の 70〜71 行目と 122〜123 行目で確かめた）。どちらも
      止まらずに動き続けるので、バックグラウンドで起動し、起動した処理の識別子を控える。
    - 「起動の完了の確かめ方」（20 行目）: 出力に `Ready` の行が出て、`curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:<ポート>/`
      が `200` を返す。
    - 「止め方と止まったことの確かめ方」（24 行目）: 自分が起動したバックグラウンドの処理を、控えた識別子で止める。プロセスの名前で
      探して止めない（ほかの会話が起動したものを止めないため）。止まったことは、上の `curl` が接続できずに失敗し、上の `lsof` の
      出力が空になることで確かめる。
    - 「確認用のデータで起動する方法」（28 行目）: なし（画面で値を入れるだけで、データを読まず、外部へ通信しない）。
    - あわせて、`docs/PRODUCT_SENSE.md` の「目的」「対象の利用者」「作らないもの」を、判断 2 で利用者が決めた文面で埋める。
    - `npm run check:docs` の失敗が検査 12 の 1 件だけであることを確かめる。
12. CI を足す（判断 1 の答えは案 A。検査の由来の記録の行は手順 13 で書く）。
    - `.github/workflows/app-checks.yml` を作る。形は既存の `harness-secrets.yml` に合わせる: `on` は `pull_request` と、
      すべてのブランチとタグの `push`。`permissions` は `contents: read`。ジョブは 1 つで、消した push では動かさない条件を付ける。
      `actions/checkout` は既存と同じコミット（`3d3c42e5aac5ba805825da76410c181273ba90b1`、v7.0.1）で `persist-credentials: false`。
      `actions/setup-node` は既存と同じコミット（`949feb2413d6458794dcd2491c4babbbce0c15c1`、v7.1.0）で `node-version-file: .nvmrc`。
      依存は `npm ci --ignore-scripts`（インストール用のスクリプトが要って失敗したら「発見」に書き、利用者に確かめる）。
      その後に `npm run lint`、`npm run typecheck`、`npm run check:deps`、`npm run test` を 1 段ずつ流す。`timeout-minutes` は 15。
      冒頭の注釈に、何を流すかと、秘匿値の検査は `harness-secrets.yml` が受け持つことを書く。
      技術的負債の一覧は、TD-1 のうち新しい CI で解消しない残り（PR の CI が段の読み取りの試験 `scripts/harness/stack-adapter.test.sh` を
      流さないこと。場所は `.github/workflows/harness-docs.yml`）を TD-4 として足し（「次に使う識別子」を TD-5 に進める。見つけた作業は
      この計画のファイル名）、TD-1 の行を消す。
      `AGENTS.md` の「全部」の行の括弧書きを、PR の CI で失敗すると PR が失敗になるものに、lint・型・依存の向き・試験を加えた形に直す。
      `.github/workflows/harness-docs.yml` の 3 行目の注釈（「既存の CI が受け持つ」）は、足した CI で正しくなるので変えない。
    - `npm run check:docs` の失敗が検査 12 の 1 件だけであることを確かめる。
13. 検査の由来の記録に行を書く（判断 3 の答えは案 A。手順 6 と手順 12 の後）。
    - `docs/harness-log.md` の記録の表に、依存の向きの検査の行を足す: 検査は「`npm run check:deps`（規則 `lib-only-lib`・
      `lib-test-only-lib-and-vitest`・`app-only-display`・`src-only-known-layers`・`no-prod-to-test`・`no-circular`・`src-not-to-templates`・`templates-not-to-src`・
      `not-to-unresolvable`）」、元の指摘の出どころは「設計で足した検査（指摘から作ったものではない）。`2026-10-26-even-split.md` の
      『目的』。目安の出どころの数に満たないが利用者が選んだ」、置き換えた文書の記述は「`ARCHITECTURE.md` の『依存の向き』」、
      入れた変更は「`feat/split-calculator`」、外した変更は空。
    - CI の行も足す: 検査は「PR の CI `app-checks`（`npm run lint`・`npm run typecheck`・`npm run check:deps`・
      `npm run test`）」、元の指摘の出どころは「設計で足した検査（指摘から作ったものではない）。技術的負債 TD-1（骨組みとハーネスの
      導入の PR）と `2026-10-26-even-split.md` の『目的』の判断 1。目安の出どころの数に満たないが利用者が選んだ」、置き換えた文書の
      記述は「`AGENTS.md` の『検査のコマンド』の『全部』の行」、入れた変更は「`feat/split-calculator`」、外した変更は空。
    - `npm run check:docs` の終了コードが 0 であることを確かめる。
14. すべての検査を流す（手順 1〜13 の後）。
    - `npm run check`、`npm run lint`、`npm run typecheck` を 1 つずつ流し、どれも終了コードが 0 であることを確かめる（V1 の手元の部分）。
    - 照合の道具 `~/.agents/skills/exec-plan/scripts/plan-status.sh` をこの計画に流し、不備が 0 であることを確かめる。
15. 受け入れ確認を行う（手順 14 の後）。
    - まとめ役が app-evaluator を起動する。app-evaluator は、`.claude/skills/run-split-bill/SKILL.md` の手順で、worktree の中で
      アプリを起動し、ブラウザで操作して、検証の節で受け入れ確認とした 12 の基準を確かめ、計画と同じディレクトリの
      `2026-10-26-even-split.acceptance.md` に記録を書く。記録を書くのは app-evaluator だけである。
    - SPLIT-11 のほかの 11 の基準は、開発の形（`npm run dev`）で確かめる。SPLIT-11 は、最後に本番の形（`npm run build` と
      `npm run start`）で起動し直して確かめ、サーバーを止める確かめはその最後に置く。
    - 単体試験で確かめる SPLIT-26 と SPLIT-29 も、確かめ方は変えずに、画面で操作して、結果を記録の基準外の所見に書く（全角の数字と
      前後の空白が、画面の入力欄を通しても同じに扱われるかを見るため）。
    - 終えたら、自分が起動したサーバーを止める。
    - まとめ役は、受け入れ確認の直後に、記録のほかのファイルが変わっていないことを `git status --short` で確かめる。
    - 不合格か未確認の基準があれば、実装の担当が直し、手順 14 を流し直してから、その基準を確かめ直してもらう。
16. 実装レビューを受ける（手順 15 の後）。
    - まとめ役が、実装レビューの担当（設計の品質のレビューを含む）と、利用者単位の規約が定める第二のレビューを起動する。対象は、
      コードの差分と、手順 8 の ADR を含む文書の差分である。
    - レビューで確かめる点に、次を含める: 画面の部品 `src/app/_components/even-split-form.tsx` が、`evaluateSplit` の戻り値を分岐を
      持たずにそのまま出していること（値の判定や文言の組み立てを部品の中に持たないこと。判断の記録の 7 の前提）。
    - 指摘を直したら、手順 14 を流し直す。振る舞いに影響する直しをしたら、影響する基準の受け入れ確認を手順 15 でやり直す。
17. コミットし、push し、PR を作る（手順 16 の後。利用者の名指しの指示の後に、まとめ役が行う）。
    - コミットに含めるファイルは、1 つずつ名前で指定する。仕様の 2 ファイル（`docs/product-specs/even-split.md`、
      `docs/product-specs/README.md`）、この計画、受け入れ確認の記録を含める。
    - push の前に `git fetch --prune origin` の後で `bash scripts/harness/check-secrets.sh --commits` を流し、終了コードが 0 である
      ことを確かめる。
    - PR を作ったら、同じ PR の中で、`docs/harness-log.md` の「入れた変更」の列の `feat/split-calculator` を PR の番号に書き換える
      （これも、利用者の指示の後にコミットと push を行う）。
    - PR の CI がすべて成功することを確かめる（V1）。
18. 計画を閉じる（手順 17 の後。計画はマージより前に閉じる）。
    - 状態の表のすべての行が、済・対象外・不合格のどれかであることを
      `~/.agents/skills/exec-plan/scripts/plan-status.sh --require-done <この計画>` で確かめる。
    - 「結果と振り返り」の節を書く。「作業の場所」の節は、そのときのブランチの名前と worktree のディレクトリ名のまま残す。
    - 作業の途中で ADR の中身を変える判断をしていたら、手順 8 の ADR を直す。
    - この計画と受け入れ確認の記録を、同じ変更で `docs/exec-plans/completed/` へ移す。移した後のパスで
      `plan-status.sh --report` を流し、残り 0・不備 0・注意 0 を確かめる。`npm run check:docs` の終了コードが 0 であることを確かめる。
    - 閉じる変更（結果の欄、移動）も実装レビューを受け、利用者の名指しの指示の後に、まとめ役がコミットと push を行う。
      push の後の CI の結果と、マージと worktree の片付けは、まとめ役の最終の報告に書き、計画には書かない。

## 進捗

### 状態の表

| 項目 | 状態 | 根拠 |
|---|---|---|
| SPLIT-1 | 済 | 2026-10-26 に確かめた。`npm run test` で `src/lib/split-display.test.ts` の同じ識別子の試験が通った（全 37 件合格）。`@b4077b2` に未コミットの変更を含めて確かめた |
| SPLIT-2 | 済 | 2026-10-26 に確かめた。`npm run test` で `src/lib/split-display.test.ts` の同じ識別子の試験が通った（全 37 件合格）。`@b4077b2` に未コミットの変更を含めて確かめた |
| SPLIT-3 | 済 | 2026-10-26 に確かめた。`npm run test` で `src/lib/split-display.test.ts` の同じ識別子の試験が通った（全 37 件合格）。`@b4077b2` に未コミットの変更を含めて確かめた |
| SPLIT-4 | 済 | 2026-10-26。app-evaluator の受け入れ確認の記録 `docs/exec-plans/completed/2026-10-26-even-split.acceptance.md` の実行 1 の「基準 SPLIT-4」の行が合格 |
| SPLIT-5 | 済 | 2026-10-26 に確かめた。`npm run test` で `src/lib/split-display.test.ts` の同じ識別子の試験が通った（全 37 件合格）。`@b4077b2` に未コミットの変更を含めて確かめた |
| SPLIT-6 | 済 | 2026-10-26。app-evaluator の受け入れ確認の記録 `docs/exec-plans/completed/2026-10-26-even-split.acceptance.md` の実行 1 の「基準 SPLIT-6」の行が合格 |
| SPLIT-7 | 済 | 2026-10-26 に確かめた。`npm run test` で `src/lib/split-display.test.ts` の同じ識別子の試験が通った（全 37 件合格）。`@b4077b2` に未コミットの変更を含めて確かめた |
| SPLIT-8 | 済 | 2026-10-26 に確かめた。`npm run test` で `src/lib/split-display.test.ts` の同じ識別子の試験が通った（全 37 件合格）。`@b4077b2` に未コミットの変更を含めて確かめた |
| SPLIT-9 | 済 | 2026-10-26。app-evaluator の受け入れ確認の記録 `docs/exec-plans/completed/2026-10-26-even-split.acceptance.md` の実行 1 の「基準 SPLIT-9」の行が合格 |
| SPLIT-10 | 済 | 2026-10-26。app-evaluator の受け入れ確認の記録 `docs/exec-plans/completed/2026-10-26-even-split.acceptance.md` の実行 1 の「基準 SPLIT-10」の行が合格 |
| SPLIT-11 | 済 | 2026-10-26。app-evaluator の受け入れ確認の記録 `docs/exec-plans/completed/2026-10-26-even-split.acceptance.md` の実行 1 の「基準 SPLIT-11」の行が合格（`npm run build` と `npm run start` の後に、サーバーを止めて確かめた） |
| SPLIT-12 | 済 | 2026-10-26。app-evaluator の受け入れ確認の記録 `docs/exec-plans/completed/2026-10-26-even-split.acceptance.md` の実行 1 の「基準 SPLIT-12」の行が合格 |
| SPLIT-13 | 済 | 2026-10-26。app-evaluator の受け入れ確認の記録 `docs/exec-plans/completed/2026-10-26-even-split.acceptance.md` の実行 1 の「基準 SPLIT-13」の行が合格 |
| SPLIT-14 | 済 | 2026-10-26。app-evaluator の受け入れ確認の記録 `docs/exec-plans/completed/2026-10-26-even-split.acceptance.md` の実行 1 の「基準 SPLIT-14」の行が合格 |
| SPLIT-15 | 済 | 2026-10-26。app-evaluator の受け入れ確認の記録 `docs/exec-plans/completed/2026-10-26-even-split.acceptance.md` の実行 1 の「基準 SPLIT-15」の行が合格 |
| SPLIT-16 | 済 | 2026-10-26。app-evaluator の受け入れ確認の記録 `docs/exec-plans/completed/2026-10-26-even-split.acceptance.md` の実行 1 の「基準 SPLIT-16」の行が合格 |
| SPLIT-17 | 済 | 2026-10-26。app-evaluator の受け入れ確認の記録 `docs/exec-plans/completed/2026-10-26-even-split.acceptance.md` の実行 1 の「基準 SPLIT-17」の行が合格 |
| SPLIT-18 | 済 | 2026-10-26 に確かめた。`npm run test` で `src/lib/split-display.test.ts` の同じ識別子の試験が通った（全 37 件合格）。`@b4077b2` に未コミットの変更を含めて確かめた |
| SPLIT-19 | 済 | 2026-10-26 に確かめた。`npm run test` で `src/lib/split-display.test.ts` の同じ識別子の試験が通った（全 37 件合格）。`@b4077b2` に未コミットの変更を含めて確かめた |
| SPLIT-20 | 済 | 2026-10-26 に確かめた。`npm run test` で `src/lib/split-display.test.ts` の同じ識別子の試験が通った（全 37 件合格）。`@b4077b2` に未コミットの変更を含めて確かめた |
| SPLIT-21 | 済 | 2026-10-26 に確かめた。`npm run test` で `src/lib/split-display.test.ts` の同じ識別子の試験が通った（全 37 件合格）。`@b4077b2` に未コミットの変更を含めて確かめた |
| SPLIT-22 | 済 | 2026-10-26 に確かめた。`npm run test` で `src/lib/split-display.test.ts` の同じ識別子の試験が通った（全 37 件合格）。`@b4077b2` に未コミットの変更を含めて確かめた |
| SPLIT-23 | 済 | 2026-10-26 に確かめた。`npm run test` で `src/lib/split-display.test.ts` の同じ識別子の試験が通った（全 37 件合格）。`@b4077b2` に未コミットの変更を含めて確かめた |
| SPLIT-24 | 済 | 2026-10-26 に確かめた。`npm run test` で `src/lib/split-display.test.ts` の同じ識別子の試験が通った（全 37 件合格）。`@b4077b2` に未コミットの変更を含めて確かめた |
| SPLIT-25 | 済 | 2026-10-26 に確かめた。`npm run test` で `src/lib/split-display.test.ts` の同じ識別子の試験が通った（全 37 件合格）。`@b4077b2` に未コミットの変更を含めて確かめた |
| SPLIT-26 | 済 | 2026-10-26 に確かめた。`npm run test` で `src/lib/split-display.test.ts` の同じ識別子の試験が通った（全 37 件合格）。`@b4077b2` に未コミットの変更を含めて確かめた |
| SPLIT-27 | 済 | 2026-10-26 に確かめた。`npm run test` で `src/lib/split-display.test.ts` の同じ識別子の試験が通った（全 37 件合格）。`@b4077b2` に未コミットの変更を含めて確かめた |
| SPLIT-28 | 済 | 2026-10-26 に確かめた。`npm run test` で `src/lib/split-display.test.ts` の同じ識別子の試験が通った（全 37 件合格）。`@b4077b2` に未コミットの変更を含めて確かめた |
| SPLIT-29 | 済 | 2026-10-26 に確かめた。`npm run test` で `src/lib/split-display.test.ts` の同じ識別子の試験が通った（全 37 件合格）。`@b4077b2` に未コミットの変更を含めて確かめた |
| SPLIT-30 | 済 | 2026-10-26。app-evaluator の受け入れ確認の記録 `docs/exec-plans/completed/2026-10-26-even-split.acceptance.md` の実行 1 の「基準 SPLIT-30」の行が合格 |
| V1 | 済 | 2026-10-26。手元の `npm run check`・`npm run lint`・`npm run typecheck` の終了コード 0（手順 14）。PR #2 の CI は、pull_request と push の 2 回の実行で、app-checks・check-docs・check-secrets・scan がすべて pass（まとめ役が `gh pr checks 2` で確かめた。`@452e394`）。mergeable は MERGEABLE、mergeStateStatus は CLEAN |
| V2 | 済 | 2026-10-26 にまとめ役が確かめた。証拠の置き場: 会話の記録の subagents の下のファイル（下の 2026-10-26 の出来事の行） |
| V3 | 済 | 2026-10-26。受け入れ確認の記録（閉じる前の置き場は `docs/exec-plans/active/`）はコミット `@452e394` に含まれ、PR #2 の変更に入っている。記録は 12 の基準ごとの合否と証拠を持つ（まとめ役が記録の 16〜78 行目で確かめた） |
| V4 | 済 | 2026-10-26 に確かめ、実装レビューの後に規則を足して広げて確かめ直した。証拠: 進捗の 2 つの V4 の出来事の行（`npm run check:deps` の出力の要旨。広げた確かめでは 9 つの規則のすべてで 1 件以上の失敗）。`@b4077b2` に未コミットの変更を含めて確かめた |
| 手順 1 | 済 | 2026-10-26。worktree とブランチの組、`git status --short`、Node.js v26.12.1、`npm ci`、変更の前の `npm run check` の終了コード 0 を確かめ、Next.js の説明 4 つを読んだ |
| 手順 2 | 済 | 2026-10-26。`.nvmrc`、`engines`、`@types/node` 24.19.2。`npm run typecheck` の終了コード 0 |
| 手順 3 | 済 | 2026-10-26。vitest 5.0.5、`vitest.config.mts`、`npm run test`、TD-2 の行を消した |
| 手順 4 | 済 | 2026-10-26。計算の層の 2 ファイルと試験 2 ファイル（37 件、すべて合格）。`npm run test`・`npm run typecheck`・`npm run lint` の終了コード 0。試験の対象に `templates/module/example.test.ts` は出なかった |
| 手順 5 | 済 | 2026-10-26。地図の行を足し、早期通知が出た（下の出来事の行） |
| 手順 6 | 済 | 2026-10-26。dependency-cruiser 18.7.0、`.dependency-cruiser.cjs`、`check:deps`。`npm run check:deps`・`npm run lint` の終了コード 0、`npm run check:docs` の失敗は検査 12 の 1 件だけ。V4 を行い、一時のファイルを消した |
| 手順 7 | 済 | 2026-10-26。画面の部品、`page.tsx`、`layout.tsx`。`npm run lint`・`npm run typecheck`・`npm run check:deps` の終了コード 0 |
| 手順 8 | 済 | 2026-10-26。`ARCHITECTURE.md` の 4 か所、ADR 0002〜0004 と目録の行。`npm run check:docs` の失敗は検査 12 の 1 件だけ |
| 手順 9 | 済 | 2026-10-26。`check` の中身と検査のコマンドの表。6 つのコマンドの終了コード 0、`npm run check:docs` の失敗は検査 12 の 1 件だけ |
| 手順 10 | 済 | 2026-10-26。`docs/QUALITY_SCORE.md` の目標の 2 行 |
| 手順 11 | 済 | 2026-10-26。`.claude/skills/run-split-bill/SKILL.md` の 5 か所と `docs/PRODUCT_SENSE.md` の 3 か所 |
| 手順 12 | 済 | 2026-10-26。`.github/workflows/app-checks.yml`、TD-1 を消して TD-4 を足した、`AGENTS.md` の「全部」の行。GitHub の上での実行は未確認（V1 で確かめる） |
| 手順 13 | 済 | 2026-10-26。`docs/harness-log.md` に 2 行。`npm run check:docs` の終了コード 0 |
| 手順 14 | 済 | 2026-10-26。`npm run check`・`npm run lint`・`npm run typecheck` の終了コード 0（`@b4077b2` に未コミットの変更を含めて）。実装レビューの指摘を直した後に流し直し、`npm run build` も含めて終了コード 0（試験 37 件合格）。照合の道具の不備は 0（進捗の出来事の行） |
| 手順 15 | 済 | 2026-10-26。app-evaluator の受け入れ確認の記録 `docs/exec-plans/completed/2026-10-26-even-split.acceptance.md` の実行 1 で、判定に数える 12 の基準（SPLIT-4・6・9〜17・30）がすべて合格、全体が合格。SPLIT-26・29 は基準外の所見として、画面でも仕様どおり |
| 手順 16 | 済 | 2026-10-26。1 段目（実装・設計品質・セキュリティの点検）と 2 段目（Codex）で必須の指摘は無く、推奨と任意の 12 点を直し、その修正を実装の点検で確かめ直して指摘なし（判断の記録の 18〜20） |
| 手順 17 | 済 | 2026-10-26。まとめ役がコミット `452e394` を `feat/split-calculator` に push し、PR #2（題 feat: add even bill split calculator）を作った。push の前の個人情報の走査と `bash scripts/harness/check-secrets.sh --commits` は、どちらも終了コード 0 |
| 手順 18 | 済 | 2026-10-26。結果と振り返りの節を書き、計画と受け入れ確認の記録を `docs/exec-plans/completed/` へ移した（進捗の出来事の行） |

2026-10-26: 計画を起票した。実装の変更はまだ無い。未コミットの変更は、`docs/product-specs/even-split.md`（承認済みの仕様。未追跡）、
`docs/product-specs/README.md`（目録に SPLIT の行を足した）、この計画（未追跡）の 3 つ。

2026-10-26: V2 の証拠。仕様のファイル `docs/product-specs/even-split.md` を Write で書いたとき（2026-10-26T05:45:24Z）に、
PostToolUse:Write のフックの追加の文脈として、早期通知（文書の検査の不合格。仕様が目録に無い）が 1 回出た。まとめ役が、会話の
記録の subagents の下のファイルで確かめた。手順 5 で知らせが出れば、追加の証拠としてここに書き足す。

2026-10-26: 設計レビュー（筋道の点検、設計の品質の点検、別の系統のモデルの第二のレビュー）の統合の結果で計画を直した。直した点:
地図の 3 列目のバッククォート、本番のコードから試験への読み込みを禁じる規則（`no-prod-to-test`）と V4 の確かめ、検査の由来の記録の
行を手順 13 に分けたこと、TD-1 の残りを TD-4 にする扱い、Node.js の版の説明、SPLIT-11 の確かめ方の起動の形、画面の部品の前提と
レビューの点、要素を初めから置くこと、公開の範囲、計算の層の 2 つのファイル、上限の定数、`ARCHITECTURE.md` の依存の決まり、
ADR を手順 8 へ移したこと、比べた案の追加。実装の変更はまだ無い。

2026-10-26: 利用者が 3 つの判断に答えた（判断 1 は案 A、判断 2 は仕様の担当の案のとおり、判断 3 は案 A）。目的の節の判断の項目と
手順 9・11・12・13 の文を答えに合わせて直し、手順 12〜14 の待ちを外した。

2026-10-26: 手順 1〜14 を実装の担当が行った。入れた版: `@types/node` 24.19.2、vitest 5.0.5、dependency-cruiser 18.7.0（どれも計画の
系列の中）。書いた試験は 37 件（`src/lib/split-display.test.ts` が 28 件、`src/lib/split-calc.test.ts` が 9 件）で、すべて合格。
`npm run build` も終了コード 0 で、`/` は静的に生成された。生成された HTML に `lang="ja"`、見出し、2 つの `label`、`aria-live` の要素が
あり、`button` の要素が無いことを確かめた（受け入れ確認の代わりではない）。

2026-10-26: V2 の追加の証拠。手順 5 で `AGENTS.md` の地図に行を足した直後（2026-10-26T07:48Z ごろ。知らせを受けた直後に時刻を
取得した）に、PostToolUse:Edit のフックの追加の文脈として早期通知が出た。知らせの最初の行は「早期通知: 作業ツリー「wt-split-bill-feat」の
文書の検査（npm run check:docs）が不合格です。」で、挙げた失敗は「文書の地図のパス .dependency-cruiser.cjs がありません」の 1 件。
手順 6〜12 の間も、`.md` などを編集するたびに検査 12（検査の由来の記録の行が無い）の早期通知が出た。手順 8 で ADR を書いて目録の行を
足す前には、ADR が目録に無いことも挙げられた。

2026-10-26: V4 を行った。4 つの一時のファイルを置いて `npm run check:deps` を流すと、終了コードは 4 で、出力は
「error no-prod-to-test: src/lib/zz-violation-test.ts → src/lib/split-display.test.ts」「error no-prod-to-test:
src/app/_components/zz-violation-test.tsx → src/lib/split-display.test.ts」「error lib-only-lib: src/lib/zz-violation-react.ts →
node_modules/react/index.js」「error lib-only-lib: src/lib/zz-violation-app.ts → src/app/page.tsx」「x 4 dependency violations (4 errors,
0 warnings)」だった（`lib-only-lib` が 2 件、`no-prod-to-test` が 2 件）。4 つのファイルを消した後は「no dependency violations found」で、
`git status --short` に一時のファイルが残っていないことを確かめた。

2026-10-26: 照合の道具 `plan-status.sh --report` を流し、「済 34 件 / 残り 18 件 / 注意 0 件 / 待ち 1 件 / 不備 0 件」だった。残りは、受け入れ確認（手順 15）、実装レビュー（手順 16）、コミットと PR（手順 17）、
計画を閉じること（手順 18）で、どれもまとめ役が別に起動する。未コミットの変更があるファイル: `package.json`・`package-lock.json`
（engines、スクリプト、依存）、`.nvmrc`、`vitest.config.mts`、`.dependency-cruiser.cjs`、`src/lib/` の 4 ファイル、
`src/app/_components/even-split-form.tsx`、`src/app/page.tsx`、`src/app/layout.tsx`、`ARCHITECTURE.md`、`AGENTS.md`、`docs/adr/` の 3 件と目録、
`docs/QUALITY_SCORE.md`、`docs/PRODUCT_SENSE.md`、`docs/harness-log.md`、`docs/exec-plans/tech-debt-tracker.md`、
`.claude/skills/run-split-bill/SKILL.md`、`.github/workflows/app-checks.yml`、この計画、仕様の 2 ファイル（起票の前からの変更）。

2026-10-26: 実装レビュー（手順 16 の 1 回目。必須の指摘なし）の統合の結果で、12 点を直した（判断の記録の 18〜20）。`engines.node` を
`^24 || >=26` にして `package-lock.json` を npm で更新し、`app-checks.yml` に `package-manager-cache: false` を足した。依存の向きの規則
`app-only-display`・`src-only-known-layers` と、検出の設定 3 つを足した。`ARCHITECTURE.md`・ADR 0002・ADR 0004・`AGENTS.md`・
`docs/QUALITY_SCORE.md`・`docs/harness-log.md`・`.claude/skills/run-split-bill/SKILL.md` の記述を合わせた。`formatYen` を `formatInteger` に
改名した。試験は 37 件のまま、すべて合格。

2026-10-26: V2 の追加の証拠。`ARCHITECTURE.md` を Write で書き直した直後（2026-10-26T08:23Z ごろ）に早期通知が出た。最初の行は
「早期通知: 作業ツリー「wt-split-bill-feat」の文書の検査（npm run check:docs）が不合格です。」で、挙げた失敗は「ARCHITECTURE.md に書いた
パス middleware.ts がありません」の 1 件。例に書いたファイル名をパスとして読まれたので、ファイル名を書かない文に直し、通知は出なくなった。

2026-10-26: V4 を広げて確かめ直した。14 の一時のファイルを置いて `npm run check:deps` を流すと、終了コードは 16 で、違反は 16 件だった。
規則ごとの件数: `lib-only-lib` 6 件（React、`import type` の React、画面の層、`node:fs`、`process.getBuiltinModule` の `fs`、解決できない先）、
`lib-test-only-lib-and-vitest` 1 件（`node:test`）、`app-only-display` 2 件（画面の部品から `split-calc.ts` と試験のファイル）、
`src-only-known-layers` 1 件、`no-prod-to-test` 2 件、`no-circular` 1 件、`src-not-to-templates` 1 件、`templates-not-to-src` 1 件、
`not-to-unresolvable` 1 件。`process.getBuiltinModule` の行は、有効にした検出 `detectProcessBuiltinModuleCalls` が働いた証拠である。
すべての一時のファイルと一時のディレクトリを消した後は「no dependency violations found」（終了コード 0）で、`git status --short
--untracked-files=all` に一時のファイルが残っていないことを確かめた。

2026-10-26: 受け入れ確認（手順 15）の結果。app-evaluator の記録 `docs/exec-plans/completed/2026-10-26-even-split.acceptance.md` の実行 1 で、判定に数える 12 の基準（SPLIT-4・6・9〜17・30。SPLIT-11 は `npm run build` と `npm run start` の後にサーバーを止めて確かめた）がすべて合格、全体が合格で、SPLIT-26・29 も基準外の所見として画面で仕様どおりだった。

2026-10-26: 受け入れ確認の途中で、ブラウザの道具が本体のリポジトリの直下に一時のファイル（`.playwright-mcp/`）を書いた。worktree の中には入っていない。

2026-10-26: 手順 17 と V1・V3 を済にした（まとめ役が PR #2 を作り、CI がすべて pass したことを確かめた）。計画を閉じた: 結果と振り返りの節を
書き、計画と受け入れ確認の記録を `docs/exec-plans/active/` から `docs/exec-plans/completed/` へ移し、記録へのパスを移した後のものに直した。

## 発見

- dependency-cruiser 18.7.0 の包みには `doc/` のディレクトリが無かった。設定の項目の名前（`doNotFollow`・`tsPreCompilationDeps`・
  `tsConfig.fileName`・`pathNot` の配列・`circular`・`couldNotResolve`）は、`node_modules/dependency-cruiser/types/` の型の定義で
  確かめ、計画のとおりで直す所は無かった。
- vitest 5.0.5 の `include` の説明は `node_modules/vitest/dist/chunks/` の中の型の定義にあり、既定は `**/*.{test,spec}.?(c|m)[jt]s?(x)`。
  `include` を指定した設定で、試験の対象が `src/lib/` の 2 ファイルだけになることを `npm run test` の出力で確かめた。
- Next.js 16 の説明（手順 1 の 4 つ）に、学習した知識と食い違う点は見つからなかった。説明の例は `'use client'` を単一引用符で書くが、
  二重引用符でも同じ指示子である（周りのコードに合わせて二重引用符にした）。
- `npm ci` と `npm install` は、手元の npm 11.20.0 で「install scripts not yet covered by allowScripts」の警告を出し、`unrs-resolver` の
  postinstall（と dependency-cruiser を入れた後は `fsevents` の install）を挙げた。この状態で lint・型の検査・依存の向きの検査・試験・
  build はすべて通った。CI の `npm ci --ignore-scripts` で通るかは、GitHub の上ではまだ確かめていない（V1）。

## 判断の記録

1. 層は 2 つにする。画面の層 `src/app/` と計算の層 `src/lib/`。理由: 計算と入力の判定を、React と Next.js なしで単体試験できる
   場所に置くため。画面の部品は 1 つだけなので、別の層にせず、Next.js の非公開のフォルダー `src/app/_components/` に置く
   （経路にならない。`node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md` の「Private folders」）。
2. 計算の層は 2 つのファイルに分ける。`src/lib/split-calc.ts` は判定と計算で、文言を持たずに構造化した値を返す。
   `src/lib/split-display.ts` は文言と書式で、2 つを合わせた表示用の値を返す `evaluateSplit` を持つ。公開の範囲は、画面から使う口
   （`evaluateSplit` と型 `SplitView`）と、試験から使うもの（`parseTotal`・`parsePeople`・`splitEvenly`・`formatInteger`・`formatSplit`・
   2 つの文言・4 つの定数）に分ける（手順 4）。理由: 判定と計算を文言から切り離すと、文言を変えても計算の試験が変わらず、
   画面が持つ判断（どの欄に知らせを出すか、結果を出すか）を `evaluateSplit` に寄せると、画面は戻り値を出すだけになり、18 の基準を
   単体試験で覆えるため。表示の文言と書式を計算の層に置くのは、文言が仕様で 1 字まで決まっていて、単体試験で一致を確かめたいため。
3. 入力の上限と下限は `split-calc.ts` の名前付きの定数にし、知らせの文言はその定数から組み立てる。文言が仕様と 1 字も違わない
   ことを試験でも確かめる。理由: 上限を変えたときに、判定と文言の片方だけが変わることを防ぐため。
4. 依存の向きの検査は dependency-cruiser 18 系だけで行い、設定は根の `.dependency-cruiser.cjs` に置き、地図の「検査（依存の向き）」の
   行に載せる。理由: 「計算の層は計算の層の中だけを読み込む」を、許す先を書く 1 つの規則（`to.pathNot`）で表せて、Next.js・React・
   ほかの包み・Node.js の組み込みのモジュールの読み込みを、並べ漏れなく禁じられる。`tsPreCompilationDeps: true` で、型だけの
   読み込みも禁じる。地図の行に載せるのは、文書の検査の検査 12 と早期通知が「検査を定めるファイル」と見なすのが、地図の
   1 列目が「検査」か「検査（」で始まる行のパスだけだからである（`scripts/harness/check-docs.sh` の 88〜89 行目、
   `scripts/harness/notify.sh` の冒頭の注釈の「流れ」の 3）。`checks.d/` は文書の検査が実行する `*.sh` の置き場で、道具の設定の
   置き場ではない（`scripts/harness/checks.d/README.md`）。ESLint の規則で行う案と、役割を分ける案と比べた結果は、目的の節の
   「選択肢を絞る前の確かめ」。本番のコードから試験のファイルへの読み込みも `no-prod-to-test` で禁じる。理由: 画面の部品や計算の層の
   本番のコードが試験を読み込むと、試験の道具の API が本番の配布物に入り、`lib-only-lib` は計算の層の中の試験への読み込みを許して
   しまうため。
5. 依存の検査の対象は `src` と `templates` にする。理由: ひな形が `src/` を読み込まないこと（`templates/module/README.md` の
   「守る決まり」）も機械で確かめるため。
6. Node.js は、24 系を検証の基準（`.nvmrc` は `24`、足す CI は `.nvmrc` を読む）にし、26 系での実行も許す（`engines.node` は `^24 || >=26`、
   `@types/node` は `^24`）。
   - 確かめた事実（2026-10-26 に `https://raw.githubusercontent.com/nodejs/Release/main/schedule.json` を取得して読んだ。予定の
     日付の表で、実際に切り替わったかの発表は確かめていない）: 22 系は 2025-10-21 から保守の段の長期サポートで、終わりは
     2027-04-30。24 系は 2025-10-28 に長期サポートに入り、2026-10-20 から保守の段で、終わりは 2028-04-30。26 系は 2026-05-05 に
     出た最新の版で、長期サポートに入るのは 2026-10-28 の予定、終わりは 2029-04-30 の予定。20 系は 2026-04-30 で終わった。
   - 推測: 2026-10-26 の時点で長期サポート中なのは 22 系と 24 系で、26 系はまだ長期サポートではない（上の予定の表どおりに
     進んでいれば）。
   - 理由: 24 系は、この日の時点で長期サポート中で、終わりまで 1 年半ある。必要な版（Next.js 16.4.3 は 20.9.0 以上、secretlint 13 は
     22.0.0 以上、vitest 5 と dependency-cruiser 18 は 22・24・26 以上。`node_modules` の各 `package.json` と `npm view` で確かめた）を
     すべて満たす。22 系は終わりまで半年で短い。26 系は、この日の時点では長期サポートに入っていない。手元の 26 系での実行は
     `engines` の `^24 || >=26` で許す（`engines` は警告だけで、インストールを止めない）。26 系を検証の基準に上げるかは、26 系が長期サポートに
     入った後の作業で決める。
   - 既存のワークフロー（`harness-secrets.yml`・`drift-scan.yml`）の `node-version: lts/*` は変えない。理由: (1) どちらもひな形から
     敷いたファイルで、変えるとひな形の更新のたびに手で混ぜ直す手間が出て、検査の由来の記録の行も要る。(2) どちらが動かす処理
     （秘匿値の検査、定期の走査の検査の一式）も、`engines` の範囲のどの長期サポートの版でも動く。(3) 2026-10-28 の後は `lts/*` が
     26 系を指す見込みで、定期の走査が 26 系で検査の一式を流すことになり、検証の基準の 24 系（足す CI）とは別の版でも動くことを
     確かめる働きになる。
7. 仕様の基準の確かめ方は、計算と入力の判定で決まる 18 の基準（SPLIT-1〜3、5、7、8、18〜29）を単体試験に、画面の上の振る舞いで
   決まる 12 の基準（SPLIT-4、6、9〜17、30）を app-evaluator の確認にする。理由: 前の 18 の基準は、入力の 2 つの文字列で結果が
   決まり、単体試験で確かめるのが速く、境目の値の漏れも少ない。後の 12 の基準は、入力のたびの変化、再読み込み、通信、知らせの
   位置のように、画面を動かさないと確かめられない。
   - この分け方の前提: 画面の部品は `evaluateSplit` の戻り値の 3 つの文字列を、分岐を持たずにそのまま出し、値の判定や文言の組み立てを
     部品の中に持たない（手順 7）。この前提が崩れると、単体試験が通っても画面の表示が仕様と違いうるので、手順 16 の実装レビューで
     確かめる。知らせを欄のすぐ下に出す作りと、戻り値を画面に出す作りは、後の 12 の基準の中の SPLIT-4・6・30 と SPLIT-9・13 で
     画面の上でも確かめる。全角の数字（SPLIT-26）と前後の空白（SPLIT-29）は、画面の入力欄を通したときの扱いも見るため、手順 15 で
     画面でも操作して基準外の所見に書く。
8. SPLIT-11 は、本番の形（`npm run build` と `npm run start`）で起動した画面で確かめる。app-evaluator の道具に端末の通信を切る操作が
   無いので、入力の前後で通信の一覧に新しい要求が増えないことと、最後にサーバーを止めた後でも結果が出ることの 2 つで代える。
   理由: サーバーを止めれば、画面の外へのどの要求も成り立たず、それでも結果が出ることで、計算がブラウザの中だけで終わることを
   示せるため。開発の形では、開発用のサーバーとの再接続や開発用の表示が混ざり、通信なしの振る舞いと区別できないので使わない。
   本番の形でも、開発用の表示が出たときと、ページが読み込み直されたときは、未確認とする。
9. 入力の解釈: 前後の空白は `String.prototype.trim` で除く（全角の空白とタブも除く）。空白だけの入力は空として扱う（知らせを
   出さない）。`007` のように先頭に 0 がある値は、半角の数字だけでできた整数なので受け付け、7 として扱う。符号（`+`・`-`）、
   指数の形（`1e3`）、16 進の形（`0x10`）は、半角の数字だけでできていないので誤りにする。理由: 仕様の「数として受け付けるのは、
   半角の数字だけでできた整数で、前後の空白は無視する」の文面に合わせるため。仕様が決めていない細部（全角の空白、空白だけ、
   先頭の 0）は、この文面の読みとして決めた。
10. 金額の桁区切りは `Intl.NumberFormat("ja-JP")` で入れる。理由: ブラウザと Node.js（試験）の両方にある標準の機能で、仕様の
    「1,000」「33,333,333」の形を出せるため。
11. 知らせの 2 つの要素と、`aria-live` の結果の要素は、初めの表示から置き、中の文字列だけを切り替える。理由: `aria-live` の要素が
    後から現れると、支援技術が変化を読み上げないことがあり、要素の出し入れを部品が判断すると、判断の記録の 7 の前提（分岐を持たない）
    にも反するため。
12. 字体（`next/font/google` の Geist）は変えない。理由: Google の字体はアプリと同じ配信の元から配られ、ブラウザは Google に通信しない
    （`node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md` の 96 行目）ので、仕様の「外部の API を使わない」と
    SPLIT-11 に反しないため。
13. TD-1 は、案 A のとき、新しい CI で解消しない残り（PR の CI が `scripts/harness/stack-adapter.test.sh` を流さないこと）を TD-4 として
    足してから TD-1 を消す。理由: 一覧の決まり（解消したら行を消す。1 行に 1 つの問題）に合わせ、解消した部分と残る部分を分けるため。
14. 利用者の 3 つの判断の答え（2026-10-26）: 判断 1 は案 A（CI を足す）、判断 2 は仕様の担当の案のとおり `docs/PRODUCT_SENSE.md` を書く、
    判断 3 は案 A（検査の由来の記録に載せる）。判断 2 の書き換えは、手順 11 にあわせて行った。「作らないもの」のうち、外部の API・保存と履歴・
    ログイン・参加者の名前の 4 つに添えた理由は、実装の担当が仕様の目的と流れから書いた文で、利用者が文面を決めたものではない
    （実装レビューで確かめる）。
15. 画面の部品の中で `null` を空の文字列にするのは `??` で行い、`if` や条件で要素を出し分けない。知らせの 2 つの要素と結果の要素は
    `min-h-*` で高さを確保し、文字列が空でも配置が動かないようにした。`page.tsx` から部品は相対パス（`./_components/even-split-form`）で
    読み込み、部品から計算の層は `@/lib/split-display` で読み込む。
16. `app-checks.yml` は、`harness-secrets.yml` と違い `fetch-depth: 0` を付けない。理由: 履歴を使う処理が無く、既定の 1 つのコミットで足りるため。
17. 手順 4 の「試験から先に書く」は、計算の層の 2 ファイルを先に書き、続けて試験を書いた順になった。試験の中身は仕様の識別子と期待する
    結果から書き、実装から写していない。
18. 実装レビューの後に、依存の向きの検査を強めた。規則 `app-only-display`（画面の層が計算の層から読み込んでよいのは `*-display.ts` だけ）と
    `src-only-known-layers`（`src/` の直下の `app/` と `lib/` のほかの場所のファイルが何かを読み込むと失敗）を足し、検出の設定
    `detectJSDocImports`・`detectImportsInAmbientModules`・`detectProcessBuiltinModuleCalls` を有効にした（3 つとも 18.7.0 の
    `types/options.d.mts` に名前があることを確かめた）。理由: 画面から計算の層の内部の関数を直接使うと、判断の記録の 7 の前提が崩れ、
    `src/` の直下に層の決まっていない場所が増えると、層の規則の外に出るため。検査で拾えないもの（読み込む名前、何も読み込まないファイル、
    計算の層の純粋さ、相対パスの決まり）は `ARCHITECTURE.md` と ADR 0002 に書き、レビューで確かめる。あわせて V4 の確かめを、
    すべての規則の名前に広げた（合意した完了の条件を強める変更で、弱める変更ではない）。
19. `engines.node` は `^24 || >=26` にした（25 系を外した）。理由: vitest 5 と dependency-cruiser 18 が `engines` で 25 系を対象外にして
    いるため。`ARCHITECTURE.md` の画面の層の責務は「値の判定と文言の組み立てを持たず、計算の層の戻り値を出す」に弱め、「分岐を持たない」は
    ADR 0002 の割り勘の部品の判断として残した。`formatYen` は、通貨記号を付けない整数の桁区切りなので `formatInteger` に改名した。
    `app-checks.yml` の `setup-node` には `package-manager-cache: false` を明示した。既存のワークフローの `lts/*` は、ADR 0004 に理由が
    あるので変えない。
20. 新しく入れた依存（vitest 5.0.5、vite 8.3.5、rolldown 1.2.15、dependency-cruiser 18.7.0）は、公開から 5〜11 日と新しい（公開日は
    実装レビューの担当が確かめた。実装の担当は確かめていない）。これを知ったうえで今の版を採る。理由: `package-lock.json` の integrity で
    中身を固定し、CI は `npm ci --ignore-scripts` と読み取りだけの権限（`contents: read`）で動かすので、入れ替わった中身やインストール用の
    スクリプトが入り込む余地が小さいため。

## 結果と振り返り

- 結果: 仕様 `docs/product-specs/even-split.md` の受け入れ基準 SPLIT-1〜SPLIT-30 をすべて満たした。18 の基準は計算の層の単体試験
  （37 件、すべて合格）で、12 の基準は app-evaluator の受け入れ確認（記録の実行 1 で全体が合格）で確かめた。V1〜V4 もすべて済で、
  不合格と対象外の項目は無い。変更はコミット `452e394`（ブランチ `feat/split-calculator`）で、PR #2 の CI はすべて pass した。
- 入れた土台: 画面の層 `src/app/` と計算の層 `src/lib/` の 2 層、依存の向きの検査（dependency-cruiser の 9 つの規則、`npm run check:deps`）、
  試験の道具 vitest、Node.js の 24 系の基準（`.nvmrc`）、PR の CI `app-checks`。残す価値のある設計判断は ADR 0002〜0004 に書いた
  （判断の記録の 18〜20 の変更も、ADR 0002・0004 に反映済み）。
- 振り返り:
  - 依存の向きの検査は、起票の時点の 7 つの規則では、画面から計算の層の内部の関数を直接読み込むことと、`src/` の直下の層の決まって
    いない場所を拾えなかった。実装レビューで 2 つの規則を足し、V4 をすべての規則の名前に広げた。検査を足すときは、規則ごとに失敗する
    例を置いて確かめる形を、起票の時点から完了の条件にしておくのがよい。
  - 早期通知は、地図に未作成のファイルのパスを書いたとき、ADR を目録より先に書いたとき、`ARCHITECTURE.md` に例として書いたファイル名を
    パスとして読まれたときに出た。どれも、その場で文書の検査の失敗に気づけた。
  - 受け入れ確認の途中で、ブラウザの道具が本体のリポジトリの直下に `.playwright-mcp/` を書いた。worktree の外なので変更には入らなかったが、
    次の受け入れ確認でも同じことが起こりうる。
  - `docs/harness-log.md` の「入れた変更」の列は、まだブランチの名前 `feat/split-calculator` のままである。手順 17 の決まりでは、PR を
    作った後に同じ PR の中で番号（#2）に書き換える。
