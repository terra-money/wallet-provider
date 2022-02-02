import { SignBytesResult } from '@terra-money/wallet-types';
import jscrypto from 'jscrypto';
import secp256k1 from 'secp256k1';

export function verifyBytes(
  bytes: Buffer,
  signBytesResult: SignBytesResult['result'],
): boolean {
  const publicKey = signBytesResult.public_key?.toProto();

  if (publicKey && 'key' in publicKey) {
    return secp256k1.ecdsaVerify(
      signBytesResult.signature,
      Buffer.from(
        jscrypto.SHA256.hash(new jscrypto.Word32Array(bytes)).toString(),
        'hex',
      ),
      publicKey.key,
    );
  }

  return false;
}
