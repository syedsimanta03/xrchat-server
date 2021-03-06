import { Sequelize, DataTypes } from 'sequelize'
import { Application } from '../declarations'

export default (app: Application): any => {
  const sequelizeClient: Sequelize = app.get('sequelizeClient')
  const component = sequelizeClient.define('component', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.VIRTUAL,
      get (this: any) {
        return this.type
      }
    },
    // We need to get this for making compatible with spoke
    props: {
      type: DataTypes.VIRTUAL,
      get (this: any) {
        if (!this.data) {
          return {}
        } else {
          return this.data
        }
      }
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
      get (this: any) {
        const data = this.getDataValue('data')
        if (!data) {
          return ''
        } else {
          return JSON.parse(data)
        }
      }
    }
  }, {
    hooks: {
      beforeCount (options: any) {
        options.raw = true
      }
    }
  });

  (component as any).associate = (models: any) => {
    (component as any).belongsTo(models.component_type, { foreignKey: 'componentType', required: true, primaryKey: true });
    (component as any).belongsTo(models.entity, { as: 'entity', foreignKey: 'entityId', required: true, primaryKey: true });
    (component as any).hasMany(models.static_resource)
  }

  return component
}
