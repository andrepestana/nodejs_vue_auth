<template>
    <div>
        <messages></messages>
        <h1>Email confirmation</h1>
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