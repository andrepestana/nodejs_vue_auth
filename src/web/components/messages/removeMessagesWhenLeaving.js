export default {
    destroyed() {
        console.log('destroyed')
        this.$store.commit('clearMessages')
    }
  }