<template>
  <div id="dashboard">
    <h1>That's the dashboard!</h1>
    <p>You should only get here if you're authenticated!</p>
    <p v-if="email">Your email address: {{ email }}</p>
    
    <p v-for="(post,index) in posts" :key="index">{{ post.title }}</p>

  </div>
</template>

<script>
  import axios from 'axios';

  export default {
    computed: {
      email () {
        return !this.$store.getters.user ? false : this.$store.getters.user.email
      },
      posts () {
        return this.$store.getters.posts
      }
    },
    created () {
      this.$store.dispatch('fetchPosts')
      console.log('posts: ', this.$store.getters.posts)
    }
    
  }
</script>

<style scoped>
  h1, p {
    text-align: center;
  }

  p {
    color: red;
  }
</style>