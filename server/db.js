import Sequelize from 'sequelize'
import config from '../scripts/config'
const sequelize = new Sequelize(config.mysql.database, config.mysql.user, config.mysql.password, {
	host: config.mysql.host,
	logging: false,
	define: {
		charset: 'utf8'
	},
	language: 'en'
})

export default sequelize
