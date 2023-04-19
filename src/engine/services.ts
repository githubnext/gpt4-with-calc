//import { DataStore } from "../engine/datastore";
import { Fetcher } from "../engine/fetcher";
//import { KeyVault } from "../engine/keys";
//import { LeaseManager } from "../engine/lease_manager";
//import { getRefreshingSlurDetectorSingleton, RefreshingSlurDetector } from "../util/slur";

export class Services {
  constructor(
    //readonly keyVault: KeyVault,
    //readonly dataStore: DataStore,
    readonly fetcher: Fetcher //readonly leaseManager: LeaseManager, //readonly slurFilter: RefreshingSlurDetector | undefined
  ) {}

  static async create() {
    // const keyVault = new KeyVault(
    //   serviceState,
    //   process.env.VAULT_URL || "https://copilot4prs-dev-keyvault.vault.azure.net/"
    // );
    // const dataStore = await DataStore.create(keyVault, serviceState, options?.botName);
    const fetcher = await Fetcher.create();
    // const leaseManager = await LeaseManager.create(keyVault, serviceState);
    // const slurFilter =
    //   serviceState == "enabled" || options?.forceSlurDetection
    //     ? await getRefreshingSlurDetectorSingleton(keyVault)
    //     : undefined;

    return new Services(fetcher);
    //return new Services(keyVault, dataStore, fetcher, leaseManager, slurFilter);
  }
}
