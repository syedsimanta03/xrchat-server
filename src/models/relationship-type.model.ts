import { Sequelize, DataTypes } from 'sequelize'
import { Application } from '../declarations'

export default (app: Application): any => {
  const sequelizeClient: Sequelize = app.get('sequelizeClient')
  const relationshipType = sequelizeClient.define('relationship_type', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      unique: true
    }
  }, {
    hooks: {
      beforeCount (options: any) {
        options.raw = true
      }
    }
  });

  (relationshipType as any).associate = (models: any) => {
    (relationshipType as any).hasMany(models.relationship)
  }

  return relationshipType
}