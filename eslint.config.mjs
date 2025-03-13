import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const eslintConfig = [
    js.configs.recommended,
    ...compat.extends("next/core-web-vitals", "next/typescript"),
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
        },
        rules: {
            "strict": ["error"],
            "no-unused-vars": ["error"],
            "no-undef": ["error"],
            "no-unused-expressions": ["error"],
            "no-multiple-empty-lines": ["warn"],
            "quotes": ["warn", "single"],
            "semi": ["warn", "always"],
            "no-unreachable": ["error"],
            "no-sync": ["warn"],
            "react-hooks/exhaustive-deps": ["off"]
        }
    }
];

export default eslintConfig;