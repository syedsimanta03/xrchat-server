import { Hook, HookContext } from '@feathersjs/feathers'

export default (options = {}): Hook => {
  return async (context: HookContext) => {
    const { data } = context
    const requiredParams = ['text', 'senderId', 'conversationId']
    const emptyError: any[] = []
    const requiredError: any[] = []
    requiredParams.forEach((param: any) => {
      // eslint-disable-next-line no-prototype-builtins
      if (data.hasOwnProperty(param)) {
        if (data[param].toString().trim() === '') {
          emptyError.push(param)
        }
      } else {
        requiredError.push(param)
      }
    })
    if (requiredError.length) {
      throw new Error('Required data: ' + requiredParams.join(', '))
    }

    if (emptyError.length) {
      throw new Error('Empty data: ' + emptyError.join(', '))
    }
    return context
  }
}