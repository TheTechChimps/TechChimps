import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [".next/**", ".netlify/**", "node_modules/**", "next-env.d.ts"]
  },
  ...nextVitals,
  ...nextTypescript
];

export default eslintConfig;
