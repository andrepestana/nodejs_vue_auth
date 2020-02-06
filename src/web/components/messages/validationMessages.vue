<template>
    <div>
        <div class="alert alert-danger" role="alert" v-if="messages.length">
           <ul class="list-unstyled">
               <li v-for="(message,index) in messages" :key="index">
                   {{ message.message }}
               </li>
           </ul>
        </div>
    </div>
</template>
<script>
export default {
    props: {
        messageForId: String
    },
    computed: {
      messages () {
        return this.$store.getters.messages.filter(m => m.messageForId === this.messageForId);
      } 
    }
}
</script>