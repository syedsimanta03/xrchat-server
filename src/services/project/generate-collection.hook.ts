import { HookContext } from '@feathersjs/feathers'
import { BadRequest } from '@feathersjs/errors'
import fetch from 'node-fetch'

import { extractLoggedInUserFromParams } from '../auth-management/auth-management.utils'

export default (options: any) => {
  return async (context: HookContext) => {
    const seqeulizeClient = context.app.get('sequelizeClient')
    const models = seqeulizeClient.models
    const CollectionModel = models.collection
    const EntityModel = models.entity
    const OwnedFileModel = models.owned_file
    const ComponentModel = models.component
    const ComponentTypeModel = models.component_type
    const loggedInUser = extractLoggedInUserFromParams(context.params)

    // TODO: Get other scene data too if there is any parent too
    // Get the project JSON from s3
    // After creating of project, remove the owned_file of project json

    // Find the project owned_file from database
    const ownedFile = await OwnedFileModel.findOne({
      where: {
        id: context.data.ownedFileId
      },
      raw: true
    })

    if (!ownedFile) {
      return await Promise.reject(new BadRequest('Project File not found!'))
    }
    const sceneData = await fetch(ownedFile.url).then(res => res.json())

    const savedCollection = await CollectionModel.create({
      type: options.type ?? 'scene',
      name: context.data.name,
      metadata: sceneData.metadata,
      version: sceneData.version,
      userId: loggedInUser.userId
    })

    const sceneEntitiesArray: any = []

    for (const prop in sceneData.entities) {
      sceneEntitiesArray.push({ entityId: prop, ...sceneData.entities[prop] })
    }

    const entites = sceneEntitiesArray.map((entity: any) => {
      entity.name = entity.name.toLowerCase()
      entity.type = 'default'
      entity.userId = loggedInUser.userId
      entity.collectionId = savedCollection.id
      return entity
    })

    const savedEntities = await EntityModel.bulkCreate(entites)

    const components: any = []
    const componetTypeSet = new Set()
    savedEntities.forEach((savedEntity: any, index: number) => {
      const entity = sceneEntitiesArray[index]
      entity.components.forEach((component: any) => {
        componetTypeSet.add(component.name.toLowerCase())
        components.push(
          {
            data: component.props,
            entityId: savedEntity.id,
            type: component.name.toLowerCase(),
            userId: loggedInUser.userId,
            collection: savedCollection.id
            // TODO: Manage Static_RESOURCE
          }
        )
      })
    })

    // Now we check if any of component-type is missing, then create that one
    let savedComponentTypes = await ComponentTypeModel.findAll({
      where: {
        type: Array.from(componetTypeSet)
      },
      raw: true,
      attributes: ['type']
    })

    savedComponentTypes = savedComponentTypes.map((item: any) => item.type)
    if (savedComponentTypes.length <= componetTypeSet.size) {
      let nonExistedComponentTypes = Array.from(componetTypeSet).filter((item) => savedComponentTypes.indexOf(item) < 0)

      nonExistedComponentTypes = nonExistedComponentTypes.map((item) => {
        return {
          type: item
        }
      })
      await ComponentTypeModel.bulkCreate(nonExistedComponentTypes)
    }
    await ComponentModel.bulkCreate(components)

    context.params.collectionId = savedCollection.id
    context.params.ownedFile = ownedFile
    return context
  }
}
