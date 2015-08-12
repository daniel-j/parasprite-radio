db = require '../db'

API =
	findById: (id, cb) ->
		db.getConnection (err, conn) ->
			conn.query 'SELECT * FROM user WHERE id = ? LIMIT 1', [id], (err, rows) ->
				conn.release()
				user = rows[0]
				if err
					cb err, null
				else if !user
					cb null, null
				else
					cb null, user

	add: (info, cb) ->
		db.getConnection (err, conn) ->
			conn.query 'INSERT INTO user (id, username, displayName, token, level, image) VALUES (?,?,?,?,?,?)', [info.id, info.username, info.displayName, info.token, info.level or 0, info.image or ""], (err, result) ->
				conn.release()
				if err
					cb err, null

				else
					API.findById result.insertId, cb

	update: (info, cb) ->
		delete info.level
		keys = []
		values = []
		for k, v of info
			keys.push k+"=?"
			values.push v

		values.push info.id
		keys = keys.join ', '

		db.getConnection (err, conn) ->
			conn.query 'UPDATE user SET '+keys+ 'WHERE id = ?', values, (err, result) ->
				conn.release()
				if err
					cb err, null
				else
					API.findById info.id, cb

module.exports = API