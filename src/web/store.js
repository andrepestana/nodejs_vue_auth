import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import auth from './components/auth/store'


Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    posts: null,
    messages: []
  },
  mutations: {
    storePosts (state, posts) {
      state.posts = posts
    },
    clearMessages (state, message) {
      state.messages = []
    },
    addMessage (state, message) {
      state.messages.push(message)
    }
  },
  actions: {
    fetchPosts ({commit, state}) {
      let options = {
        headers: {
          'Authorization': 'Bearer '+state.auth.user.accessToken
        }
      }
      axios.get('/posts',  options)
      .then(res => {
 
        commit('storePosts', res.data)
        
      })
      .catch(error => console.log(error))
    }
  },
  getters: {
    posts (state) {
      return state.posts
    },
    messages (state) {
      return state.messages
    }
  },
  modules: {
    auth
  }
})
