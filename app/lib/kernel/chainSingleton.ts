import { LocalStorageChainRepository } from "./ChainStorage";
import { PaymentChainStore } from "../payments/PaymentChainStore";
import { STORAGE_KEY } from "./constants";

// Singleton — única cadena integrada para pagos, inscripciones y certificados
export const chainStore = new PaymentChainStore(new LocalStorageChainRepository(STORAGE_KEY));
