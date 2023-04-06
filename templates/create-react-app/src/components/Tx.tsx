   import { Fee, MsgSend, TxResult } from '@terra-money/feather.js';
   import {
     useConnectedWallet,
     UserDenied,
   } from '@terra-money/wallet-provider';
   import React, { useCallback, useState } from 'react';

   const TEST_TO_ADDRESS = 'terra12hnhh5vtyg5juqnzm43970nh4fw42pt27nw9g9';

   export default function Tx() {
    const [txResult, setTxResult] = useState<TxResult | null>(null);
    const [txError, setTxError] = useState<string | null>(null);
    
     const connectedWallet = useConnectedWallet();
     const chainID = 'phoenix-1';

     const testTx = useCallback(async () => {
       if (!connectedWallet) {
         return;
       }

       const isMainnet = Object.keys(connectedWallet.network).some((key) =>
         key.startsWith('phoenix-'),
       );

       if (isMainnet) {
         alert(`Please only execute this example on Testnet`);
         return;
       }

       try {
         const transactionMsg = {
           fee: new Fee(1000000, '20000uluna'),
           chainID,
           msgs: [
             new MsgSend(connectedWallet.addresses[chainID], TEST_TO_ADDRESS, {
               uluna: 1000000, // parse baseAsset from network object and use here (e.g.`[baseAsset]`)
             }),
           ],
         };

         const tx = await connectedWallet.post(transactionMsg);
         // @ts-ignore
         setTxResult(tx);
       } catch (error) {
         if (error instanceof UserDenied) {
           setTxError('User Denied');
         } else {
           setTxError(
             'Unknown Error: ' +
               (error instanceof Error ? error.message : String(error)),
           );
         }
       }
     }, [connectedWallet]);

     return (
       <>
         {connectedWallet?.availablePost && !txResult && !txError && (
           <button onClick={testTx}>Send 1USD to {TEST_TO_ADDRESS}</button>
         )}

         {txResult && <>{JSON.stringify(txResult, null, 2)}</>}
         {txError && <pre>{txError}</pre>}

         {connectedWallet && !connectedWallet.availablePost && (
           <p>This connection does not support post()</p>
         )}
       </>
     );
   }