<template lang='pug'>
  v-app
    .notfound
      .notfound-content
        img(:src='`/_assets/brand/ewo-wordmark-${$vuetify.theme.dark ? "dark" : "light"}.svg`', alt='ewo')
        .headline {{$t('notfound.title')}}
        .subheading.mt-3 {{$t('notfound.subtitle')}}
        v-btn.mt-5(color='primary', href='/', large, outlined)
          v-icon(left) mdi-home
          span {{$t('notfound.gohome')}}
</template>

<script>

export default {
  data() {
    return { }
  }
}
</script>

<style lang='scss'>

</style>
