import m from 'mithril'
import prop from 'mithril/stream'
import api from '../entities/api'

export default {
  oninit () {
    this.user = api.user.get
    this.shows = api.shows.get
    this.editing = false
    this.isSaving = false

    this.currentShow = {
      id: prop(),
      name: prop(),
      description: prop(),
      url: prop(),
      twitter: prop(),
      art: prop()
    }

    this.create = () => {
      const s = {id: null}
      this.shows().unshift(s)
      this.edit(s)
    }
    this.edit = (s) => {
      if (!s) {
        if (this.shows()[0].id === null) this.shows().shift()
        this.editing = false
        return
      }
      this.editing = true
      this.currentShow.id(s.id)
      this.currentShow.name(s.name || '')
      this.currentShow.description(s.description || '')
      this.currentShow.url(s.url || '')
      this.currentShow.twitter(s.twitter || null)
      this.currentShow.art(s.art || null)
    }
    this.save = () => {
      this.isSaving = true
      api.shows.fetch({
        id: this.currentShow.id(),
        name: this.currentShow.name(),
        description: this.currentShow.description(),
        url: this.currentShow.url(),
        twitter: this.currentShow.twitter() || null,
        art: this.currentShow.art() || null
      }, 'POST').then(() => {
        this.editing = false
        this.isSaving = false
      }).catch((err) => {
        console.error(err)
        this.isSaving = false
      })
    }
    this.remove = (s) => {
      if (!confirm('Are you sure you want to remove this show?\n' + s.name)) return
      this.isSaving = true
      api.shows.fetch(null, 'DELETE', '/' + s.id).then(() => {
        this.editing = false
        this.isSaving = false
      }).catch((err) => {
        console.error(err)
        this.isSaving = false
      })
    }
    this.filterMyShows = (s) => this.user() && s.UserId === this.user().id
  },
  view (vnode) {
    const isEditing = vnode.state.editing
    return m('.showlist',
      vnode.state.shows().filter(vnode.state.filterMyShows).map((s) => {
        delete s.authToken
        const editCurrent = isEditing && s.id === vnode.state.currentShow.id()
        return m('.show', [
          !isEditing ? m('button.edit.right', {
            type: 'button',
            onclick: vnode.state.edit.bind(vnode.state, s)
          }, 'Edit') : null,
          m('.name', 'Name: ', !editCurrent ? s.name : m('input', {
            autocomplete: 'off',
            value: vnode.state.currentShow.name(),
            oninput: m.withAttr('value', vnode.state.currentShow.name),
            required: true
          })),
          m('.description', 'Description: ', !editCurrent ? s.description : m('input', {
            autocomplete: 'off',
            value: vnode.state.currentShow.description(),
            oninput: m.withAttr('value', vnode.state.currentShow.description)
          })),
          m('.url', 'Website: ', !editCurrent ? (s.url ? m('a', {
            href: s.url,
            target: '_blank'
          }, s.url) : '(none)') : m('input', {
            autocomplete: 'off',
            type: 'url',
            value: vnode.state.currentShow.url(),
            oninput: m.withAttr('value', vnode.state.currentShow.url)
          })),
          m('.twitter', 'Twitter: ', !editCurrent ? (s.twitter ? m('a', {
            href: 'https://twitter.com/' + s.twitter,
            target: '_blank'
          }, s.twitter) : '(none)') : m('input', {
            autocomplete: 'off',
            value: vnode.state.currentShow.twitter(),
            oninput: m.withAttr('value', vnode.state.currentShow.twitter)
          })),
          m('.art', 'Art: ', !editCurrent ? (s.art ? [m('a', {
            href: s.art,
            target: '_blank'
          }, s.art), m('br'), m('img', {src: s.art})] : 'No image') : m('input', {
            autocomplete: 'off',
            value: vnode.state.currentShow.art(),
            oninput: m.withAttr('value', vnode.state.currentShow.art)
          })),
          editCurrent ? [
            m('button.edit', {
              onclick: vnode.state.edit.bind(vnode.state, false),
              disabled: vnode.state.isSaving
            }, 'Cancel'),
            ' ',
            m('button.edit', {
              onclick: vnode.state.save.bind(vnode.state),
              disabled: vnode.state.isSaving
            }, 'Save'),
            s.id !== null && vnode.state.user().canMakeShows ? [
              m('br'), m('br'),
              m('button.edit', {
                onclick: vnode.state.remove.bind(vnode.state, s),
                disabled: vnode.state.isSaving
              }, 'Remove')
            ] : null
          ] : null
        ])
      }),
      vnode.state.user() && vnode.state.user().canMakeShows ? m('button', {onclick: vnode.state.create.bind(this), disabled: isEditing}, 'Create') : null
    )
  }
}
