import { runConnectSample } from 'components/connect-sample';
import { runQuerySample } from 'components/query-sample';
import { runTxSample } from 'components/tx-sample';
import { initController } from 'controller';

initController().then(() => {
  runConnectSample();
  runQuerySample();
  runTxSample();
});
