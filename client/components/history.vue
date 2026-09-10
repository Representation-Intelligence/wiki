<template lang='pug'>
  v-app(:dark='$vuetify.theme.dark').history
    nav-header
    v-content
      v-toolbar.ewo-contextbar(flat)
        .ewo-contextbar-heading
          h1 {{ ui.heading }}
          .ewo-contextbar-meta
            span /{{path}}
            span {{ ui.versions }}: {{total}}
        v-spacer
        v-btn.ewo-return(depressed, color='primary', @click='goLive')
          v-icon(left, small) mdi-arrow-left
          | {{ ui.returnLive }}
      v-container(fluid, grid-list-xl)
        v-layout(row, wrap)
          v-flex(xs12, md4)
            v-chip.my-0.ml-6(
              label
              small
              :color='$vuetify.theme.dark ? `grey darken-2` : `grey lighten-2`'
              :class='$vuetify.theme.dark ? `grey--text text--lighten-2` : `grey--text text--darken-2`'
              )
              span {{ ui.live }}
            v-timeline(
              dense
              )
              v-timeline-item.pb-2(
                v-for='(ph, idx) in fullTrail'
                :key='ph.versionId'
                :small='ph.actionType === `edit`'
                :color='trailColor(ph.actionType)'
                :icon='trailIcon(ph.actionType)'
                )
                v-card.ewo-trail-card(flat)
                  .ewo-trail-row
                    .caption(:title='$options.filters.moment(ph.versionDate, `LLL`)') {{ ph.versionDate | moment('ll') }}

                    .caption(v-if='ph.actionType === `edit`') {{ ui.editedBy }} #[strong {{ ph.authorName }}]
                    .caption(v-else-if='ph.actionType === `move`') {{ ui.moved }} #[strong {{ph.valueBefore}}] → #[strong {{ph.valueAfter}}] · {{ ph.authorName }}
                    .caption(v-else-if='ph.actionType === `initial`') {{ ui.createdBy }} #[strong {{ ph.authorName }}]
                    .caption(v-else-if='ph.actionType === `live`') {{ ui.lastEditedBy }} #[strong {{ ph.authorName }}]
                    .caption(v-else) {{ ui.changedBy }} #[strong {{ ph.authorName }}]
                    v-spacer
                    v-menu(offset-x, left)
                      template(v-slot:activator='{ on }')
                        v-btn.mr-2.radius-4(icon, v-on='on', small, tile): v-icon mdi-dots-horizontal
                      v-list(dense, nav).history-promptmenu
                        v-list-item(@click='setDiffSource(ph.versionId)', :disabled='(ph.versionId >= diffTarget && diffTarget !== 0) || ph.versionId === 0')
                          v-list-item-avatar(size='24'): v-avatar A
                          v-list-item-title {{ ui.source }}
                        v-list-item(@click='setDiffTarget(ph.versionId)', :disabled='ph.versionId <= diffSource && ph.versionId !== 0')
                          v-list-item-avatar(size='24'): v-avatar B
                          v-list-item-title {{ ui.target }}
                        v-list-item(@click='viewSource(ph.versionId)')
                          v-list-item-avatar(size='24'): v-icon mdi-code-tags
                          v-list-item-title {{ ui.viewSource }}
                        v-list-item(@click='download(ph.versionId)')
                          v-list-item-avatar(size='24'): v-icon mdi-cloud-download-outline
                          v-list-item-title {{ ui.download }}
                        v-list-item(@click='restore(ph.versionId, ph.versionDate)', :disabled='ph.versionId === 0')
                          v-list-item-avatar(size='24'): v-icon(:disabled='ph.versionId === 0') mdi-history
                          v-list-item-title {{ ui.restore }}
                        v-list-item(@click='branchOff(ph.versionId)')
                          v-list-item-avatar(size='24'): v-icon mdi-source-branch
                          v-list-item-title {{ ui.branch }}
                    v-btn.mr-2.radius-4(
                      :aria-label='ui.source'
                      :aria-pressed='diffSource === ph.versionId'
                      @click='setDiffSource(ph.versionId)'
                      icon
                      small
                      depressed
                      tile
                      :class='diffSource === ph.versionId ? `ewo-diff-selected` : `ewo-diff-unselected`'
                      :disabled='(ph.versionId >= diffTarget && diffTarget !== 0) || ph.versionId === 0'
                      ): strong A
                    v-btn.mr-0.radius-4(
                      :aria-label='ui.target'
                      :aria-pressed='diffTarget === ph.versionId'
                      @click='setDiffTarget(ph.versionId)'
                      icon
                      small
                      depressed
                      tile
                      :class='diffTarget === ph.versionId ? `ewo-diff-selected` : `ewo-diff-unselected`'
                      :disabled='ph.versionId <= diffSource && ph.versionId !== 0'
                      ): strong B

            v-btn.ma-0.radius-7(
              v-if='total > trail.length'
              block
              color='primary'
              @click='loadMore'
              )
              .caption.white--text {{ ui.loadMore }}

            v-chip.ma-0(
              v-else
              label
              small
              :color='$vuetify.theme.dark ? `grey darken-2` : `grey lighten-2`'
              :class='$vuetify.theme.dark ? `grey--text text--lighten-2` : `grey--text text--darken-2`'
              ) {{ ui.end }}

          v-flex(xs12, md8)
            v-card.ewo-diff-card(flat)
              v-card-text
                v-card.ewo-diff-heading(flat)
                  v-row(no-gutters, align='center')
                    v-col
                      v-card-text
                        .subheading {{target.title}}
                        .caption {{target.description}}
                    v-col.text-right.py-3(cols='auto')
                      v-btn.mr-3(:color='$vuetify.theme.dark ? `white` : `grey darken-3`', small, outlined, @click='toggleViewMode')
                        v-icon(left) mdi-eye
                        .overline {{ ui.viewMode }}
                v-card.ewo-diff-content.mt-3(v-html='diffHTML', flat)

    v-dialog(v-model='isRestoreConfirmDialogShown', max-width='650', persistent)
      v-card
        .dialog-header.is-orange {{$t('history:restore.confirmTitle')}}
        v-card-text.pa-4
          i18next(tag='span', path='history:restore.confirmText')
            strong(place='date') {{ restoreTarget.versionDate | moment('LLL') }}
        v-card-actions
          v-spacer
          v-btn(text, @click='isRestoreConfirmDialogShown = false', :disabled='restoreLoading') {{$t('common:actions.cancel')}}
          v-btn(color='orange darken-2', dark, @click='restoreConfirm', :loading='restoreLoading') {{$t('history:restore.confirmButton')}}

    page-selector(mode='create', v-model='branchOffOpts.modal', :open-handler='branchOffHandle', :path='branchOffOpts.path', :locale='branchOffOpts.locale')

    nav-footer
    notify
    search-results
</template>

<script>
import * as Diff2Html from 'diff2html'
import { createPatch } from 'diff'
import _ from 'lodash'
import gql from 'graphql-tag'
import historyLabels from '../helpers/history-labels'

export default {
  i18nOptions: { namespaces: 'history' },
  props: {
    pageId: {
      type: Number,
      default: 0
    },
    locale: {
      type: String,
      default: 'en'
    },
    path: {
      type: String,
      default: 'home'
    },
    title: {
      type: String,
      default: 'Untitled Page'
    },
    description: {
      type: String,
      default: ''
    },
    createdAt: {
      type: String,
      default: ''
    },
    updatedAt: {
      type: String,
      default: ''
    },
    tags: {
      type: Array,
      default: () => ([])
    },
    authorName: {
      type: String,
      default: 'Unknown'
    },
    authorId: {
      type: Number,
      default: 0
    },
    isPublished: {
      type: Boolean,
      default: false
    },
    liveContent: {
      type: String,
      default: ''
    },
    effectivePermissions: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      source: {
        versionId: 0,
        content: '',
        title: '',
        description: ''
      },
      target: {
        versionId: 0,
        content: '',
        title: '',
        description: ''
      },
      trail: [],
      diffSource: 0,
      diffTarget: 0,
      offsetPage: 0,
      total: 0,
      viewMode: 'line-by-line',
      cache: [],
      restoreTarget: {
        versionId: 0,
        versionDate: ''
      },
      branchOffOpts: {
        versionId: 0,
        locale: 'en',
        path: 'new-page',
        modal: false
      },
      isRestoreConfirmDialogShown: false,
      restoreLoading: false
    }
  },
  computed: {
    ui () { return historyLabels[this.locale.startsWith('zh') ? 'zh' : 'en'] },
    fullTrail () {
      const liveTrailItem = {
        versionId: 0,
        authorId: this.authorId,
        authorName: this.authorName,
        actionType: 'live',
        valueBefore: null,
        valueAfter: null,
        versionDate: this.updatedAt
      }
      // -> Check for move between latest and live
      const prevPage = _.find(this.cache, ['versionId', _.get(this.trail, '[0].versionId', -1)])
      if (prevPage && this.path !== prevPage.path) {
        liveTrailItem.actionType = 'move'
        liveTrailItem.valueBefore = prevPage.path
        liveTrailItem.valueAfter = this.path
      }
      // -> Combine trail with live
      return [
        liveTrailItem,
        ...this.trail
      ]
    },
    diffs () {
      return createPatch(`/${this.path}`, this.source.content, this.target.content)
    },
    diffHTML () {
      return Diff2Html.html(this.diffs, {
        inputFormat: 'diff',
        drawFileList: false,
        matching: 'lines',
        outputFormat: this.viewMode
      })
    }
  },
  watch: {
    trail (newValue, oldValue) {
      if (newValue && newValue.length > 0) {
        this.diffTarget = 0
        this.diffSource = _.get(_.head(newValue), 'versionId', 0)
      }
    },
    async diffSource (newValue, oldValue) {
      if (this.diffSource !== this.source.versionId) {
        const page = _.find(this.cache, { versionId: newValue })
        if (page) {
          this.source = page
        } else {
          this.source = await this.loadVersion(newValue)
        }
      }
    },
    async diffTarget (newValue, oldValue) {
      if (this.diffTarget !== this.target.versionId) {
        const page = _.find(this.cache, { versionId: newValue })
        if (page) {
          this.target = page
        } else {
          this.target = await this.loadVersion(newValue)
        }
      }
    }
  },
  created () {
    this.$store.commit('page/SET_ID', this.id)
    this.$store.commit('page/SET_LOCALE', this.locale)
    this.$store.commit('page/SET_PATH', this.path)

    this.$store.commit('page/SET_MODE', 'history')

    this.cache.push({
      action: 'live',
      authorId: this.authorId,
      authorName: this.authorName,
      content: this.liveContent,
      contentType: '',
      createdAt: this.createdAt,
      description: this.description,
      editor: '',
      isPrivate: false,
      isPublished: this.isPublished,
      locale: this.locale,
      pageId: this.pageId,
      path: this.path,
      publishEndDate: '',
      publishStartDate: '',
      tags: this.tags,
      title: this.title,
      versionId: 0,
      versionDate: this.updatedAt
    })

    this.target = this.cache[0]

    if (this.effectivePermissions) {
      this.$store.set('page/effectivePermissions', JSON.parse(Buffer.from(this.effectivePermissions, 'base64').toString()))
    }
  },
  methods: {
    async loadVersion (versionId) {
      this.$store.commit(`loadingStart`, 'history-version-' + versionId)
      const resp = await this.$apollo.query({
        query: gql`
          query ($pageId: Int!, $versionId: Int!) {
            pages {
              version (pageId: $pageId, versionId: $versionId) {
                action
                authorId
                authorName
                content
                contentType
                createdAt
                versionDate
                description
                editor
                isPrivate
                isPublished
                locale
                pageId
                path
                publishEndDate
                publishStartDate
                tags
                title
                versionId
              }
            }
          }
        `,
        variables: {
          versionId,
          pageId: this.pageId
        }
      })
      this.$store.commit(`loadingStop`, 'history-version-' + versionId)
      const page = _.get(resp, 'data.pages.version', null)
      if (page) {
        this.cache.push(page)
        return page
      } else {
        return { content: '' }
      }
    },
    viewSource (versionId) {
      window.location.assign(`/s/${this.locale}/${this.path}?v=${versionId}`)
    },
    download (versionId) {
      window.location.assign(`/d/${this.locale}/${this.path}?v=${versionId}`)
    },
    restore (versionId, versionDate) {
      this.restoreTarget = {
        versionId,
        versionDate
      }
      this.isRestoreConfirmDialogShown = true
    },
    async restoreConfirm () {
      this.restoreLoading = true
      this.$store.commit(`loadingStart`, 'history-restore')
      try {
        const resp = await this.$apollo.mutate({
          mutation: gql`
            mutation ($pageId: Int!, $versionId: Int!) {
              pages {
                restore (pageId: $pageId, versionId: $versionId) {
                  responseResult {
                    succeeded
                    errorCode
                    slug
                    message
                  }
                }
              }
            }
          `,
          variables: {
            versionId: this.restoreTarget.versionId,
            pageId: this.pageId
          }
        })
        if (_.get(resp, 'data.pages.restore.responseResult.succeeded', false) === true) {
          this.$store.commit('showNotification', {
            style: 'success',
            message: this.$t('history:restore.success'),
            icon: 'check'
          })
          this.isRestoreConfirmDialogShown = false
          setTimeout(() => {
            window.location.assign(`/${this.locale}/${this.path}`)
          }, 1000)
        } else {
          throw new Error(_.get(resp, 'data.pages.restore.responseResult.message', 'An unexpected error occurred'))
        }
      } catch (err) {
        this.$store.commit('showNotification', {
          style: 'red',
          message: err.message,
          icon: 'alert'
        })
      }
      this.$store.commit(`loadingStop`, 'history-restore')
      this.restoreLoading = false
    },
    branchOff (versionId) {
      const pathParts = this.path.split('/')
      this.branchOffOpts = {
        versionId: versionId,
        locale: this.locale,
        path: (pathParts.length > 1) ? _.initial(pathParts).join('/') + `/new-page` : `new-page`,
        modal: true
      }
    },
    branchOffHandle ({ locale, path }) {
      window.location.assign(`/e/${locale}/${path}?from=${this.pageId},${this.branchOffOpts.versionId}`)
    },
    toggleViewMode () {
      this.viewMode = (this.viewMode === 'line-by-line') ? 'side-by-side' : 'line-by-line'
    },
    goLive () {
      window.location.assign(`/${this.locale}/${this.path}`)
    },
    setDiffSource (versionId) {
      this.diffSource = versionId
    },
    setDiffTarget (versionId) {
      this.diffTarget = versionId
    },
    loadMore () {
      this.offsetPage++
      this.$apollo.queries.trail.fetchMore({
        variables: {
          id: this.pageId,
          offsetPage: this.offsetPage,
          offsetSize: this.$vuetify.breakpoint.mdAndUp ? 25 : 5
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          return {
            pages: {
              history: {
                total: previousResult.pages.history.total,
                trail: [...previousResult.pages.history.trail, ...fetchMoreResult.pages.history.trail],
                __typename: previousResult.pages.history.__typename
              },
              __typename: previousResult.pages.__typename
            }
          }
        }
      })
    },
    trailColor (actionType) {
      switch (actionType) {
        case 'edit':
          return 'primary'
        case 'move':
          return 'purple'
        case 'initial':
          return 'teal'
        case 'live':
          return 'primary'
        default:
          return 'grey'
      }
    },
    trailIcon (actionType) {
      switch (actionType) {
        case 'edit':
          return '' // 'mdi-pencil'
        case 'move':
          return 'mdi-forward'
        case 'initial':
          return 'mdi-plus'
        case 'live':
          return 'mdi-atom-variant'
        default:
          return 'mdi-alert'
      }
    }
  },
  apollo: {
    trail: {
      query: gql`
        query($id: Int!, $offsetPage: Int, $offsetSize: Int) {
          pages {
            history(id:$id, offsetPage:$offsetPage, offsetSize:$offsetSize) {
              trail {
                versionId
                authorId
                authorName
                actionType
                valueBefore
                valueAfter
                versionDate
              }
              total
            }
          }
        }
      `,
      variables () {
        return {
          id: this.pageId,
          offsetPage: 0,
          offsetSize: this.$vuetify.breakpoint.mdAndUp ? 25 : 5
        }
      },
      manual: true,
      result ({ data, loading, networkStatus }) {
        this.total = data.pages.history.total
        this.trail = data.pages.history.trail
      },
      watchLoading (isLoading) {
        this.$store.commit(`loading${isLoading ? 'Start' : 'Stop'}`, 'history-trail-refresh')
      }
    }
  }
}
</script>

<style lang='scss'>

.history {
  &-promptmenu {
    border-top: 5px solid mc('blue', '700');
  }

  .d2h-file-wrapper {
    border: 1px solid #EEE;
    border-left: none;
  }

  .d2h-file-header {
    display: none;
  }
}

</style>
