// 層の間の依存の規則（ARCHITECTURE.md の「依存の向き」）。npm run check:deps が、この規則に反する依存を失敗にする。
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "lib-only-lib",
      comment:
        "計算の層（試験を除く）は、計算の層の中だけを読み込む。画面の層、Next.js、React、ほかの包み、Node.js の組み込みのモジュールを読み込まない",
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
      name: "app-only-display",
      comment:
        "画面の層が計算の層から読み込んでよいのは、表示用のファイル（src/lib/ の *-display.ts）だけ。読み込む名前（evaluateSplit と型 SplitView）までは確かめない",
      severity: "error",
      from: { path: "^src/app/" },
      to: { path: "^src/lib/", pathNot: "-display\\.ts$" },
    },
    {
      name: "src-only-known-layers",
      comment:
        "src の直下に置くのは app/ と lib/ だけ。それ以外の場所の src のファイルの読み込みを失敗にする（何も読み込まないファイルは拾えない）",
      severity: "error",
      from: { path: "^src/", pathNot: "^src/(app|lib)/" },
      to: {},
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
    // JSDoc の import、ambient module の中の import、process.getBuiltinModule の呼び出しも依存として数える
    detectJSDocImports: true,
    detectImportsInAmbientModules: true,
    detectProcessBuiltinModuleCalls: true,
    tsConfig: { fileName: "tsconfig.json" },
  },
};
