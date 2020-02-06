export default {
    destroyed() {
        this.$store.commit('clearAllMessages')
    }
  }