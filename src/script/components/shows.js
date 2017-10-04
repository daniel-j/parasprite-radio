import m from 'mithril'
import api from '../entities/api'

export default {
  controller () {
    this.user = api.user.get
    this.shows = api.shows.get
  },
  view (ctrl) {
    return m('.showlist',
      ctrl.shows().map((s) => {
        delete s.authToken
        return m('.show',
          m('.user', 'Owner/host: ', s.displayName),
          m('.name', 'Name: ', s.name),
          m('.description', 'Description: ', s.description),
          m('.url', 'Website: ', s.url ? m('a', {
            href: s.url,
            target: '_blank'
          }, s.url) : '(none)'),
          m('.twitter', 'Twitter: ', s.twitter ? m('a', {
            href: 'https://twitter.com/' + s.twitter,
            target: '_blank'
          }, s.twitter) : '(none)'),
          m('.art', s.art ? m('img', {src: s.art}) : null)
        )
      })
    )
  }
}
