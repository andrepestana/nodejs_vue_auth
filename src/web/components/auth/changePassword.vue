<template>
    <div id="signup">
        <messages></messages>
        <div class="signup-form">
            <form @submit.prevent="onSubmit">
                <div class="input">
                    <label for="password">Password</label>
                    <input
                            type="password"
                            id="password"
                            v-model="password"
                            @focus="clearMessageById($event)">
                    <validation-messages messageForId="password"></validation-messages>
                </div>
                <div class="input">
                    <label for="new-password">New Password</label>
                    <input
                            type="password"
                            id="new-password"
                            v-model="newPassword"
                            @focus="clearMessageById($event)">
                    <validation-messages messageForId="new-password"></validation-messages>  
                </div>
                <div class="input">
                    <label for="confirm-password">Confirm Password</label>
                    <input
                            type="password"
                            id="confirm-password"
                            v-model="confirmPassword"
                            @focus="clearMessageById($event)">
                    <validation-messages messageForId="confirm-password"></validation-messages>  
                </div>
                <div class="submit">
                    <button type="submit">Submit</button>
                </div>
            </form>
        </div>
    </div>
</template>
<script>
    import messages from '../messages/messages.vue'
    import validationMessages from '../messages/validationMessages.vue'
    import removeMessagesWhenLeaving from '../messages/removeMessagesWhenLeaving.js'

    export default {
        mixins: [removeMessagesWhenLeaving],
        data () {
            return {
                password: '',
                newPassword: '',
                confirmPassword: ''
            }
        },
        methods: {
            onSubmit () {
                const formData = {
                    password: this.password,
                    newPassword: this.newPassword,
                    confirmPassword: this.confirmPassword
                }
                this.$store.dispatch('changePassword', formData)
            },
            clearMessageById(e){
                this.$store.commit('clearMessagesById', e.target.id)
            }
        },
        components: {
            messages,
            validationMessages
        }
    }
</script>