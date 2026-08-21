import esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  sourcemap: false,
  platform: "node",
  target: "node22",
  format: "esm",
  outfile: "dist/index.mjs",
  mainFields: ["module", "main"],
  external: ["@aws-sdk/*"],
});
