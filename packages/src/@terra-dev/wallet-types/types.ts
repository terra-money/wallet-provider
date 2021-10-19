import { CreateTxOptions, PublicKey, StdSignMsg } from '@terra-money/terra.js';

export interface NetworkInfo {
  /** Network name (e.g. mainnet) */
  name: string;

  /** chainID (e.g. columbus-5) */
  chainID: string;

  /** lcd endpoint (e.g. https://lcd.terra.dev) */
  lcd: string;
}

export interface TxResult extends CreateTxOptions {
  result: {
    height: number;
    raw_log: string;
    txhash: string;
  };
  success: boolean;
}

export interface SignResult extends CreateTxOptions {
  result: {
    public_key: PublicKey.Data;
    recid: number;
    signature: string;
    stdSignMsgData: StdSignMsg.Data;
  };
  success: boolean;
}

export interface SignBytesResult {
  encryptedBytes: string;
  result: {
    public_key: PublicKey.Data;
    recid: string;
    signature: string;
  };
  success: boolean;
}
