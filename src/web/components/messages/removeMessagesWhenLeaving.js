export default {
    destroyed() {
        this.$store.commit('clearMessages')
    }
  }