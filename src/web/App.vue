<template>
  <div id="app">
    <app-header />
    <new-access-token 
      v-if="showRefreshTokenMessage"
      :start-from="timeToShowRefreshAccessTokenBeforeExpirationInSecs">
    </new-access-token>
    <router-view></router-view>
  </div>
</template>

<script>
  import Header from './components/header/header.vue'
  import NewAccessToken from './components/auth/newAccessToken.vue'
  
  export default {
    name: 'app',
    components: {
      'app-header': Header,
      'new-access-token': NewAccessToken
    },
    created () {
      this.$store.dispatch('tryAutoLogin')
    },
    computed: {
      showRefreshTokenMessage () {
        return !this.$store.getters.user ? false : this.$store.getters.user.showRefreshTokenMessage
      },
      timeToShowRefreshAccessTokenBeforeExpirationInSecs() {
        return !this.$store.getters.user ? false : this.$store.getters.user.timeToShowRefreshAccessTokenBeforeExpirationInMilli/1000
      }
    }
  }
</script>

<style>
  body, html {
    margin: 0px;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  }
</style>