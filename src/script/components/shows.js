import m from 'mithril'
import api from '../entities/api'

export default {
  controller () {
    api.shows.fetch()
    this.user = api.user.get
    this.shows = api.shows.get
    this.editing = false
    this.isSaving = false

    this.currentShow = {
      id: m.prop(),
      name: m.prop(),
      description: m.prop(),
      url: m.prop(),
      twitter: m.prop()
    }

    this.edit = (s) => {
      if (!s) {
        this.editing = false
        return
      }
      this.editing = true
      this.currentShow.id(s.id)
      this.currentShow.name(s.name)
      this.currentShow.description(s.description)
      this.currentShow.url(s.url)
      this.currentShow.twitter(s.twitter)
    }
    this.save = () => {
      this.isSaving = true
      api.shows.fetch({
        id: this.currentShow.id(),
        name: this.currentShow.name(),
        description: this.currentShow.description(),
        url: this.currentShow.url(),
        twitter: this.currentShow.twitter()
      }, 'POST').then(() => {
        this.editing = false
        this.isSaving = false
      }).catch((err) => {
        console.error(err)
        this.isSaving = false
      })
    }
  },
  view (ctrl) {
    const isEditing = ctrl.editing
    return ctrl.shows().map((s) => {
      delete s.authToken
      return m('.show', [
        !isEditing ? m('button.edit', {
          type: 'button',
          onclick: ctrl.edit.bind(ctrl, s)
        }, 'Edit') : [
          m('button.edit', {
            onclick: ctrl.edit.bind(ctrl, false),
            disabled: ctrl.isSaving
          }, 'Cancel'),
          ' ',
          m('button.edit', {
            onclick: ctrl.save.bind(ctrl),
            disabled: ctrl.isSaving
          }, 'Save')
        ],

        m('.name', 'Name: ', !isEditing ? s.name : m('input', {
          autocomplete: 'off',
          value: ctrl.currentShow.name(),
          onchange: m.withAttr('value', ctrl.currentShow.name),
          required: true
        })),
        m('.description', 'Description: ', !isEditing ? s.description : m('input', {
          autocomplete: 'off',
          value: ctrl.currentShow.description(),
          onchange: m.withAttr('value', ctrl.currentShow.description)
        })),
        m('.url', 'Website: ', !isEditing ? (s.url ? m('a', {
          href: s.url,
          target: '_blank'
        }, s.url) : '(none)') : m('input', {
          autocomplete: 'off',
          type: 'url',
          value: ctrl.currentShow.url(),
          onchange: m.withAttr('value', ctrl.currentShow.url)
        })),
        m('.twitter', 'Twitter: ', !isEditing ? (s.twitter ? m('a', {
          href: 'https://twitter.com/' + s.twitter,
          target: '_blank'
        }, s.twitter) : '(none)') : m('input', {
          autocomplete: 'off',
          value: ctrl.currentShow.twitter(),
          onchange: m.withAttr('value', ctrl.currentShow.twitter)
        }))
      ])
    })
  }
}
