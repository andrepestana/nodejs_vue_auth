<template>
    <div class="user-session-box">
        <h1 class="text-center">User sessions</h1>
        <messages></messages>
        <div class="container border border-dark">
            <div class="row bg-dark text-white">
                <div class="col-2 border border-dark p-2 text-wrap">Session started</div>
                <div class="col-2 border border-dark p-2 text-wrap">Session expiration time</div>
                <div class="col-4 border border-dark p-2 text-wrap">User Agent</div>
                <div class="col-2 border border-dark p-2 text-wrap">Remote Address</div>
                <div class="col-1 border border-dark p-2 text-wrap">Revoked</div>
                <div class="col-1 border border-dark p-2 text-wrap">Action</div>
            </div>
            <div class="row" 
                v-for="(userSession,index) in userSessions" 
                :key="index"
                v-bind:class="{ 'alert-warning': isCurrentSession(index) }">
                <div class="col-2 border border-dark p-2 text-wrap">{{ new Date(userSession.refreshTokenCreatedDate) | formatDateTime }}</div>
                <div class="col-2 border border-dark p-2 text-wrap">{{ new Date(userSession.refreshTokenExpirationDate) | formatDateTime }}</div>
                <div class="col-4 border border-dark p-2 text-wrap">{{ userSession.clientInfo.userAgent }}</div>
                <div class="col-2 border border-dark p-2 text-wrap">{{ userSession.remoteAddress }}</div>
                <div class="col-1 border border-dark p-2 text-wrap">{{ userSession.revoked | yesOrNo }}</div>
                <div class="col-1 border border-dark p-2 text-wrap"><a href="#" v-if="!userSession.revoked && !isCurrentSession(index)" @click="logItOut(index)">Log it out</a></div>
            </div>
        </div>
    </div>
</template>
<script>
  import messages from '../messages/messages.vue'
  export default {
      created() {
          this.$store.dispatch('getUserSessions')
      },
      computed: {
        userSessions () {
          return this.$store.getters.userSessions
        }      
      },
      methods: {
          logItOut(index) {
              this.$store.dispatch('logItOut', this.userSessions[index].refreshToken)
          },
          isCurrentSession(index) {
            return this.userSessions[index].refreshToken === this.$store.getters.user.refreshToken 
          }
      },
      components: {
          messages
      }
  }
</script>
<style scoped>
  .user-session-box {
    margin: 20px;
    border: 1px solid #eee;
    padding: 20px;
    box-shadow: 0 2px 3px #ccc;
  }
</style>