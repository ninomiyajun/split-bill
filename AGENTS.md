<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

ハーネスの版: 1

この行は、このプロジェクトにハーネス（規約と検査の一式）を導入済みであることを示す印である。
`scripts/harness/check-docs.sh` が、この版で必須のファイルが揃っているかを確かめる。印の書式（「ハーネスの版: 」に
整数を続けた 1 行）は、ハーネスの規約が定めたものに合わせている。版の数は、必須のファイルが増えるときに上げ、
同じ変更で設定のファイル `scripts/harness/harness.conf` に、その版の `required.<版>=<パス>` の行を足す。
`scripts/harness/` の検査の本体（冒頭に `harness-copy` の行があるファイル）は規約の正本の写しなので、手で変えない。
このプロジェクトだけの検査は `scripts/harness/checks.d/` に足す（決まりは同じ置き場の `README.md`）。

## 秘匿値と個人情報（必須）

- 秘匿値（API の鍵、トークン、Cookie、パスワード）をリポジトリのファイルに書かない。
- `.env` で始まるファイルは `.gitignore` で除外する。例外は、変数の名前だけを書く `.env.example` だけで、値は書かない。
- コミットするファイルに個人情報（アカウント名、姓名、メールアドレス）とホームの絶対パスを書かない。パスは `~/...` か
  プレースホルダーで書く。
- push の前に、`git fetch --prune origin` の後で `bash scripts/harness/check-secrets.sh --commits` を通す。手元のすべてのブランチと
  タグから辿れて、push 先のリモートの追跡ブランチから辿れないコミット（初回の push ではすべてのコミット）に記録された中身と
  コミットメッセージ、手元のすべての注釈付きのタグの注釈を調べる。push 先が `origin` でなければ `--remote <名前>` を足す。
  作業ツリーだけを調べる `npm run check:secrets` では、途中のコミットに入れて後で消した値を見落とすためである。
- 秘匿値の検査を弱めない。`.secretlintignore` のファイルと secretlint の無効化のコメントは、検査が失敗にする。
  誤検出は `.secretlintrc.json` の設定で直し、理由を設計判断の記録に書く。

## 検査のコマンド

| 何を確かめるか | コマンド |
|---|---|
| 全部（手元で流す。PR の CI で、失敗すると PR が失敗になるのは、文書の検査、秘匿値の検査、検査の試験のうち 3 本だけで、lint と型の検査は PR の合否に含まれない。定期の走査は対象のパスを変える PR で lint と型も流すが、失敗を報告に残すだけで PR を失敗にしない） | `npm run check` |
| lint | `npm run lint` |
| 型 | `npm run typecheck` |
| 試験 | なし |
| 文書（必須のファイル、CLAUDE.md、地図、リンク、目録、行数、ARCHITECTURE.md に書いたパス、計画の必須の節、受け入れ確認の記録、製品の仕様の目録と状態、古い計画、検査の由来の記録、写しの中身） | `npm run check:docs` |
| 検査の試験（`check-docs.sh` の検査と設定と追加の検査の口、早期通知 `notify.sh`、定期の走査 `drift-scan.sh`、段の読み取り `stack-adapter.sh` の 4 本の試験） | `npm run test:harness` |
| 秘匿値（作業ツリーの、コミットする全ファイル） | `npm run check:secrets` |
| 秘匿値（push する範囲の各コミットの中身） | `bash scripts/harness/check-secrets.sh --commits` |

リンクの検査が見るのは、インラインのリンクと画像（角括弧の文字の直後に、丸括弧で囲んだ先を続ける形）で、先に空白も
`)` も含まないものだけである。参照形式のリンク、山括弧で囲んだ先、タイトル付きの先、自動リンク、HTML の a 要素は検査しないので、
文書の中のリンクはインラインの形で書く。

## 文書の地図

| 種類 | パス | 読む条件 |
|---|---|---|
| 設計の正本（層、依存の向き、不変条件） | `ARCHITECTURE.md` | コードを変える前 |
| 設計判断の記録 | `docs/adr/README.md` | 設計を変える前、過去の判断の理由を知りたいとき |
| 製品の前提 | `docs/PRODUCT_SENSE.md` | 新しい機能や画面を考えるとき |
| 製品の仕様（書式と目録） | `docs/product-specs/README.md` | 新しい機能や画面の仕様を書くとき、仕様を引く計画を書くとき・確かめるとき |
| 計画の書式 | `docs/PLANS.md` | 計画を書くとき、計画を読むとき |
| アプリの起動の手順 | `.claude/skills/run-split-bill/SKILL.md` | アプリを起動して画面を確かめるとき（受け入れ確認を含む） |
| 進行中の計画 | `docs/exec-plans/active/` | 作業を再開するとき |
| 完了した計画 | `docs/exec-plans/completed/` | 過去の作業の経緯を知りたいとき |
| 技術的負債の一覧 | `docs/exec-plans/tech-debt-tracker.md` | 作業の範囲外の問題を見つけたとき、文書を点検するとき |
| 検査の由来の記録 | `docs/harness-log.md` | 指摘を検査にするとき、検査の理由を知りたいとき |
| 品質目標 | `docs/QUALITY_SCORE.md` | 設計の品質を判断するとき |
| 検査 | `scripts/harness/` | 検査を足すか変えるとき（本体は写しなので手で変えない。専用の検査は同じ置き場の checks.d に置く） |
| 検査（CI の設定） | `.github/workflows/` | CI の検査を足すか変えるとき |
| モジュールのひな形 | `templates/module/` | 新しいモジュールを足すとき |
| 検査（定期の走査） | `.github/workflows/drift-scan.yml` | 定期の走査（`scripts/harness/drift-scan.sh`）を変えるとき。段の読み取りは `scripts/harness/stack-adapter.sh` |

## 落とし穴

- Claude Code は、`CLAUDE.md` があるとこのファイルを自分からは読まない。そのため `CLAUDE.md` に `@AGENTS.md` だけの行を
  置いている。この行を消さず、指示はこのファイルに書く（`npm run check:docs` が、`@AGENTS.md` だけの行があることを確かめる）。
