<template>
    <div>
        <div class="bg-danger text-white" role="alert" v-if="messages.length">
            <ul>
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
    },
    methods: {
        clearAllMessages() {
            this.$store.commit('clearAllMessages')
        },
        clearMessageById(e){
            this.$store.commit('clearMessagesById', e.target.id)
        }
    }
}
</script>
<style scoped>
ul {
    list-style-type: square;
    padding: 4px;
    padding-left: 25px;
}
</style>