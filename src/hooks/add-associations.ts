import { HookContext } from '@feathersjs/feathers'

export default (options = {}): any => {
  return (context: any): any => {
    const sequelize = context.params.sequelize || {}
    const include = sequelize.include || []
    sequelize.include = include.concat((options as any).models.map((model: any) => {
      const newModel = { ...model, ...processInclude(model.include, context) }
      newModel.model = context.app.services[model.model].Model
      return newModel
    }))

    sequelize.raw = false
    context.params.sequelize = sequelize
    return context
  }
}

function processInclude (includeCollection: any, context: HookContext): any {
  if (!includeCollection) {
    return
  }
  includeCollection = includeCollection.map((model: any) => {
    const newModel = { ...model, ...processInclude(model.include, context) }
    newModel.model = context.app.services[model.model].Model
    return newModel
  })
  return { include: includeCollection }
}
