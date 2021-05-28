const repositories = {
  customersApi: {
    name: 'CustomersApi',
    tagName: 'customers-api',
    port: 3000,
    source: {
      github: {
        name: 'customers-api',
        owner: 'Razielini',
        branch: 'main',
      },
    },
    tags: {
      product: 'skyalert:product',
      environment: 'skyalert:environment',
      account: 'skyalert:account',
      domain: 'skyalert:domain',
      stack: 'skyalert:stack',
      owner: 'skyalert:owner',
    }
  },
  subscriptionsApi: {
    name: 'SubscriptionsApi',
    tagName: 'subscriptions-api',
    port: 3000,
    source: {
      github: {
        name: 'subscriptions-api',
        owner: 'Razielini',
        branch: 'main',
      },
    },
    tags: {
      product: 'skyalert:product',
      environment: 'skyalert:environment',
      account: 'skyalert:account',
      domain: 'skyalert:domain',
      stack: 'skyalert:stack',
      owner: 'skyalert:owner',
    }
  }
}
export default {
  ...repositories
}
