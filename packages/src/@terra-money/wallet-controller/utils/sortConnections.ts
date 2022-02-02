import { Connection } from '@terra-money/wallet-types';

export function sortConnections(connections: Connection[]): Connection[] {
  const stationIndex = connections.findIndex(
    ({ identifier }) => identifier === 'station',
  );

  if (stationIndex > -1) {
    const station = connections.splice(stationIndex, 1);
    return [...station, ...connections];
  }

  return connections;
}
