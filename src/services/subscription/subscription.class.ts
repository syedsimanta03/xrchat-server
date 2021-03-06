import { Service, SequelizeServiceOptions } from 'feathers-sequelize'
import { Params } from '@feathersjs/feathers'
import { Application } from '../../declarations'
import app from './../../app'

export class Subscription extends Service {
  constructor (options: Partial<SequelizeServiceOptions>, app: Application) {
    super(options)
  }

  async create (data: any, params: Params): Promise<any> {
    const userId = (params as any).connection['identity-provider'].userId || params.body.userId
    if (userId == null) {
      throw new Error('Invalid user')
    }

    const unconfirmedSubscriptions = await super.find({
      query: {
        userId: userId,
        status: 0
      }
    }) as any

    await Promise.all(unconfirmedSubscriptions.data.map((subscription: any) => {
      return super.remove(subscription.id)
    }))
    let plan: string
    const found = await app.service('subscription-type').find({
      query: {
        plan: data.plan
      }
    })
    if (!found) {
      plan = 'monthly-subscription-free'
    } else {
      plan = data.plan
    }
    const saveData = {
      userId,
      plan,
      amount: (found as any).data[0].amount ?? 0,
      quantity: 1
    }
    const saved = await super.create(saveData, params)

    const returned = {
      subscriptionId: saved.id,
      paymentUrl: `https://kaixr-test.chargebee.com/hosted_pages/plans/${plan}?subscription[id]=${saved.id as string}&customer[id]=${userId as string}`
    }

    return returned
  }
}
