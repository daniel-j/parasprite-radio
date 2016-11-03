import config from '../../scripts/config'
import { fetchJSON } from '../../scripts/fetcher'
let root = 'https://eqbeats.org'

const EqBeats = {
  querySearch: function (query, cb) {
    fetchJSON(root + '/tracks/search/json?q=' + encodeURIComponent(query) + '&client=' + encodeURIComponent(config.general.clientId), null, function (err, data) {
      cb(err, data)
    })
  }
}

export default EqBeats
