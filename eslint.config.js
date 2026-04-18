import js from "@eslint/js";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": ts,
    },
    rules: {
      ...ts.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      "no-undef": "error",
      "no-restricted-imports": [
        "error",
        {
          "patterns": [
            {
              "group": ["@/features/prescriptions/*", "**/features/prescriptions/*"],
              "message": "Please import from '@/features/prescriptions' instead of deep importing feature internals."
            },
            {
              "group": ["@/features/blood-tests/*", "**/features/blood-tests/*"],
              "message": "Please import from '@/features/blood-tests' instead of deep importing feature internals."
            },
            {
              "group": ["@/features/clinical-intelligence/*", "**/features/clinical-intelligence/*"],
              "message": "Please import from '@/features/clinical-intelligence' instead of deep importing feature internals."
            }
          ]
        }
      ]
    }
  },
  {
    files: ["features/prescriptions/**/*"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          "patterns": [
            {
              "group": ["@/features/blood-tests/*", "**/features/blood-tests/*", "@/features/clinical-intelligence/*", "**/features/clinical-intelligence/*"],
              "message": "Cross-feature deep imports are disallowed."
            }
          ]
        }
      ]
    }
  },
  {
    files: ["features/blood-tests/**/*"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          "patterns": [
            {
              "group": ["@/features/prescriptions/*", "**/features/prescriptions/*", "@/features/clinical-intelligence/*", "**/features/clinical-intelligence/*"],
              "message": "Cross-feature deep imports are disallowed."
            }
          ]
        }
      ]
    }
  },
  {
    files: ["features/clinical-intelligence/**/*"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          "patterns": [
            {
              "group": ["@/features/prescriptions/*", "**/features/prescriptions/*", "@/features/blood-tests/*", "**/features/blood-tests/*"],
              "message": "Cross-feature deep imports are disallowed."
            }
          ]
        }
      ]
    }
  },
  {
    ignores: ["node_modules/", "dist/", ".next/", "public/", "*.sql"]
  }
];
