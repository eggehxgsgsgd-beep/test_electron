// ESLint flat config (ESLint 9)。分三类来源给不同环境与规则:
//   - 主进程 / preload / 脚本 / 配置:Node 环境,TypeScript 推荐规则
//   - renderer:浏览器环境 + React / react-hooks
//   - 测试:沿用所属语言规则(vitest 的 API 在文件内显式 import,无需全局)
// 末尾接 eslint-config-prettier,关掉与 Prettier 冲突的格式类规则——
// 格式交给 Prettier,ESLint 只管代码质量。
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['out/**', 'release/**', 'build/**', 'node_modules/**'] },

  js.configs.recommended,

  // TypeScript 源码(main / preload / shared / 渲染层 .ts / 测试 / 工具)
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [...tseslint.configs.recommended],
  },

  // Node 环境:主进程、preload、构建脚本、根级配置文件
  {
    files: [
      'src/main/**/*.ts',
      'src/preload/**/*.ts',
      'scripts/**/*.{js,mjs,ts}',
      '*.config.{js,ts,mjs}',
      'eslint.config.js',
    ],
    languageOptions: { globals: { ...globals.node } },
  },

  // Renderer:浏览器全局 + React / react-hooks
  {
    files: ['src/renderer/**/*.{js,jsx}'],
    plugins: { react, 'react-hooks': reactHooks },
    languageOptions: {
      // __APP_VERSION__ 由 Vite 的 define 在构建期注入(见 electron.vite.config.ts)
      globals: { ...globals.browser, __APP_VERSION__: 'readonly' },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.flat.recommended.rules,
      'react/react-in-jsx-scope': 'off', // 新 JSX 转换无需把 React 引入作用域
      'react/prop-types': 'off', // 项目不用 prop-types
      'react/no-unescaped-entities': 'off', // 中文文案里的引号无需转义
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn', // 番茄钟引擎刻意手动管理依赖,设为告警而非报错
    },
  },

  prettierConfig,
);
