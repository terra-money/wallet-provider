import ConnectSample from './connect-sample';
import QuerySample from './query-sample';
import SignSample from './sign-sample';
import TxSample from './tx-sample';

export default function Index() {
  return (
    <div>
      <ConnectSample />
      <QuerySample />
      <TxSample />
      <SignSample />
    </div>
  );
}
