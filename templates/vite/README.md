# This template is

This is an example of performing basic Connect, Tx, and Query in the Web App using [wallet-provider](https://www.npmjs.com/package/@terra-money/wallet-provider).

# Preview this template on the CodeSandbox

<https://githubbox.com/terra-money/wallet-provider/tree/main/templates/vite>

# How to use this template

```sh
npx terra-templates get wallet-provider:vite your-app-name
cd your-app-name
npm install
npm start
```

# ⚠️ Please note

Vite.js provides more overwhelming Build / HMR speeds than Webpack (and tools such as CRA based on Webpack).

However, many libraries in block-chain, including terra.js, rely on webpack's node polyfill, which will create many self-solving problems in your development based on Vite.js.

This template provides basic polyfill settings for using terra.js. However, it will not be perfect and some problems may require a great deal of cost and effort to solve.