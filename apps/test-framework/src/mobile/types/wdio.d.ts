import { BackendProvider } from '../../core/backend-provider';

declare global {
    namespace WebdriverIO {
        interface Browser {
            backend: BackendProvider;
        }
    }
}