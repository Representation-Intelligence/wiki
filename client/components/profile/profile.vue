<template lang='pug'>
  v-container(fluid, grid-list-lg).ewo-profile
    v-layout(row wrap)
      v-flex(xs12)
        header.ewo-profile-head
          .ewo-profile-headings
            h1 {{$t('profile:title')}}
            p {{$t('profile:subtitle')}}
          v-spacer
          v-btn.ewo-btn-primary.ewo-btn-pill(depressed, large, @click='saveProfile', :loading='saveLoading')
            v-icon(left, small) mdi-check
            span {{$t('common:actions.save')}}

      v-flex(lg6 xs12)
        section.ewo-card
          .ewo-card-header
            v-icon(small) mdi-account-circle-outline
            span {{$t('profile:myInfo')}}
          v-list(two-line, dense)
            v-list-item
              v-list-item-content
                v-list-item-title {{$t('profile:displayName')}}
                v-list-item-subtitle {{ user.name }}
              v-list-item-action
                v-menu(
                  v-model='editPop.name'
                  :close-on-content-click='false'
                  min-width='350'
                  left
                  )
                  template(v-slot:activator='{ on }')
                    v-btn.ewo-edit-btn(text, small, v-on='on', @click='focusField(`iptDisplayName`)')
                      v-icon(left, small) mdi-pencil-outline
                      span {{ $t('common:actions:edit') }}
                  v-card
                    v-text-field(
                      ref='iptDisplayName'
                      v-model='user.name'
                      :label='$t(`profile:displayName`)'
                      solo
                      hide-details
                      append-icon='mdi-check'
                      @click:append='editPop.name = false'
                      @keydown.enter='editPop.name = false'
                      @keydown.esc='editPop.name = false'
                    )
            v-divider
            v-list-item
              v-list-item-content
                v-list-item-title {{$t('profile:location')}}
                v-list-item-subtitle {{ user.location }}
              v-list-item-action
                v-menu(
                  v-model='editPop.location'
                  :close-on-content-click='false'
                  min-width='350'
                  left
                  )
                  template(v-slot:activator='{ on }')
                    v-btn.ewo-edit-btn(text, small, v-on='on', @click='focusField(`iptLocation`)')
                      v-icon(left, small) mdi-pencil-outline
                      span {{ $t('common:actions:edit') }}
                  v-card
                    v-text-field(
                      ref='iptLocation'
                      v-model='user.location'
                      :label='$t(`profile:location`)'
                      solo
                      hide-details
                      append-icon='mdi-check'
                      @click:append='editPop.location = false'
                      @keydown.enter='editPop.location = false'
                      @keydown.esc='editPop.location = false'
                    )
            v-divider
            v-list-item
              v-list-item-content
                v-list-item-title {{$t('profile:jobTitle')}}
                v-list-item-subtitle {{ user.jobTitle }}
              v-list-item-action
                v-menu(
                  v-model='editPop.jobTitle'
                  :close-on-content-click='false'
                  min-width='350'
                  left
                  )
                  template(v-slot:activator='{ on }')
                    v-btn.ewo-edit-btn(text, small, v-on='on', @click='focusField(`iptJobTitle`)')
                      v-icon(left, small) mdi-pencil-outline
                      span {{ $t('common:actions:edit') }}
                  v-card
                    v-text-field(
                      ref='iptJobTitle'
                      v-model='user.jobTitle'
                      :label='$t(`profile:jobTitle`)'
                      solo
                      hide-details
                      append-icon='mdi-check'
                      @click:append='editPop.jobTitle = false'
                      @keydown.enter='editPop.jobTitle = false'
                      @keydown.esc='editPop.jobTitle = false'
                    )

        section.ewo-card
          .ewo-card-header
            v-icon(small) mdi-shield-lock-outline
            span {{$t('profile:auth.title')}}
          .ewo-card-body
            .ewo-card-sub {{$t('profile:auth.provider')}}
            .ewo-provider
              v-icon(small) mdi-shield-lock-outline
              span {{ user.providerName }}
            template(v-if='user.providerKey === `local`')
              form#change-password-form(@submit.prevent='changePassword')
                .ewo-card-sub.mt-5 {{$t('profile:auth.changePassword')}}
                v-text-field(
                  ref='iptCurrentPass'
                  v-model='currentPass'
                  outlined
                  dense
                  :label='$t(`profile:auth.currentPassword`)'
                  type='password'
                  prepend-inner-icon='mdi-form-textbox-password'
                  autocomplete='current-password'
                  hide-details='auto'
                  )
                v-text-field.mt-3(
                  ref='iptNewPass'
                  v-model='newPass'
                  outlined
                  dense
                  :label='$t(`profile:auth.newPassword`)'
                  type='password'
                  prepend-inner-icon='mdi-form-textbox-password'
                  autocomplete='off'
                  counter='255'
                  loading
                  )
                  password-strength(slot='progress', v-model='newPass')
                v-text-field.mt-3(
                  ref='iptVerifyPass'
                  v-model='verifyPass'
                  outlined
                  dense
                  :label='$t(`profile:auth.verifyPassword`)'
                  type='password'
                  prepend-inner-icon='mdi-form-textbox-password'
                  autocomplete='off'
                  hide-details='auto'
                  )
          .ewo-card-actions(v-if='user.providerKey === `local`')
            v-spacer
            v-btn.ewo-btn-primary.px-5(depressed, :loading='changePassLoading', type='submit', form='change-password-form')
              v-icon(left, small) mdi-progress-check
              span {{$t('profile:auth.changePassword')}}

        section.ewo-card
          .ewo-card-header
            v-icon(small) mdi-key-outline
            span AI 连接 / 个人 Key
          .ewo-card-body
            p.ewo-hint 为自己的 AI 创建 Key。权限受账号本身权限限制；公开内容始终需要网页人工确认。

            .ewo-card-sub 创建新 Key
            v-text-field(v-model='tokenName', label='名称，例如工作电脑上的 AI', outlined, dense, hide-details='auto')
            .ewo-field-row.mt-3
              v-select(v-model='tokenMode', :items='[{text: `只读`, value: `read`}, {text: `阅读和贡献`, value: `write`}]', label='权限', outlined, dense, hide-details='auto')
              v-select(v-model='tokenExpiresIn', :items='tokenExpiryOptions', label='有效期', outlined, dense, hide-details='auto')
            v-btn.ewo-btn-primary.mt-4(depressed, :loading='tokenLoading', @click='createMcpToken', data-cy='mcp-create-key')
              v-icon(left, small) mdi-key-plus
              span 创建 Key

            .ewo-secret(v-if='newToken', data-cy='mcp-secret')
              .ewo-secret-title
                v-icon(small) mdi-alert-outline
                span 请立即保存，仅显示这一次。不要将 Key 粘贴到聊天内容或代码仓库。
              .ewo-secret-value
                code {{ newToken }}
                v-btn(icon, small, aria-label='复制 Key', @click='copyText(newToken)')
                  v-icon(small) mdi-content-copy

            .ewo-card-sub.mt-5 接入方式
            dl.ewo-connect
              .ewo-connect-row
                dt 接入地址
                dd: code {{ mcpEndpoint }}
              .ewo-connect-row
                dt 本地客户端
                dd: a(href='/_assets/representation-intelligence-wiki-mcp-1.0.0.tgz') 下载 MCP 客户端包
            .ewo-command
              pre {{ npxCommand }}
              v-btn(icon, small, aria-label='复制命令', @click='copyText(npxCommand)')
                v-icon(small) mdi-content-copy
            p.ewo-hint 将 Key 放入客户端的 EWO_WIKI_TOKEN 环境变量；请勿放在聊天消息或命令行参数中。

            .ewo-card-sub.mt-5 已创建的 Key
            v-list.ewo-token-list(two-line, dense, v-if='mcpTokens.length')
              v-list-item(v-for='token of mcpTokens', :key='token.id', :class='{ "is-revoked": token.revokedAt }')
                v-list-item-content
                  v-list-item-title
                    span {{ token.name }}
                    code.ewo-token-prefix {{ token.tokenPrefix }}…
                  v-list-item-subtitle
                    span(v-if='token.revokedAt') 已撤销 ·
                    | 到期 {{ token.expiresAt | moment('L') }} · {{ token.scopes.includes('wiki:create') ? '读写' : '只读' }}
                v-list-item-action
                  v-btn(icon, small, :disabled='!!token.revokedAt', :aria-label='token.revokedAt ? `已撤销` : `撤销 Key`', @click='revokeMcpToken(token.id)', data-cy='mcp-revoke-key')
                    v-icon(small) mdi-key-remove-outline
            p.ewo-hint(v-else) 还没有 Key，创建一个开始接入。
            a.ewo-audit-link(href='/mcp-audit') 查看 AI 操作记录
              v-icon(small) mdi-arrow-right

      v-flex(lg6 xs12)
        section.ewo-card
          .ewo-card-header
            v-icon(small) mdi-tune-variant
            span {{$t('profile:preferences')}}
          v-list(two-line, dense)
            v-list-item
              v-list-item-content
                v-list-item-title {{$t('profile:timezone')}}
                v-list-item-subtitle {{ user.timezone }}
              v-list-item-action
                v-menu(
                  v-model='editPop.timezone'
                  :close-on-content-click='false'
                  min-width='350'
                  max-width='350'
                  left
                  )
                  template(v-slot:activator='{ on }')
                    v-btn.ewo-edit-btn(text, small, v-on='on', @click='focusField(`iptTimezone`)')
                      v-icon(left, small) mdi-pencil-outline
                      span {{ $t('common:actions:edit') }}
                  v-card(flat)
                    v-select(
                      ref='iptTimezone'
                      :items='timezones'
                      v-model='user.timezone'
                      :label='$t(`profile:timezone`)'
                      solo
                      flat
                      dense
                      hide-details
                      @keydown.enter='editPop.timezone = false'
                      @keydown.esc='editPop.timezone = false'
                      style='height: 38px;'
                    )
                    v-card-chin
                      v-spacer
                      v-btn(
                        small
                        text
                        color='primary'
                        @click='editPop.timezone = false'
                        )
                        v-icon(left) mdi-check
                        span {{$t('common:actions.ok')}}
            v-divider
            v-list-item
              v-list-item-content
                v-list-item-title {{$t('profile:dateFormat')}}
                v-list-item-subtitle {{ user.dateFormat && user.dateFormat.length > 0 ? user.dateFormat : $t('profile:localeDefault') }}
              v-list-item-action
                v-menu(
                  v-model='editPop.dateFormat'
                  :close-on-content-click='false'
                  min-width='350'
                  max-width='350'
                  left
                  )
                  template(v-slot:activator='{ on }')
                    v-btn.ewo-edit-btn(text, small, v-on='on', @click='focusField(`iptDateFormat`)')
                      v-icon(left, small) mdi-pencil-outline
                      span {{ $t('common:actions:edit') }}
                  v-card(flat)
                    v-select(
                      ref='iptDateFormat'
                      :items='dateFormats'
                      v-model='user.dateFormat'
                      :label='$t(`profile:dateFormat`)'
                      solo
                      flat
                      dense
                      hide-details
                      @keydown.enter='editPop.dateFormat = false'
                      @keydown.esc='editPop.dateFormat = false'
                      style='height: 38px;'
                    )
                    v-card-chin
                      v-spacer
                      v-btn(
                        small
                        text
                        color='primary'
                        @click='editPop.dateFormat = false'
                        )
                        v-icon(left) mdi-check
                        span {{$t('common:actions.ok')}}
            v-divider
            v-list-item
              v-list-item-content
                v-list-item-title {{$t('profile:appearance')}}
                v-list-item-subtitle {{ currentAppearance }}
              v-list-item-action
                v-menu(
                  v-model='editPop.appearance'
                  :close-on-content-click='false'
                  min-width='350'
                  max-width='350'
                  left
                  )
                  template(v-slot:activator='{ on }')
                    v-btn.ewo-edit-btn(text, small, v-on='on', @click='focusField(`iptAppearance`)')
                      v-icon(left, small) mdi-pencil-outline
                      span {{ $t('common:actions:edit') }}
                  v-card(flat)
                    v-select(
                      ref='iptAppearance'
                      :items='appearances'
                      v-model='user.appearance'
                      :label='$t(`profile:appearance`)'
                      solo
                      flat
                      dense
                      hide-details
                      @keydown.enter='editPop.appearance = false'
                      @keydown.esc='editPop.appearance = false'
                      style='height: 38px;'
                    )
                    v-card-chin
                      v-spacer
                      v-btn(
                        small
                        text
                        color='primary'
                        @click='editPop.appearance = false'
                        )
                        v-icon(left) mdi-check
                        span {{$t('common:actions.ok')}}

        section.ewo-card
          .ewo-card-header
            v-icon(small) mdi-account-group-outline
            span {{$t('profile:groups.title')}}
          v-list(dense)
            template(v-for='(grp, idx) of user.groups')
              v-list-item(:key='`grp-id-` + grp')
                v-list-item-content
                  v-list-item-title.body-2 {{grp}}
              v-divider(v-if='idx < user.groups.length - 1')

        section.ewo-card
          .ewo-card-header
            v-icon(small) mdi-chart-timeline-variant
            span {{$t('profile:activity.title')}}
          .ewo-card-body
            .ewo-stats
              .ewo-stat
                .ewo-stat-label {{$t('profile:activity.joinedOn')}}
                .ewo-stat-value {{ user.createdAt | moment('LLLL') }}
              .ewo-stat
                .ewo-stat-label {{$t('profile:activity.lastUpdatedOn')}}
                .ewo-stat-value {{ user.updatedAt | moment('LLLL') }}
              .ewo-stat
                .ewo-stat-label {{$t('profile:activity.lastLoginOn')}}
                .ewo-stat-value {{ user.lastLoginAt | moment('LLLL') }}
            v-divider.my-4
            .ewo-stats.ewo-stats-counts
              .ewo-stat
                .ewo-stat-label {{$t('profile:activity.pagesCreated')}}
                .ewo-stat-value {{ user.pagesTotal }}
              .ewo-stat
                .ewo-stat-label {{$t('profile:activity.commentsPosted')}}
                .ewo-stat-value 0
</template>

<script>
import { get } from 'vuex-pathify'
import gql from 'graphql-tag'
import _ from 'lodash'
import Cookies from 'js-cookie'
import validate from 'validate.js'

import PasswordStrength from '../common/password-strength.vue'

/* global WIKI, siteConfig, navigator */

export default {
  i18nOptions: {
    namespaces: ['profile', 'auth']
  },
  components: {
    PasswordStrength
  },
  data() {
    return {
      saveLoading: false,
      changePassLoading: false,
      user: {
        name: 'unknown',
        location: '',
        jobTitle: '',
        timezone: '',
        dateFormat: '',
        appearance: '',
        createdAt: '1970-01-01',
        updatedAt: '1970-01-01',
        lastLoginAt: '1970-01-01',
        groups: []
      },
      currentPass: '',
      newPass: '',
      verifyPass: '',
      tokenName: '我的 AI',
      tokenMode: 'write',
      tokenExpiresIn: '90d',
      tokenExpiryOptions: ['30d', '90d', '180d', '365d'],
      tokenLoading: false,
      newToken: '',
      mcpTokens: [],
      mcpEndpoint: 'https://wiki.representation.com.cn/mcp',
      npxCommand: 'npx --yes --package=https://wiki.representation.com.cn/_assets/representation-intelligence-wiki-mcp-1.0.0.tgz ewo-wiki-mcp',
      editPop: {
        name: false,
        location: false,
        jobTitle: false,
        timezone: false,
        dateFormat: false,
        appearance: false
      },
      timezones: [
        { text: '(GMT-11:00) Niue', value: 'Pacific/Niue' },
        { text: '(GMT-11:00) Pago Pago', value: 'Pacific/Pago_Pago' },
        { text: '(GMT-10:00) Hawaii Time', value: 'Pacific/Honolulu' },
        { text: '(GMT-10:00) Rarotonga', value: 'Pacific/Rarotonga' },
        { text: '(GMT-10:00) Tahiti', value: 'Pacific/Tahiti' },
        { text: '(GMT-09:30) Marquesas', value: 'Pacific/Marquesas' },
        { text: '(GMT-09:00) Alaska Time', value: 'America/Anchorage' },
        { text: '(GMT-09:00) Gambier', value: 'Pacific/Gambier' },
        { text: '(GMT-08:00) Pacific Time', value: 'America/Los_Angeles' },
        { text: '(GMT-08:00) Pacific Time - Tijuana', value: 'America/Tijuana' },
        { text: '(GMT-08:00) Pacific Time - Vancouver', value: 'America/Vancouver' },
        { text: '(GMT-08:00) Pacific Time - Whitehorse', value: 'America/Whitehorse' },
        { text: '(GMT-08:00) Pitcairn', value: 'Pacific/Pitcairn' },
        { text: '(GMT-07:00) Mountain Time', value: 'America/Denver' },
        { text: '(GMT-07:00) Mountain Time - Arizona', value: 'America/Phoenix' },
        { text: '(GMT-07:00) Mountain Time - Chihuahua, Mazatlan', value: 'America/Mazatlan' },
        { text: '(GMT-07:00) Mountain Time - Dawson Creek', value: 'America/Dawson_Creek' },
        { text: '(GMT-07:00) Mountain Time - Edmonton', value: 'America/Edmonton' },
        { text: '(GMT-07:00) Mountain Time - Hermosillo', value: 'America/Hermosillo' },
        { text: '(GMT-07:00) Mountain Time - Yellowknife', value: 'America/Yellowknife' },
        { text: '(GMT-06:00) Belize', value: 'America/Belize' },
        { text: '(GMT-06:00) Central Time', value: 'America/Chicago' },
        { text: '(GMT-06:00) Central Time - Mexico City', value: 'America/Mexico_City' },
        { text: '(GMT-06:00) Central Time - Regina', value: 'America/Regina' },
        { text: '(GMT-06:00) Central Time - Tegucigalpa', value: 'America/Tegucigalpa' },
        { text: '(GMT-06:00) Central Time - Winnipeg', value: 'America/Winnipeg' },
        { text: '(GMT-06:00) Costa Rica', value: 'America/Costa_Rica' },
        { text: '(GMT-06:00) El Salvador', value: 'America/El_Salvador' },
        { text: '(GMT-06:00) Galapagos', value: 'Pacific/Galapagos' },
        { text: '(GMT-06:00) Guatemala', value: 'America/Guatemala' },
        { text: '(GMT-06:00) Managua', value: 'America/Managua' },
        { text: '(GMT-05:00) America Cancun', value: 'America/Cancun' },
        { text: '(GMT-05:00) Bogota', value: 'America/Bogota' },
        { text: '(GMT-05:00) Easter Island', value: 'Pacific/Easter' },
        { text: '(GMT-05:00) Eastern Time', value: 'America/New_York' },
        { text: '(GMT-05:00) Eastern Time - Iqaluit', value: 'America/Iqaluit' },
        { text: '(GMT-05:00) Eastern Time - Toronto', value: 'America/Toronto' },
        { text: '(GMT-05:00) Guayaquil', value: 'America/Guayaquil' },
        { text: '(GMT-05:00) Havana', value: 'America/Havana' },
        { text: '(GMT-05:00) Jamaica', value: 'America/Jamaica' },
        { text: '(GMT-05:00) Lima', value: 'America/Lima' },
        { text: '(GMT-05:00) Nassau', value: 'America/Nassau' },
        { text: '(GMT-05:00) Panama', value: 'America/Panama' },
        { text: '(GMT-05:00) Port-au-Prince', value: 'America/Port-au-Prince' },
        { text: '(GMT-05:00) Rio Branco', value: 'America/Rio_Branco' },
        { text: '(GMT-04:00) Atlantic Time - Halifax', value: 'America/Halifax' },
        { text: '(GMT-04:00) Barbados', value: 'America/Barbados' },
        { text: '(GMT-04:00) Bermuda', value: 'Atlantic/Bermuda' },
        { text: '(GMT-04:00) Boa Vista', value: 'America/Boa_Vista' },
        { text: '(GMT-04:00) Caracas', value: 'America/Caracas' },
        { text: '(GMT-04:00) Curacao', value: 'America/Curacao' },
        { text: '(GMT-04:00) Grand Turk', value: 'America/Grand_Turk' },
        { text: '(GMT-04:00) Guyana', value: 'America/Guyana' },
        { text: '(GMT-04:00) La Paz', value: 'America/La_Paz' },
        { text: '(GMT-04:00) Manaus', value: 'America/Manaus' },
        { text: '(GMT-04:00) Martinique', value: 'America/Martinique' },
        { text: '(GMT-04:00) Port of Spain', value: 'America/Port_of_Spain' },
        { text: '(GMT-04:00) Porto Velho', value: 'America/Porto_Velho' },
        { text: '(GMT-04:00) Puerto Rico', value: 'America/Puerto_Rico' },
        { text: '(GMT-04:00) Santo Domingo', value: 'America/Santo_Domingo' },
        { text: '(GMT-04:00) Thule', value: 'America/Thule' },
        { text: '(GMT-03:30) Newfoundland Time - St. Johns', value: 'America/St_Johns' },
        { text: '(GMT-03:00) Araguaina', value: 'America/Araguaina' },
        { text: '(GMT-03:00) Asuncion', value: 'America/Asuncion' },
        { text: '(GMT-03:00) Belem', value: 'America/Belem' },
        { text: '(GMT-03:00) Buenos Aires', value: 'America/Argentina/Buenos_Aires' },
        { text: '(GMT-03:00) Campo Grande', value: 'America/Campo_Grande' },
        { text: '(GMT-03:00) Cayenne', value: 'America/Cayenne' },
        { text: '(GMT-03:00) Cuiaba', value: 'America/Cuiaba' },
        { text: '(GMT-03:00) Fortaleza', value: 'America/Fortaleza' },
        { text: '(GMT-03:00) Godthab', value: 'America/Godthab' },
        { text: '(GMT-03:00) Maceio', value: 'America/Maceio' },
        { text: '(GMT-03:00) Miquelon', value: 'America/Miquelon' },
        { text: '(GMT-03:00) Montevideo', value: 'America/Montevideo' },
        { text: '(GMT-03:00) Palmer', value: 'Antarctica/Palmer' },
        { text: '(GMT-03:00) Paramaribo', value: 'America/Paramaribo' },
        { text: '(GMT-03:00) Punta Arenas', value: 'America/Punta_Arenas' },
        { text: '(GMT-03:00) Recife', value: 'America/Recife' },
        { text: '(GMT-03:00) Rothera', value: 'Antarctica/Rothera' },
        { text: '(GMT-03:00) Salvador', value: 'America/Bahia' },
        { text: '(GMT-03:00) Santiago', value: 'America/Santiago' },
        { text: '(GMT-03:00) Sao Paulo', value: 'America/Sao_Paulo' },
        { text: '(GMT-03:00) Stanley', value: 'Atlantic/Stanley' },
        { text: '(GMT-02:00) Noronha', value: 'America/Noronha' },
        { text: '(GMT-02:00) South Georgia', value: 'Atlantic/South_Georgia' },
        { text: '(GMT-01:00) Azores', value: 'Atlantic/Azores' },
        { text: '(GMT-01:00) Cape Verde', value: 'Atlantic/Cape_Verde' },
        { text: '(GMT-01:00) Scoresbysund', value: 'America/Scoresbysund' },
        { text: '(GMT+00:00) Abidjan', value: 'Africa/Abidjan' },
        { text: '(GMT+00:00) Accra', value: 'Africa/Accra' },
        { text: '(GMT+00:00) Bissau', value: 'Africa/Bissau' },
        { text: '(GMT+00:00) Canary Islands', value: 'Atlantic/Canary_Islands' },
        { text: '(GMT+00:00) Casablanca', value: 'Africa/Casablanca' },
        { text: '(GMT+00:00) Danmarkshavn', value: 'America/Danmarkshavn' },
        { text: '(GMT+00:00) Dublin', value: 'Europe/Dublin' },
        { text: '(GMT+00:00) El Aaiun', value: 'Africa/El_Aaiun' },
        { text: '(GMT+00:00) Faeroe', value: 'Atlantic/Faeroe' },
        { text: '(GMT+00:00) GMT (no daylight saving)', value: 'Etc/GMT' },
        { text: '(GMT+00:00) Lisbon', value: 'Europe/Lisbon' },
        { text: '(GMT+00:00) London', value: 'Europe/London' },
        { text: '(GMT+00:00) Monrovia', value: 'Africa/Monrovia' },
        { text: '(GMT+00:00) Reykjavik', value: 'Atlantic/Reykjavik' },
        { text: '(GMT+01:00) Algiers', value: 'Africa/Algiers' },
        { text: '(GMT+01:00) Amsterdam', value: 'Europe/Amsterdam' },
        { text: '(GMT+01:00) Andorra', value: 'Europe/Andorra' },
        { text: '(GMT+01:00) Berlin', value: 'Europe/Berlin' },
        { text: '(GMT+01:00) Brussels', value: 'Europe/Brussels' },
        { text: '(GMT+01:00) Budapest', value: 'Europe/Budapest' },
        { text: '(GMT+01:00) Central European Time - Belgrade', value: 'Europe/Belgrade' },
        { text: '(GMT+01:00) Central European Time - Prague', value: 'Europe/Prague' },
        { text: '(GMT+01:00) Ceuta', value: 'Africa/Ceuta' },
        { text: '(GMT+01:00) Copenhagen', value: 'Europe/Copenhagen' },
        { text: '(GMT+01:00) Gibraltar', value: 'Europe/Gibraltar' },
        { text: '(GMT+01:00) Lagos', value: 'Africa/Lagos' },
        { text: '(GMT+01:00) Luxembourg', value: 'Europe/Luxembourg' },
        { text: '(GMT+01:00) Madrid', value: 'Europe/Madrid' },
        { text: '(GMT+01:00) Malta', value: 'Europe/Malta' },
        { text: '(GMT+01:00) Monaco', value: 'Europe/Monaco' },
        { text: '(GMT+01:00) Ndjamena', value: 'Africa/Ndjamena' },
        { text: '(GMT+01:00) Oslo', value: 'Europe/Oslo' },
        { text: '(GMT+01:00) Paris', value: 'Europe/Paris' },
        { text: '(GMT+01:00) Rome', value: 'Europe/Rome' },
        { text: '(GMT+01:00) Stockholm', value: 'Europe/Stockholm' },
        { text: '(GMT+01:00) Tirane', value: 'Europe/Tirane' },
        { text: '(GMT+01:00) Tunis', value: 'Africa/Tunis' },
        { text: '(GMT+01:00) Vienna', value: 'Europe/Vienna' },
        { text: '(GMT+01:00) Warsaw', value: 'Europe/Warsaw' },
        { text: '(GMT+01:00) Zurich', value: 'Europe/Zurich' },
        { text: '(GMT+02:00) Amman', value: 'Asia/Amman' },
        { text: '(GMT+02:00) Athens', value: 'Europe/Athens' },
        { text: '(GMT+02:00) Beirut', value: 'Asia/Beirut' },
        { text: '(GMT+02:00) Bucharest', value: 'Europe/Bucharest' },
        { text: '(GMT+02:00) Cairo', value: 'Africa/Cairo' },
        { text: '(GMT+02:00) Chisinau', value: 'Europe/Chisinau' },
        { text: '(GMT+02:00) Damascus', value: 'Asia/Damascus' },
        { text: '(GMT+02:00) Gaza', value: 'Asia/Gaza' },
        { text: '(GMT+02:00) Helsinki', value: 'Europe/Helsinki' },
        { text: '(GMT+02:00) Jerusalem', value: 'Asia/Jerusalem' },
        { text: '(GMT+02:00) Johannesburg', value: 'Africa/Johannesburg' },
        { text: '(GMT+02:00) Khartoum', value: 'Africa/Khartoum' },
        { text: '(GMT+02:00) Kyiv', value: 'Europe/Kyiv' },
        { text: '(GMT+02:00) Maputo', value: 'Africa/Maputo' },
        { text: '(GMT+02:00) Moscow-01 - Kaliningrad', value: 'Europe/Kaliningrad' },
        { text: '(GMT+02:00) Nicosia', value: 'Asia/Nicosia' },
        { text: '(GMT+02:00) Riga', value: 'Europe/Riga' },
        { text: '(GMT+02:00) Sofia', value: 'Europe/Sofia' },
        { text: '(GMT+02:00) Tallinn', value: 'Europe/Tallinn' },
        { text: '(GMT+02:00) Tripoli', value: 'Africa/Tripoli' },
        { text: '(GMT+02:00) Vilnius', value: 'Europe/Vilnius' },
        { text: '(GMT+02:00) Windhoek', value: 'Africa/Windhoek' },
        { text: '(GMT+03:00) Baghdad', value: 'Asia/Baghdad' },
        { text: '(GMT+03:00) Istanbul', value: 'Europe/Istanbul' },
        { text: '(GMT+03:00) Minsk', value: 'Europe/Minsk' },
        { text: '(GMT+03:00) Moscow+00 - Moscow', value: 'Europe/Moscow' },
        { text: '(GMT+03:00) Nairobi', value: 'Africa/Nairobi' },
        { text: '(GMT+03:00) Qatar', value: 'Asia/Qatar' },
        { text: '(GMT+03:00) Riyadh', value: 'Asia/Riyadh' },
        { text: '(GMT+03:00) Syowa', value: 'Antarctica/Syowa' },
        { text: '(GMT+03:30) Tehran', value: 'Asia/Tehran' },
        { text: '(GMT+04:00) Baku', value: 'Asia/Baku' },
        { text: '(GMT+04:00) Dubai', value: 'Asia/Dubai' },
        { text: '(GMT+04:00) Mahe', value: 'Indian/Mahe' },
        { text: '(GMT+04:00) Mauritius', value: 'Indian/Mauritius' },
        { text: '(GMT+04:00) Moscow+01 - Samara', value: 'Europe/Samara' },
        { text: '(GMT+04:00) Reunion', value: 'Indian/Reunion' },
        { text: '(GMT+04:00) Tbilisi', value: 'Asia/Tbilisi' },
        { text: '(GMT+04:00) Yerevan', value: 'Asia/Yerevan' },
        { text: '(GMT+04:30) Kabul', value: 'Asia/Kabul' },
        { text: '(GMT+05:00) Aqtau', value: 'Asia/Aqtau' },
        { text: '(GMT+05:00) Aqtobe', value: 'Asia/Aqtobe' },
        { text: '(GMT+05:00) Ashgabat', value: 'Asia/Ashgabat' },
        { text: '(GMT+05:00) Dushanbe', value: 'Asia/Dushanbe' },
        { text: '(GMT+05:00) Karachi', value: 'Asia/Karachi' },
        { text: '(GMT+05:00) Kerguelen', value: 'Indian/Kerguelen' },
        { text: '(GMT+05:00) Maldives', value: 'Indian/Maldives' },
        { text: '(GMT+05:00) Mawson', value: 'Antarctica/Mawson' },
        { text: '(GMT+05:00) Moscow+02 - Yekaterinburg', value: 'Asia/Yekaterinburg' },
        { text: '(GMT+05:00) Tashkent', value: 'Asia/Tashkent' },
        { text: '(GMT+05:30) Colombo', value: 'Asia/Colombo' },
        { text: '(GMT+05:30) India Standard Time', value: 'Asia/Kolkata' },
        { text: '(GMT+05:45) Kathmandu', value: 'Asia/Kathmandu' },
        { text: '(GMT+06:00) Almaty', value: 'Asia/Almaty' },
        { text: '(GMT+06:00) Bishkek', value: 'Asia/Bishkek' },
        { text: '(GMT+06:00) Chagos', value: 'Indian/Chagos' },
        { text: '(GMT+06:00) Dhaka', value: 'Asia/Dhaka' },
        { text: '(GMT+06:00) Moscow+03 - Omsk', value: 'Asia/Omsk' },
        { text: '(GMT+06:00) Thimphu', value: 'Asia/Thimphu' },
        { text: '(GMT+06:00) Vostok', value: 'Antarctica/Vostok' },
        { text: '(GMT+06:30) Cocos', value: 'Indian/Cocos' },
        { text: '(GMT+06:30) Rangoon', value: 'Asia/Yangon' },
        { text: '(GMT+07:00) Bangkok', value: 'Asia/Bangkok' },
        { text: '(GMT+07:00) Christmas', value: 'Indian/Christmas' },
        { text: '(GMT+07:00) Davis', value: 'Antarctica/Davis' },
        { text: '(GMT+07:00) Hanoi', value: 'Asia/Saigon' },
        { text: '(GMT+07:00) Hovd', value: 'Asia/Hovd' },
        { text: '(GMT+07:00) Jakarta', value: 'Asia/Jakarta' },
        { text: '(GMT+07:00) Moscow+04 - Krasnoyarsk', value: 'Asia/Krasnoyarsk' },
        { text: '(GMT+08:00) Brunei', value: 'Asia/Brunei' },
        { text: '(GMT+08:00) China Time - Beijing', value: 'Asia/Shanghai' },
        { text: '(GMT+08:00) Choibalsan', value: 'Asia/Choibalsan' },
        { text: '(GMT+08:00) Hong Kong', value: 'Asia/Hong_Kong' },
        { text: '(GMT+08:00) Kuala Lumpur', value: 'Asia/Kuala_Lumpur' },
        { text: '(GMT+08:00) Macau', value: 'Asia/Macau' },
        { text: '(GMT+08:00) Makassar', value: 'Asia/Makassar' },
        { text: '(GMT+08:00) Manila', value: 'Asia/Manila' },
        { text: '(GMT+08:00) Moscow+05 - Irkutsk', value: 'Asia/Irkutsk' },
        { text: '(GMT+08:00) Singapore', value: 'Asia/Singapore' },
        { text: '(GMT+08:00) Taipei', value: 'Asia/Taipei' },
        { text: '(GMT+08:00) Ulaanbaatar', value: 'Asia/Ulaanbaatar' },
        { text: '(GMT+08:00) Western Time - Perth', value: 'Australia/Perth' },
        { text: '(GMT+08:30) Pyongyang', value: 'Asia/Pyongyang' },
        { text: '(GMT+09:00) Dili', value: 'Asia/Dili' },
        { text: '(GMT+09:00) Jayapura', value: 'Asia/Jayapura' },
        { text: '(GMT+09:00) Moscow+06 - Yakutsk', value: 'Asia/Yakutsk' },
        { text: '(GMT+09:00) Palau', value: 'Pacific/Palau' },
        { text: '(GMT+09:00) Seoul', value: 'Asia/Seoul' },
        { text: '(GMT+09:00) Tokyo', value: 'Asia/Tokyo' },
        { text: '(GMT+09:30) Central Time - Darwin', value: 'Australia/Darwin' },
        { text: '(GMT+10:00) Dumont D\'Urville', value: 'Antarctica/DumontDUrville' },
        { text: '(GMT+10:00) Eastern Time - Brisbane', value: 'Australia/Brisbane' },
        { text: '(GMT+10:00) Guam', value: 'Pacific/Guam' },
        { text: '(GMT+10:00) Moscow+07 - Vladivostok', value: 'Asia/Vladivostok' },
        { text: '(GMT+10:00) Port Moresby', value: 'Papua/Port_Moresby' },
        { text: '(GMT+10:00) Truk', value: 'Pacific/Chuuk' },
        { text: '(GMT+10:30) Central Time - Adelaide', value: 'Australia/Adelaide' },
        { text: '(GMT+11:00) Casey', value: 'Antarctica/Casey' },
        { text: '(GMT+11:00) Eastern Time - Hobart', value: 'Australia/Hobart' },
        { text: '(GMT+11:00) Eastern Time - Melbourne, Sydney', value: 'Australia/Sydney' },
        { text: '(GMT+11:00) Efate', value: 'Pacific/Efate' },
        { text: '(GMT+11:00) Guadalcanal', value: 'Pacific/Guadalcanal' },
        { text: '(GMT+11:00) Kosrae', value: 'Pacific/Kosrae' },
        { text: '(GMT+11:00) Moscow+08 - Magadan', value: 'Asia/Magadan' },
        { text: '(GMT+11:00) Norfolk', value: 'Pacific/Norfolk' },
        { text: '(GMT+11:00) Noumea', value: 'Pacific/Noumea' },
        { text: '(GMT+11:00) Ponape', value: 'Pacific/Pohnpei' },
        { text: '(GMT+12:00) Funafuti', value: 'Pacific/Funafuti' },
        { text: '(GMT+12:00) Kwajalein', value: 'Pacific/Kwajalein' },
        { text: '(GMT+12:00) Majuro', value: 'Pacific/Majuro' },
        { text: '(GMT+12:00) Moscow+09 - Petropavlovsk-Kamchatskiy', value: 'Asia/Kamchatka' },
        { text: '(GMT+12:00) Nauru', value: 'Pacific/Nauru' },
        { text: '(GMT+12:00) Tarawa', value: 'Pacific/Tarawa' },
        { text: '(GMT+12:00) Wake', value: 'Pacific/Wake' },
        { text: '(GMT+12:00) Wallis', value: 'Pacific/Wallis' },
        { text: '(GMT+13:00) Auckland', value: 'Pacific/Auckland' },
        { text: '(GMT+13:00) Enderbury', value: 'Pacific/Enderbury' },
        { text: '(GMT+13:00) Fakaofo', value: 'Pacific/Fakaofo' },
        { text: '(GMT+13:00) Fiji', value: 'Pacific/Fiji' },
        { text: '(GMT+13:00) Tongatapu', value: 'Pacific/Tongatapu' },
        { text: '(GMT+14:00) Apia', value: 'Pacific/Apia' },
        { text: '(GMT+14:00) Kiritimati', value: 'Pacific/Kiritimati' }
      ]
    }
  },
  computed: {
    dateFormats () {
      return [
        { text: this.$t('profile:localeDefault'), value: '' },
        { text: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
        { text: 'DD.MM.YYYY', value: 'DD.MM.YYYY' },
        { text: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
        { text: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
        { text: 'YYYY/MM/DD', value: 'YYYY/MM/DD' }
      ]
    },
    appearances () {
      return [
        { text: this.$t('profile:appearanceDefault'), value: '' },
        { text: this.$t('profile:appearanceLight'), value: 'light' },
        { text: this.$t('profile:appearanceDark'), value: 'dark' }
      ]
    },
    currentAppearance () {
      return _.get(_.find(this.appearances, ['value', this.user.appearance]), 'text', false) || this.$t('profile:appearanceDefault')
    },
    pictureUrl: get('user/pictureUrl'),
    picture () {
      if (this.pictureUrl && this.pictureUrl.length > 1) {
        return {
          kind: 'image',
          url: this.pictureUrl
        }
      } else {
        const nameParts = this.user.name.toUpperCase().split(' ')
        let initials = _.head(nameParts).charAt(0)
        if (nameParts.length > 1) {
          initials += _.last(nameParts).charAt(0)
        }
        return {
          kind: 'initials',
          initials
        }
      }
    }
  },
  watch: {
    'user.appearance': (newValue, oldValue) => {
      if (newValue === '') {
        WIKI.$vuetify.theme.dark = siteConfig.darkMode
      } else {
        WIKI.$vuetify.theme.dark = (newValue === 'dark')
      }
    },
    'user.dateFormat': (newValue, oldValue) => {
      if (newValue === '') {
        WIKI.$moment.updateLocale(WIKI.$moment.locale(), null)
      } else {
        WIKI.$moment.updateLocale(WIKI.$moment.locale(), {
          longDateFormat: {
            'L': newValue
          }
        })
      }
    },
    'user.timezone': (newValue, oldValue) => {
      if (newValue === '') {
        WIKI.$moment.tz.setDefault()
      } else {
        WIKI.$moment.tz.setDefault(newValue)
      }
    }
  },
  methods: {
    async createMcpToken () {
      this.tokenLoading = true
      try {
        const result = await this.$apollo.mutate({
          mutation: gql`mutation ($name: String!, $expiresIn: String, $scopes: [String!]) { authentication { createPersonalToken(name: $name, expiresIn: $expiresIn, scopes: $scopes) { responseResult { succeeded message } token tokenInfo { id name tokenPrefix expiresAt } } } }`,
          context: { headers: { 'x-ewo-mcp-ui': '1' } },
          variables: { name: this.tokenName, expiresIn: this.tokenExpiresIn, scopes: this.tokenMode === 'read' ? ['wiki:read'] : ['wiki:read', 'wiki:create', 'wiki:update', 'wiki:upload', 'wiki:publish:team'] }
        })
        const response = _.get(result, 'data.authentication.createPersonalToken', {})
        if (!response.responseResult.succeeded) throw new Error(response.responseResult.message)
        this.newToken = response.token
        this.mcpTokens.unshift(response.tokenInfo)
      } catch (err) { this.$store.commit('pushGraphError', err) }
      this.tokenLoading = false
    },
    async revokeMcpToken (id) {
      try {
        const result = await this.$apollo.mutate({
          mutation: gql`mutation ($id: Int!) { authentication { revokePersonalToken(id: $id) { responseResult { succeeded message } } } }`,
          context: { headers: { 'x-ewo-mcp-ui': '1' } },
          variables: { id }
        })
        const response = _.get(result, 'data.authentication.revokePersonalToken.responseResult', {})
        if (!response.succeeded) throw new Error(response.message)
        const token = this.mcpTokens.find(item => item.id === id)
        if (token) token.revokedAt = new Date().toISOString()
      } catch (err) { this.$store.commit('pushGraphError', err) }
    },
    /**
     * Copy text to clipboard with a notification fallback
     */
    async copyText (text) {
      try {
        await navigator.clipboard.writeText(text)
        this.$store.commit('showNotification', {
          message: '已复制',
          style: 'success',
          icon: 'check'
        })
      } catch (err) {
        this.$store.commit('showNotification', {
          message: '复制失败，请手动选择复制',
          style: 'red',
          icon: 'warning'
        })
      }
    },
    /**
     * Focus an input after delay
     */
    focusField (ipt) {
      this.$nextTick(() => {
        _.delay(() => {
          this.$refs[ipt].focus()
        }, 200)
      })
    },
    /**
     * Save User Profile
     */
    async saveProfile () {
      this.saveLoading = true
      this.$store.commit(`loadingStart`, 'profile-save')

      try {
        const respRaw = await this.$apollo.mutate({
          mutation: gql`
            mutation ($name: String!, $location: String!, $jobTitle: String!, $timezone: String!, $dateFormat: String!, $appearance: String!) {
              users {
                updateProfile(name: $name, location: $location, jobTitle: $jobTitle, timezone: $timezone, dateFormat: $dateFormat, appearance: $appearance) {
                  responseResult {
                    succeeded
                    errorCode
                    slug
                    message
                  }
                  jwt
                }
              }
            }
          `,
          variables: {
            name: this.user.name,
            location: this.user.location,
            jobTitle: this.user.jobTitle,
            timezone: this.user.timezone,
            dateFormat: this.user.dateFormat,
            appearance: this.user.appearance
          }
        })
        const resp = _.get(respRaw, 'data.users.updateProfile.responseResult', {})
        if (resp.succeeded) {
          Cookies.set('jwt', _.get(respRaw, 'data.users.updateProfile.jwt', ''), { expires: 365, secure: window.location.protocol === 'https:' })
          this.$store.set('user/name', this.user.name)
          this.$store.commit('showNotification', {
            message: this.$t('profile:save.success'),
            style: 'success',
            icon: 'check'
          })
        } else {
          throw new Error(resp.message)
        }
      } catch (err) {
        this.$store.commit('pushGraphError', err)
      }

      this.$store.commit(`loadingStop`, 'profile-save')
      this.saveLoading = false
    },
    /**
     * Change Password
     */
    async changePassword () {
      const validation = validate({
        current: this.currentPass,
        password: this.newPass,
        verifyPassword: this.verifyPass
      }, {
        current: {
          presence: {
            message: this.$t('auth:missingPassword'),
            allowEmpty: false
          },
          length: {
            minimum: 6,
            tooShort: this.$t('auth:passwordTooShort')
          }
        },
        password: {
          presence: {
            message: this.$t('auth:missingPassword'),
            allowEmpty: false
          },
          length: {
            minimum: 6,
            tooShort: this.$t('auth:passwordTooShort')
          }
        },
        verifyPassword: {
          equality: {
            attribute: 'password',
            message: this.$t('auth:passwordNotMatch')
          }
        }
      }, { fullMessages: false })

      if (validation) {
        if (validation.current) {
          this.$store.commit('showNotification', {
            style: 'red',
            message: validation.current[0],
            icon: 'warning'
          })
          this.$refs.iptCurrentPass.focus()
        } else if (validation.password) {
          this.$store.commit('showNotification', {
            style: 'red',
            message: validation.password[0],
            icon: 'warning'
          })
          this.$refs.iptNewPass.focus()
        } else if (validation.verifyPassword) {
          this.$store.commit('showNotification', {
            style: 'red',
            message: validation.verifyPassword[0],
            icon: 'warning'
          })
          this.$refs.iptVerifyPass.focus()
        }
      } else {
        this.changePassLoading = true
        this.$store.commit(`loadingStart`, 'profile-changepassword')

        try {
          const respRaw = await this.$apollo.mutate({
            mutation: gql`
              mutation ($current: String!, $new: String!) {
                users {
                  changePassword(current: $current, new: $new) {
                    responseResult {
                      succeeded
                      errorCode
                      slug
                      message
                    }
                    jwt
                  }
                }
              }
            `,
            variables: {
              current: this.currentPass,
              new: this.newPass
            }
          })
          const resp = _.get(respRaw, 'data.users.changePassword.responseResult', {})
          if (resp.succeeded) {
            this.currentPass = ''
            this.newPass = ''
            this.verifyPass = ''
            Cookies.set('jwt', _.get(respRaw, 'data.users.changePassword.jwt', ''), { expires: 365, secure: window.location.protocol === 'https:' })
            this.$store.commit('showNotification', {
              message: this.$t('profile:auth.changePassSuccess'),
              style: 'success',
              icon: 'check'
            })
          } else {
            throw new Error(resp.message)
          }
        } catch (err) {
          this.$store.commit('pushGraphError', err)
        }

        this.$store.commit(`loadingStop`, 'profile-changepassword')
        this.changePassLoading = false
      }
    }
  },
  apollo: {
    mcpTokens: {
      query: gql`
        { authentication { personalTokens { id name tokenPrefix scopes createdAt expiresAt lastUsedAt revokedAt } } }
      `,
      fetchPolicy: 'network-only',
      update: data => _.cloneDeep(data.authentication.personalTokens)
    },
    user: {
      query: gql`
        {
          users {
            profile {
              id
              name
              email
              providerKey
              providerName
              isSystem
              isVerified
              location
              jobTitle
              timezone
              dateFormat
              appearance
              createdAt
              updatedAt
              lastLoginAt
              groups
              pagesTotal
            }
          }
        }
      `,
      fetchPolicy: 'network-only',
      update: (data) => _.cloneDeep(data.users.profile),
      watchLoading (isLoading) {
        this.$store.commit(`loading${isLoading ? 'Start' : 'Stop'}`, 'profile-refresh')
      }
    }
  }
}
</script>

<style lang='scss'>
.ewo-profile {
  max-width: 1240px;
  padding-top: 28px;

  .ewo-profile-head {
    display: flex;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: 12px;
    padding: 4px 8px 20px;
  }
  .ewo-profile-headings {
    h1 {
      font-size: 24px;
      font-weight: 600;
      letter-spacing: -.02em;
      line-height: 1.4;
      color: var(--ewo-ink);
    }
    p {
      margin: 4px 0 0;
      font-size: 13px;
      color: var(--ewo-muted);
    }
  }

  .ewo-btn-primary:not(.v-btn--disabled) {
    background: var(--ewo-button) !important;
    border-color: var(--ewo-primary) !important;
    color: var(--ewo-on-primary) !important;
    box-shadow: none;
    text-transform: none;
    letter-spacing: .02em;
  }
  .ewo-btn-pill {
    border-radius: 999px;
    padding-left: 20px;
    padding-right: 20px;
  }

  .ewo-card {
    background: var(--ewo-paper);
    border: 1px solid var(--ewo-line);
    border-radius: 16px;
    overflow: hidden;

    & + .ewo-card {
      margin-top: 20px;
    }
  }
  .ewo-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--ewo-line);
    font-size: 15px;
    font-weight: 600;
    color: var(--ewo-ink);

    .v-icon {
      color: var(--ewo-primary);
    }
  }
  .ewo-card-body {
    padding: 20px;
  }
  .ewo-card-actions {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    border-top: 1px solid var(--ewo-line);
  }
  .ewo-card-sub {
    font-size: 13px;
    font-weight: 600;
    color: var(--ewo-ink);
    margin-bottom: 10px;
  }
  .ewo-hint {
    font-size: 12px;
    line-height: 1.7;
    color: var(--ewo-muted);
    margin: 0 0 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .ewo-card > .v-list {
    background: transparent !important;
    padding: 6px 12px;

    .v-list-item {
      padding: 0 8px;
    }
    .v-list-item__title {
      font-size: 12px;
      color: var(--ewo-muted);
    }
    .v-list-item__subtitle {
      font-size: 14px;
      color: var(--ewo-ink);
    }
    .v-divider {
      border-color: var(--ewo-line);
    }
  }
  .ewo-edit-btn:not(.v-btn--disabled) {
    color: var(--ewo-link) !important;
    text-transform: none;
    letter-spacing: 0;
  }

  .ewo-provider {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: var(--ewo-panel);
    border: 1px solid var(--ewo-line);
    border-radius: 12px;
    font-size: 14px;
    color: var(--ewo-ink);

    .v-icon {
      color: var(--ewo-primary);
    }
  }

  .ewo-field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;

    @media (max-width: 600px) {
      grid-template-columns: 1fr;
    }
  }

  .ewo-secret {
    margin-top: 16px;
    padding: 14px 16px;
    background: rgba(216, 74, 51, .06);
    border: 1px solid rgba(216, 74, 51, .3);
    border-radius: 12px;

    .ewo-secret-title {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 12px;
      line-height: 1.7;
      color: var(--ewo-link);

      .v-icon {
        color: var(--ewo-primary);
        margin-top: 2px;
      }
    }
    .ewo-secret-value {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 10px;
      padding: 10px 12px;
      background: var(--ewo-panel);
      border: 1px solid var(--ewo-line);
      border-radius: 10px;

      code {
        flex: 1;
        min-width: 0;
        font-family: 'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace;
        font-size: 12px;
        color: var(--ewo-ink);
        background: transparent;
        box-shadow: none;
        overflow-wrap: anywhere;

        &::before,
        &::after {
          content: none;
        }
      }
      .v-btn {
        flex-shrink: 0;
        color: var(--ewo-muted);
      }
    }
  }

  .ewo-connect {
    margin: 0 0 12px;

    .ewo-connect-row {
      display: flex;
      align-items: baseline;
      gap: 16px;
      padding: 8px 0;
      border-bottom: 1px solid var(--ewo-line);

      &:last-child {
        border-bottom: 0;
      }
    }
    dt {
      flex-shrink: 0;
      width: 72px;
      font-size: 12px;
      color: var(--ewo-muted);
    }
    dd {
      margin: 0;
      font-size: 13px;
      overflow-wrap: anywhere;
    }
    code {
      font-family: 'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace;
      font-size: 12px;
      color: var(--ewo-ink);
      background: transparent;
      box-shadow: none;

      &::before,
      &::after {
        content: none;
      }
    }
    a {
      color: var(--ewo-link);
    }
  }

  .ewo-command {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: var(--ewo-panel);
    border: 1px solid var(--ewo-line);
    border-radius: 12px;
    margin-bottom: 12px;

    pre {
      flex: 1;
      min-width: 0;
      margin: 0;
      font-family: 'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace;
      font-size: 12px;
      line-height: 1.7;
      color: var(--ewo-ink);
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    .v-btn {
      flex-shrink: 0;
      color: var(--ewo-muted);
    }
  }

  .ewo-token-list {
    background: transparent !important;
    padding: 0;

    .v-list-item {
      padding: 10px 12px;
      border: 1px solid var(--ewo-line);
      border-radius: 12px;

      & + .v-list-item {
        margin-top: 8px;
      }
      &.is-revoked {
        opacity: .55;
      }
    }
    .v-list-item__title {
      display: flex;
      align-items: baseline;
      gap: 8px;
      font-size: 14px;
      color: var(--ewo-ink);
    }
    .ewo-token-prefix {
      font-family: 'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace;
      font-size: 11px;
      color: var(--ewo-muted);
      background: transparent;
      box-shadow: none;

      &::before,
      &::after {
        content: none;
      }
    }
    .v-list-item__subtitle {
      font-size: 12px;
      color: var(--ewo-muted);
    }
    .v-btn:not(.v-btn--disabled) .v-icon {
      color: var(--ewo-link);
    }
  }
  .ewo-audit-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 16px;
    font-size: 13px;
    color: var(--ewo-link);
  }

  .ewo-stats {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;

    &.ewo-stats-counts {
      grid-template-columns: 1fr 1fr;
    }
  }
  .ewo-stat-label {
    font-size: 12px;
    color: var(--ewo-muted);
    margin-bottom: 2px;
  }
  .ewo-stat-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--ewo-ink);
  }

  .v-input--outlined .v-input__control .v-input__slot {
    background: var(--ewo-panel);
  }
  .v-menu__content .v-card__actions {
    background: transparent;
  }
}
</style>
