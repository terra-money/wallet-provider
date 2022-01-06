module.exports = {
  extends: [
    require.resolve('eslint-config-react-app'),
    require.resolve('eslint-config-react-app/jest'),
    require.resolve('eslint-config-prettier'),
  ],
  
  overrides: [
    {
      files: ['**/*.ts?(x)'],
      rules: {
        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': ['warn'],
      },
    },
    {
      files: ['**/*.stories.{js,jsx,ts,tsx}'],
      rules: {
        'import/no-anonymous-default-export': 'off',
        'react-hooks/rules-of-hooks': 'off',
      },
    },
  ],
  
  //rules: {
  //  'react-hooks/exhaustive-deps': [
  //    'warn',
  //    {
  //      additionalHooks: '(useCustomHook)',
  //    },
  //  ],
  //},
};
