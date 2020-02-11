<template>
  <div id="signin">
    <messages></messages>
    <div class="signin-form">
      <form @submit.prevent="onSubmit">
        <div class="input">
          <label for="username">Mail</label>
          <input
                  type="username"
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
        username: '',
        password: ''     
      }
    },
    methods: {
      onSubmit () {
        const formData = {
          username: this.username,
          password: this.password,
        }
        this.$store.dispatch('login', formData)
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
  .message {
    padding: auto;
    margin: 10px;
  }
  .signin-form {
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

  .input input {
    font: inherit;
    width: 100%;
    padding: 6px 12px;
    box-sizing: border-box;
    border: 1px solid #ccc;
  }

  .input input:focus {
    outline: none;
    border: 1px solid #521751;
    background-color: #eee;
  }

  .submit button {
    border: 1px solid #521751;
    color: #521751;
    padding: 10px 20px;
    font: inherit;
    cursor: pointer;
  }

  .submit button:hover,
  .submit button:active {
    background-color: #521751;
    color: white;
  }

  .submit button[disabled],
  .submit button[disabled]:hover,
  .submit button[disabled]:active {
    border: 1px solid #ccc;
    background-color: transparent;
    color: #ccc;
    cursor: not-allowed;
  }
</style>