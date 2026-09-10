<template lang='pug'>
  v-app
    .onboarding
      .onboarding-content
        img(:src='`/_assets/brand/ewo-wordmark-${$vuetify.theme.dark ? "dark" : "light"}.svg`', alt='ewo')
        .headline {{ $t('welcome.title') }}
        .subtitle-1.mt-3 {{ $t('welcome.subtitle') }}
        div
          v-btn.mt-5.mx-3(color='primary', :href='`/e/` + locale + `/home`', x-large)
            v-icon(left) mdi-plus
            span {{ $t('welcome.createhome') }}
          v-btn.mt-5.mx-3(color='primary', href='/a', x-large)
            v-icon(left) mdi-view-dashboard
            span {{ $t('welcome.goadmin') }}

</template>

<script>

export default {
  props: {
    locale: {
      type: String,
      default: 'en'
    }
  },
  data() {
    return { }
  }
}
</script>

<style lang='scss'>

</style>
