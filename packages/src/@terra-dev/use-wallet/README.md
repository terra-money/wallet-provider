# `@terra-dev/use-wallet`

Core interface of [`@terra-money/wallet-provider`](https://www.npmjs.com/package/@terra-money/wallet-provider).

If you want to create a library using the `useWallet()` of `@terra-money/wallet-provider`, you can use
this `@terra-dev/use-wallet` instead of `@terra-money/wallet-provider` for its internal dependence.

Because `@terra-money/wallet-provider` contains multiple implementations, if your library is built
on `@terra-money/wallet-provider`, problems can arise in exceptional situations (e.g. when users implement and use
Context themselves).

Using `@terra-dev/use-wallet` instead of `@terra-money/wallet-provider` can make your library work reliably in a more
diverse set of implementations.

You don't have to use this Library if you're just creating a WebApp. Use `@terra-money/wallet-provider`.

# APIs

- `useWallet()`
- `useConnectedWallet()`
- `enum WalletStatus`
- `enum ConnectType`
- `type WalletInfo`
- `type WalletStates`
