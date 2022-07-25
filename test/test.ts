


export default {
    server: {
      baseUrl: 'https://alpha-app.meliopayments.com',
    },
    web: {
      baseUrl: 'https://alpha-app.meliopayments.com',
    },
    sentry: {
      enable: true,
    },
    analytics: {
      shouldTrackEvents: true,
      shouldPrintEvents: true,
      shouldIdentify: true,
    },
    services: {
      intuit: {
        clientId: 'Q0gqJI4IaP8fEpNFaZeDOuw0LBiN7dPuUnbm5AZVYiNtb39Prz',
      },
      errorNotification: {
        isShow: false,
      },
      segment: {
        key: 'ktaEnCSilTDj4NuZ1Ny6rINi0rnZsAK4',
        shouldLoad: true,
      },
      intercom: {
        app_id: 'a44mis4s',
        isShow: true,
      },
      featureFlagProvider: {
        clientId: '608a6c9ebedae00c6063d332',
      },
    },
    quickbooks: {
      baseUrl: 'https://app.sandbox.qbo.intuit.com',
    },
    qbo: {
      web: {
        baseUrl: 'https://alpha-intuit-app.meliopayments.com',
      },
    },
    meliome: {
      baseUrl: 'https://alpha-app.meliopayments.com/meliome/pay/',
    },
    debounceDelay: 10,
    featureFlags: {},
  };
  