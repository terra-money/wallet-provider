import {
  ExtensionOptions,
  Fee,
  Msg,
  PublicKey,
  Tx,
} from '@terra-money/terra.js';
import {
  WebExtensionCreateTxFailed,
  WebExtensionTxFailed,
  WebExtensionTxUnspecifiedError,
} from '../errors';

export enum WebExtensionTxStatus {
  PROGRESS = 'PROGRESS',
  SUCCEED = 'SUCCEED',
  FAIL = 'FAIL',
  DENIED = 'DENIED',
}

export interface WebExtensionTxProgress {
  status: WebExtensionTxStatus.PROGRESS;
  payload?: unknown;
}

export interface WebExtensionPostPayload {
  height: number;
  raw_log: string;
  txhash: string;
}

export type WebExtensionSignPayload = Tx.Data;

export interface WebExtensionSignBytesPayload {
  recid: number;

  /**
   * base64 Uint8Array
   *
   * @example
   * ```
   * // stringified by
   * Buffer.from(Uint8Array).toString('base64')
   *
   * // to Uint8Array
   * Uint8Array.from(Buffer.from(base64String, 'base64'))
   * ```
   */
  signature: string;

  /**
   * @example
   * ```
   * PublicKey.fromData(public_key)
   * ```
   */
  public_key?: PublicKey.Data;
}

export interface WebExtensionTxSucceed<Payload> {
  status: WebExtensionTxStatus.SUCCEED;
  payload: Payload;
}

export interface WebExtensionTxFail {
  status: WebExtensionTxStatus.FAIL;
  error:
    | WebExtensionCreateTxFailed
    | WebExtensionTxFailed
    | WebExtensionTxUnspecifiedError;
}

export interface WebExtensionTxDenied {
  status: WebExtensionTxStatus.DENIED;
}

export type WebExtensionTxResult<Payload> =
  | WebExtensionTxProgress
  | WebExtensionTxSucceed<Payload>
  | WebExtensionTxFail
  | WebExtensionTxDenied;

// ---------------------------------------------
// functions
// ---------------------------------------------
export interface SerializedCreateTxOptions
  extends Omit<ExtensionOptions, 'msgs' | 'fee'> {
  msgs: string[];
  fee: string | undefined;
}

export function serializeTx(tx: ExtensionOptions): SerializedCreateTxOptions {
  return {
    msgs: tx.msgs.map((msg) => msg.toJSON(tx.isClassic)),
    fee: tx.fee?.toJSON(tx.isClassic),
    memo: tx.memo,
    gasPrices: tx.gasPrices?.toString(),
    gasAdjustment: tx.gasAdjustment?.toString(),
    feeDenoms: tx.feeDenoms,
  };
}

export function deserializeTx(tx: SerializedCreateTxOptions): ExtensionOptions {
  const msgs = tx.msgs.map((msg) => JSON.parse(msg));
  const isProto = '@type' in msgs[0];

  return {
    ...tx,
    msgs: msgs.map((msg) => (isProto ? Msg.fromData(msg, tx.isClassic) : Msg.fromAmino(msg, tx.isClassic))),
    fee: tx.fee
      ? isProto
        ? Fee.fromData(JSON.parse(tx.fee))
        : Fee.fromAmino(JSON.parse(tx.fee))
      : undefined,
  };
}
