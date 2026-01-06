import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import * as localHookRules from "./eslint-rules/no-inline-for-verification-hook.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  ...compat.config({ rules: { "no-unused-vars": "off", "@typescript-eslint/no-unused-vars": "off" } }),

  {
    files: ["**/*.{ts,tsx,js,jsx}"], // you can narrow this if desired
    ignores: ["node_modules/**", "dist/**"],

    // In Flat Config, plugins are plain objects (not strings)
    plugins: {
      "local-hooks": localHookRules,
    },

    rules: {
      // Only warn for the specific hook name and arg index
      "local-hooks/no-inline-for-verification-hook": [
        "warn",
        {
          hookName: "useVerifySessionRequirement",
          argIndex: 1, // second argument = requirement object
        },
      ],
    },
  },
];

export default eslintConfig;
