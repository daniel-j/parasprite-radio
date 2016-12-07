import config from '../../scripts/config'
import { fetchJSON } from '../../scripts/fetcher'
let root = 'https://pony.fm'

const PonyFM = {
  querySearch: function (query, cb) {
    fetchJSON(root + '/api/web/search?query=' + encodeURIComponent(query) + '&client=' + encodeURIComponent(config.general.clientId), null, function (err, data) {
      if (err) {
        cb(err)
        return
      }
      cb(null, data.results.tracks)
    })
  }
}

export default PonyFM
