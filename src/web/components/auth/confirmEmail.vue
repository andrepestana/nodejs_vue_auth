<template>
    <div>
        <messages></messages>
    </div>
</template>
<script>
    import messages from '../messages/messages.vue'
    export default {
        data() {
            return {
                emailConfirmationToken: ''
            }
        },
        created() {
            this.emailConfirmationToken = this.$route.query.emailConfirmationToken;
            this.$store.dispatch('confirmEmail', this.emailConfirmationToken)
        },
        components: {
            messages
        }
    }
</script>