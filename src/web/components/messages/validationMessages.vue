<template>
    <div>
        <div class="alert alert-danger" role="alert">
           {{ message }}
        </div>
    </div>
</template>
<script>
export default {
    props: {
        messageForId: String
    },
    computed: {
      message () {
        
        this.$store.getters.messages.forEach(m => {
            console.log(m.messageForId, this.messageForId)
            if(m.messageForId === this.messageForId) {
                console.log('jjjjjj')
                return m
            }
        });
        return {};
      } 
    }
}
</script>