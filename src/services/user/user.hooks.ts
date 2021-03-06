import * as authentication from '@feathersjs/authentication'
import addAssociations from '../../hooks/add-associations'
import { HookContext } from '@feathersjs/feathers'

const { authenticate } = authentication.hooks

export default {
  before: {
    all: [authenticate('jwt')],
    find: [],
    get: [
      addAssociations({
        models: [
          {
            model: 'identity-provider'
          },
          {
            model: 'subscription'
          }
        ]
      })
    ],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [
      async (context: HookContext) => {
        if (context.result.subscriptions && context.result.subscriptions.length > 0) {
          await Promise.all(context.result.subscriptions.map(async (subscription: any) => {
            const plan = await context.app.service('subscription-type').get(subscription.plan)
            subscription.dataValues.subscriptionType = plan
          }))
        }

        const { id, app, result } = context

        const userAvatarResult = await app.service('static-resource').find({
          query: {
            staticResourceType: 'user-thumbnail',
            userId: id
          }
        })

        console.log('userAvatarResult:')
        console.log(userAvatarResult)

        if (userAvatarResult.total > 0) {
          console.log(userAvatarResult.data[0].url)
          result.dataValues.avatarUrl = userAvatarResult.data[0].url
        }

        console.log(result)
        return context
      }
    ],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
}
