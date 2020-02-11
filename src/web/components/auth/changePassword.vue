<template>
    <div id="signup">
        <messages></messages>
        <div class="change-password-form" v-if="!changePasswordSuccess">
            <form @submit.prevent="onSubmit">
                <input
                        type="hidden"
                        id="username"
                        name="username"
                        v-model="username">
                <div class="input">
                    <label for="password">Password</label>
                    <input
                            type="password"
                            id="password"
                            name="password"
                            v-model="password"
                            @focus="clearMessageById($event)">
                    <validation-messages messageForId="password"></validation-messages>
                </div>
                <div class="input">
                    <label for="new-password">New Password</label>
                    <input
                            type="password"
                            id="new-password"
                            name="newPassword   "
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
                    <button type="submit" class="btn btn-dark">Submit</button>
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
                confirmPassword: '',

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
            }
        },
        computed: {
            username() {
                return this.$store.getters.user.username
            },
            changePasswordSuccess() {
                return this.$store.getters.changePasswordSuccess
            }
        },
        components: {
            messages,
            validationMessages
        },
        created() {
            return this.$store.commit('setChangePasswordSuccess', false)
        }
    }
</script>
<style scoped>
  .change-password-form {
    width: 400px;
    margin: 30px auto;
    border: 1px solid #eee;
    padding: 20px;
    box-shadow: 0 2px 3px #ccc;
  }
  
  .input {
    margin: 10px auto;
  }

  .input label {
    display: block;
    color: #4e4e4e;
    margin-bottom: 6px;
  }

  .input.inline label {
    display: inline;
  }

  .input input {
    font: inherit;
    width: 100%;
    padding: 6px 12px;
    box-sizing: border-box;
    border: 1px solid #ccc;
  }

  .input.inline input {
    width: auto;
  }

  .input input:focus {
    outline: none;
    border: 1px solid #521751;
    background-color: #eee;
  }

</style>