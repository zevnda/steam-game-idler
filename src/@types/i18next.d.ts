import { ns, defaultNS } from '@/shared/config';

import translation from '../shared/config/i18n/locales/en-US/translation.json';

const resources = {
  translation,
};

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: typeof resources;
    ns: typeof ns;
    defaultNS: typeof defaultNS;
  }
}
