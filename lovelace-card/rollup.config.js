import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

const dev = process.env.ROLLUP_WATCH === "true";

export default {
  input: "src/led-panel-card.js",
  output: {
    file: "dist/led-panel-card.js",
    format: "es",
    sourcemap: dev,
  },
  plugins: [
    resolve(),
    !dev && terser({ format: { comments: false } }),
  ].filter(Boolean),
};
