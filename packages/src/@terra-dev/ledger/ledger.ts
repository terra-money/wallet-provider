import Transport from '@ledgerhq/hw-transport';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import { WebExtensionLedgerError } from '@terra-dev/web-extension';
import TerraLedgerApp, {
  PublicKeyResponse,
  SignResponse,
} from '@terra-money/ledger-terra-js';
import {
  Key,
  PublicKey,
  StdSignature,
  StdSignMsg,
} from '@terra-money/terra.js';
import { Observable } from 'rxjs';
import { signatureImport } from 'secp256k1';
import { LedgerWalletInfo } from './models/LedgerWalletSession';
import { pickUSBDeviceInfo } from './models/USBDeviceInfo';

export const TERRA_APP_PATH: [number, number, number, number, number] = [
  44, 330, 0, 0, 0,
];
export const TERRA_APP_HRP: string = 'terra';

export function isLedgerSupportBrowser(): boolean {
  return (
    typeof USBDevice !== 'undefined' && typeof navigator.usb !== 'undefined'
  );
}

export function observeConnectedLedgerList(): Observable<USBDevice[]> {
  return new Observable((subscriber) => {
    const devices: USBDevice[] = [];

    const subscription = TransportWebUSB.listen({
      next: ({ type, descriptor }) => {
        if (type === 'add') {
          devices.push(descriptor);
        } else if (type === 'remove') {
          const deviceIndex = devices.findIndex(
            ({ serialNumber, vendorId, productId }) =>
              descriptor.serialNumber === serialNumber ||
              (descriptor.vendorId === vendorId &&
                descriptor.productId === productId),
          );

          devices.splice(deviceIndex, 1);
        }

        subscriber.next([...devices]);
      },
      error: (error) => {
        console.error(error);
      },
      complete: () => {},
    });

    return () => {
      subscription.unsubscribe();
      subscriber.unsubscribe();
    };
  });
}

export async function getConnectedLedgerList(): Promise<USBDevice[]> {
  return TransportWebUSB.list();
}

export async function createTransport(): Promise<Transport> {
  const transport = await TransportWebUSB.create();

  if (transport) {
    return transport;
  } else {
    throw new WebExtensionLedgerError(
      99999,
      `Failed to create instance of TransportWebUSB`,
    );
  }
}

export async function connectLedger(): Promise<LedgerWalletInfo | undefined> {
  const transport = await createTransport();
  const app = new TerraLedgerApp(transport);

  await app.initialize();

  if (!(transport instanceof TransportWebUSB)) {
    throw new WebExtensionLedgerError(
      99999,
      `transport is not a TransportWebUSB instance`,
    );
  }

  const publicKey: PublicKeyResponse = await app.getAddressAndPubKey(
    TERRA_APP_PATH,
    TERRA_APP_HRP,
  );

  if ('bech32_address' in publicKey) {
    const usbDevice = pickUSBDeviceInfo(transport.device);

    const wallet: LedgerWalletInfo = {
      terraAddress: publicKey.bech32_address,
      usbDevice,
    };

    await transport.close();

    return wallet;
  }

  throw new WebExtensionLedgerError(
    publicKey.return_code,
    publicKey.error_message,
  );
}

export type LedgerKeyResponse = { key: LedgerKey; close: () => void };

export async function createLedgerKey(): Promise<LedgerKeyResponse> {
  const transport = await createTransport();
  const app = new TerraLedgerApp(transport);

  await app.initialize();

  const publicKey: PublicKeyResponse = await app.getAddressAndPubKey(
    TERRA_APP_PATH,
    TERRA_APP_HRP,
  );

  if ('compressed_pk' in publicKey) {
    const publicKeyBuffer = Buffer.from(publicKey.compressed_pk as any);

    const key = new LedgerKey(publicKeyBuffer, app);

    return {
      key,
      close: () => {
        try {
          transport.close();
        } catch {}
      },
    };
  }

  throw new WebExtensionLedgerError(
    publicKey.return_code,
    publicKey.error_message,
  );
}

export class LedgerKey extends Key {
  constructor(publicKey: Buffer | undefined, private app: TerraLedgerApp) {
    super(publicKey);
  }

  sign(payload: Buffer): Promise<Buffer> {
    throw new Error('Not implemented');
  }

  createSignature = async (tx: StdSignMsg): Promise<StdSignature> => {
    const publicKeyBuffer = this.publicKey;

    if (!publicKeyBuffer) {
      throw new WebExtensionLedgerError(
        99999,
        `This LedgerKey does not have publicKeyBuffer`,
      );
    }

    const serializedTx = tx.toJSON();

    const signature: SignResponse = await this.app.sign(
      TERRA_APP_PATH,
      serializedTx,
    );

    if (!('signature' in signature)) {
      throw new WebExtensionLedgerError(
        signature.return_code,
        signature.error_message,
      );
    }

    if (!signature.signature || !signature.signature.data) {
      throw new WebExtensionLedgerError(
        99999,
        `The result of TerraApp.sign() does not contain SignResponse.data`,
      );
    }

    const signatureBuffer = Buffer.from(
      signatureImport(Buffer.from(signature.signature.data)),
    );

    if (!signatureBuffer) {
      throw new WebExtensionLedgerError(
        99999,
        `Failed to make Buffer from the result of TerraApp.sign()`,
      );
    }

    return new StdSignature(
      signatureBuffer.toString('base64'),
      PublicKey.fromData({
        type: 'tendermint/PubKeySecp256k1',
        value: publicKeyBuffer.toString('base64'),
      }),
    );
  };
}
