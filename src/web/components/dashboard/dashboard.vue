<template>
  <div id="dashboard">
    <h1>Dashboard</h1>
    <p v-if="username">Logged as {{ username }}</p>
    
    <p v-for="(post,index) in posts" :key="index">{{ post.title }}</p>

  </div>
</template>

<script>
  import axios from 'axios';

  export default {
    computed: {
      username () {
        console.log(this.$store.getters.user)

        return !this.$store.getters.user ? false : this.$store.getters.user.username
      },
      posts () {
        return this.$store.getters.posts
      }
    },
    created () {
      this.$store.dispatch('fetchPosts')
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