<template>
    <div>
        <b-alert 
            v-model="showAlert" 
            :variant="m.type" 
            v-for="(m,index) in messages" 
            :key="index"
            class="message">
            {{ m.message }}
        </b-alert>
    </div>
</template>

<script>
export default {
    props: {
        showAlert: Boolean
    },
    computed: {
      messages () {
        return this.$store.getters.messages
      }
    }
}
</script>

