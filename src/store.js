import Vue from 'vue'
import Vuex from 'vuex'
import axios from './axios-auth'
import globalAxios from 'axios'

import router from './router'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    accessToken: null,
    userId: null,
    user: null,
    posts: null,
    messages: []
  },
  mutations: {
    storeAuthUser (state, userData) {
      state.accessToken = userData.token
      state.userId = userData.userId
    },
    storeUser (state, user) {
      state.user = user
    },
    clearAuthData (state) {
      state.accessToken = null
      state.userId = null
    },
    storePosts (state, posts) {
      state.posts = posts
    },
    clearMessages (state, message) {
      state.messages = []
    },
    addMessage (state, message) {
      state.messages.push(message)
      console.log('messages', state.messages)
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
          console.log(res)
          commit('storeAuthUser', {
            token: res.data.accessToken,
            userId: res.data.username
          })
          const now = new Date()
          const expirationDate = new Date(res.data.expiresAt * 1000)
          localStorage.setItem('token', res.data.accessToken)
          localStorage.setItem('userId', res.data.username)
          localStorage.setItem('expirationDate', expirationDate)
          //dispatch('storeUser', authData)
          dispatch('setLogoutTimer', res.data.expiresAt)
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
            const expirationDate = new Date(res.data.expiresAt * 1000)
            localStorage.setItem('token', res.data.accessToken)
            localStorage.setItem('userId', res.data.username)
            localStorage.setItem('expirationDate', expirationDate)
            commit('storeAuthUser', {
              token: res.data.accessToken,
              userId: res.data.username
            })
            const milliSecsToExpire = expirationDate - new Date().getTime()
            dispatch('setLogoutTimer', milliSecsToExpire)
            router.push('dashboard')
          } else {
            console.log('Login failed')
            commit('addMessage', {
              messageId: 'loginFailed',
              type: 'warning',
              message: 'Username or Password invalid!'
            })
            
          }
        })
        .catch(error => {
          console.log(error)
          commit('addMessage', {
            messageId: 'loginFailed',
            type: 'warning',
            message: 'Username or Password invalid!'
          })
        })
    },
    tryAutoLogin ({commit}) {
      const token = localStorage.getItem('token')
      if (!token) {
        return
      }
      const expirationDate = localStorage.getItem('expirationDate')
      const now = new Date()
      if (now >= expirationDate) {
        return
      }
      const userId = localStorage.getItem('userId')
      commit('storeAuthUser', {
        token: token,
        userId: userId
      })
    },
    logout ({commit}) {
      commit('clearAuthData')
      localStorage.removeItem('expirationDate')
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      router.replace('/signin')
    },
    fetchPosts ({commit, state}) {
      let options = {
        headers: {
          'Authorization': 'Bearer '+state.accessToken
        }
      }
      globalAxios.get('/posts',  options)
      .then(res => {
 
        commit('storePosts', res.data)
        
        console.log(state.posts)
        //commit('storeUser', users[0])
      })
      .catch(error => console.log(error))
    }
  },
  getters: {
    user (state) {
      return state.user
    },
    isAuthenticated (state) {
      return state.accessToken !== null
    },
    posts (state) {
      return state.posts
    },
    messages (state) {
      return state.messages
    }
  }
})