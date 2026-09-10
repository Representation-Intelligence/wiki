<template lang='pug'>
  v-app
    .unauthorized
      .unauthorized-content
        img(:src='`/_assets/brand/ewo-wordmark-${$vuetify.theme.dark ? "dark" : "light"}.svg`', alt='ewo')
        .headline {{$t('unauthorized.title')}}
        .subtitle-1.mt-3 {{$t('unauthorized.action.' + action)}}
        v-btn.mt-5(color='primary', href='/login', x-large)
          v-icon(left) mdi-login
          span {{$t('unauthorized.login')}}
        v-btn.mt-5(color='primary', href='javascript:window.history.go(-1);', outlined)
          v-icon(left) mdi-arrow-left
          span {{$t('unauthorized.goback')}}
</template>

<script>

export default {
  props: {
    action: {
      type: String,
      default: 'view'
    }
  },
  data() {
    return { }
  }
}
</script>

<style lang='scss'>

</style>
