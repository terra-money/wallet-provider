export class LedgerWalletUserDenied extends Error {}

export class LedgerWalletCreateTxFailed extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LedgerWalletCreateTxFailed';
  }
}

export class LedgerWalletTxFailed extends Error {
  constructor(
    public readonly txhash: string,
    message: string,
    public readonly raw_message: any,
  ) {
    super(message);
    this.name = 'LedgerWalletTxFailed';
  }
}

export class LedgerWalletTimeout extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LedgerWalletTimeout';
  }
}

export class LedgerWalletUnspecifiedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LedgerWalletUnspecifiedError';
  }
}
