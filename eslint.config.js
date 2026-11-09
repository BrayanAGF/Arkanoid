// Configuración de ESLint (solo herramienta de desarrollo; el juego no tiene dependencias).
// Ejecutar con: npx eslint@9 .
export default [
  {
    files: [ '**/*.js' ],
    ignores: [ 'eslint.config.js' ],
    languageOptions: {
      ecmaVersion: 'latest',
      // Scripts clásicos que comparten globales entre archivos.
      sourceType: 'script',
    },
    rules: {
      // Errores reales
      'no-dupe-keys': 'error',
      'no-unreachable': 'error',
      'no-redeclare': 'error',
      'no-const-assign': 'error',
      'no-self-compare': 'error',
      'eqeqeq': [ 'error', 'always' ],
      'prefer-const': 'warn',
      'no-var': 'error',
      // Estilo del proyecto (ver CLAUDE.md)
      'indent': [ 'warn', 2 ],
      'quotes': [ 'warn', 'single' ],
      'semi': [ 'warn', 'always' ],
      'space-in-parens': [ 'warn', 'always' ],
      'array-bracket-spacing': [ 'warn', 'always' ],
      'computed-property-spacing': [ 'warn', 'always' ],
    },
  },
];
