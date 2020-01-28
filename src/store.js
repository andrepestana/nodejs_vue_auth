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
    user: null
  },
  mutations: {
    authUser (state, userData) {
      state.accessToken = userData.token
      state.userId = userData.userId
    },
    storeUser (state, user) {
      state.user = user
    },
    clearAuthData (state) {
      state.accessToken = null
      state.userId = null
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
        username: authData.email,
        password: authData.password,
        returnSecureToken: true
      })
        .then(res => {
          console.log(res)
          commit('authUser', {
            token: res.data.accessToken,
            userId: res.data.localId
          })
          const now = new Date()
          const expirationDate = new Date(res.data.expiresAt * 1000)
          localStorage.setItem('token', res.data.accessToken)
          localStorage.setItem('userId', res.data.localId)
          localStorage.setItem('expirationDate', expirationDate)
          //dispatch('storeUser', authData)
          dispatch('setLogoutTimer', res.data.expiresAt)
        })
        .catch(error => console.log(error))
    },
    login ({commit, dispatch}, authData) {
      axios.post('/login', {
        username: authData.email,
        password: authData.password,
        returnSecureToken: true
      })
        .then(res => {
          if(res.status === 200) {
            const expirationDate = new Date(res.data.expiresAt * 1000)
            localStorage.setItem('token', res.data.accessToken)
            localStorage.setItem('userId', res.data.localId)
            localStorage.setItem('expirationDate', expirationDate)
            commit('authUser', {
              token: res.data.accessToken,
              userId: authData.email
            })
            const milliSecsToExpire = expirationDate - new Date().getTime()
            dispatch('setLogoutTimer', milliSecsToExpire)
            router.push('dashboard')
          } else {
            console.log('Login failed')
          }
        })
        .catch(error => console.log(error))
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
      commit('authUser', {
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
    // storeUser ({commit, state}, userData) {
    //   if (!state.accessToken) {
    //     return
    //   }
    //   globalAxios.post('/users.json' + '?auth=' + state.accessToken, userData)
    //     .then(res => console.log(res))
    //     .catch(error => console.log(error))
    // },
    fetchUser ({commit, state}) {
      if (!state.accessToken) {
        return
      }
      globalAxios.get('/users.json' + '?auth=' + state.accessToken)
        .then(res => {
          console.log(res)
          const data = res.data
          const users = []
          for (let key in data) {
            const user = data[key]
            user.id = key
            users.push(user)
          }
          console.log(users)
          commit('storeUser', users[0])
        })
        .catch(error => console.log(error))
    },
    fetchPosts ({commit, state}) {
      let options = {
        headers: {
          'Authorization': 'Bearer '+state.accessToken
        }
      }
      globalAxios.get('/posts',  options)
      .then(res => {
        console.log(res)
        const posts = res.data
        
        console.log(posts)
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
    }
  }
})