import Vue from 'vue'
import Vuex from 'vuex'
import axios from './axios-auth'
import globalAxios from 'axios'

import router from './router'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: null,
    posts: null,
    messages: []
  },
  mutations: {
    storeAuthUser (state, userData) {
      state.user = userData
    },
    clearAuthData (state) {
      state.user = null
    },
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
    setLogoutTimer ({commit}, expirationTime) {
      setTimeout(() => {
        commit('clearAuthData')
      }, expirationTime)
    },
    signup ({commit, dispatch}, authData) {
      axios.post('/signup', {
        username: authData.username,
        password: authData.password,
        returnSecureToken: true
      })
        .then(res => {
          ///////////////
          dispatch('logUserIn', res)
        })
        .catch(error => console.log(error))
    },
    login ({commit, dispatch}, authData) {
      commit('clearMessages')
      axios.post('/login', {
        username: authData.username,
        password: authData.password,
        returnSecureToken: true
      })
        .then(res => {
          if(res.status === 200) {
            ///////////////
            dispatch('logUserIn', res)
          } else {
            commit('addMessage', {
              messageId: 'loginFailed',
              type: 'warning',
              message: 'Username or Password invalid!'
            })
            
          }
        })
        .catch(error => {
          commit('addMessage', {
            messageId: 'loginFailed',
            type: 'warning',
            message: 'Username or Password invalid!'
          })
        })
    },
    logUserIn({commit, dispatch}, res) {
      commit('storeAuthUser', {
        accessToken: res.data.accessToken,
        username: res.data.username
      })
      const expirationDate = new Date(res.data.expiresAt * 1000)
      localStorage.setItem('accessToken', res.data.accessToken)
      localStorage.setItem('username', res.data.username)
      localStorage.setItem('expirationDateInMilli', expirationDate.getTime())
      const milliSecsToExpire = expirationDate - new Date().getTime()
      dispatch('setLogoutTimer', milliSecsToExpire)
      router.push('dashboard')
    },
    tryAutoLogin ({commit}) {
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) {
        return
      }
      const expirationDateInMilli = localStorage.getItem('expirationDateInMilli')
      const now = new Date()
      if (now.getTime() >= expirationDateInMilli) {
        return
      }
      const username = localStorage.getItem('username')
      commit('storeAuthUser', {
        accessToken: accessToken,
        username: username
      })
    },
    logout ({commit}) {
      commit('clearAuthData')
      localStorage.removeItem('expirationDate')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('username')
      router.replace('/signin')
    },
    fetchPosts ({commit, state}) {
      let options = {
        headers: {
          'Authorization': 'Bearer '+state.user.accessToken
        }
      }
      globalAxios.get('/posts',  options)
      .then(res => {
 
        commit('storePosts', res.data)
        
      })
      .catch(error => console.log(error))
    }
  },
  getters: {
    user (state) {
      return state.user
    },
    isAuthenticated (state) {
      return state.user && state.user.accessToken !== null
    },
    posts (state) {
      return state.posts
    },
    messages (state) {
      return state.messages
    }
  }
})
