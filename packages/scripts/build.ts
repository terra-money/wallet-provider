import path from 'path';
import { build } from 'rocket-punch';
import packages from '../.packages.json';

const { $schema, ...entry } = packages;

export const cwd = path.resolve(__dirname, '..');

build({
  cwd,
  entry: { ...entry },
  transformPackageJson: (packageName) => (computedPackageJson) => {
    const {
      dependencies = {},
      peerDependencies = {},
      peerDependenciesMeta = {},
    } = computedPackageJson;

    if ('react' in dependencies) {
      delete dependencies['react'];
      peerDependencies['react'] = '>=17.0.0';
    }

    if ('react-dom' in dependencies) {
      delete dependencies['react-dom'];
      peerDependencies['react-dom'] = '>=17.0.0';
    }

    if ('react-router-dom' in dependencies) {
      delete dependencies['react-router-dom'];
      peerDependencies['react-router-dom'] = '>=5.0.0';
    }
    
    if ('styled-components' in dependencies) {
      delete dependencies['styled-components'];
      peerDependencies['styled-components'] = '>=5.0.0';
    }
    
    if ('rxjs' in dependencies) {
      dependencies['rxjs'] = '^7.0.0';
    }
    
    if ('@terra-money/terra.js' in dependencies) {
      delete dependencies['@terra-money/terra.js'];
      peerDependencies['@terra-money/terra.js'] = '^3.0.0';
    }

    //switch (packageName) {
    //  case '@terra-dev/is-mobile':
    //  case '@terra-dev/sendinblue':
    //    peerDependenciesMeta['react'] = {
    //      optional: true,
    //    };
    //    break;
    //}

    //switch (packageName) {
    //  case '@terra-money/wallet-provider':
    //    peerDependenciesMeta['react-router-dom'] = {
    //      optional: true,
    //    };
    //    break;
    //}

    //[
    //  '@terra-money/wallet-provider',
    //  '@terra-money/webapp-provider',
    //  '@anchor-protocol/webapp-provider',
    //  '@terra-dev/use-browser-inactive',
    //].forEach((dependencyName) => {
    //  if (dependencyName in dependencies) {
    //    const version = dependencies[dependencyName];
    //    delete dependencies[dependencyName];
    //    peerDependencies[dependencyName] = version;
    //  }
    //});

    computedPackageJson.dependencies =
      Object.keys(dependencies).length > 0 ? dependencies : undefined;

    computedPackageJson.peerDependencies =
      Object.keys(peerDependencies).length > 0 ? peerDependencies : undefined;

    computedPackageJson.peerDependenciesMeta =
      Object.keys(peerDependenciesMeta).length > 0
        ? peerDependenciesMeta
        : undefined;

    return computedPackageJson;
  },
});
