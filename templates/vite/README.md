# How to use this template

```sh
npx copy-github-directory https://github.com/terra-money/wallet-provider/tree/main/templates/vite your-app-name
cd your-app-name
yarn install
yarn start
```

Or if you want to start development based on yarn (2.0) workspaces,

```sh
npx copy-github-directory workspace your-workspace-name
cd your-workspace-name
npx copy-github-directory https://github.com/terra-money/wallet-provider/tree/main/templates/vite your-app-name
yarn install
cd your-app-name
yarn start
```

# ⚠️ Please note

Vite.js provides more overwhelming Build / HMR speeds than Webpack (and tools such as CRA based on Webpack).

However, many libraries in block-chain, including terra.js, rely on webpack's node polyfill, which will create many self-solving problems in your development based on Vite.js.

This template provides basic polyfill settings for using terra.js. However, it will not be perfect and some problems may require a great deal of cost and effort to solve.