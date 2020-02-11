<template>
  <div id="signup">
    <messages></messages>
    <div class="signup-form">
      <form @submit.prevent="onSubmit">
        <div class="input">
          <label for="username">Mail</label>
          <input  refs="username"
                  type="text"
                  id="username"
                  v-model="username"
                  @focus="clearMessageById($event)">
          <validation-messages messageForId="username"></validation-messages>
        </div>
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
          <label for="confirm-password">Confirm Password</label>
          <input
                  type="password"
                  id="confirm-password"
                  v-model="confirmPassword"
                  @focus="clearMessageById($event)">
          <validation-messages messageForId="confirm-password"></validation-messages>  
        </div>
        <div class="input">
          <label for="age">Your Age</label>
          <input
                  type="number"
                  id="age"
                  v-model.number="age"
                  @focus="clearMessageById($event)">
          <validation-messages messageForId="age"></validation-messages>
        </div>
        <div class="input inline">
          <input  type="checkbox" 
                  id="terms" 
                  v-model="terms"
                  @click="clearMessageById($event)">
          <label for="terms">Accept Terms of Use</label>
          <validation-messages messageForId="terms"></validation-messages>
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
        username: '',
        age: null,
        password: '',
        confirmPassword: '',
        terms: false
      }
    },
    methods: {
      onSubmit () {
        const formData = {
          username: this.username,
          password: this.password,
          confirmPassword: this.confirmPassword,
          age: this.age,
          terms: this.terms
        }
        this.$store.dispatch('signup', formData)
      }
    },
    created() {
      if(this.$store.getters.isAuthenticated) {
        this.$router.push('/dashboard')
      }
    },
    components: {
        messages,
        validationMessages
    }
  }
</script>

<style scoped>
  .signup-form {
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

  .input select {
    border: 1px solid #ccc;
    font: inherit;
  }

</style>