import axios from './axios-auth'
import router from '../../router'

const state = {
    user: null,

}

const getters = {
    user (state) {
        return state.user
      },
    isAuthenticated (state) {
        return state.user && state.user.accessToken !== null
    }
}

const mutations = {
    storeAuthUser (state, userData) {
        state.user = userData
    },
    clearAuthData (state) {
        state.user = null
    },
    showRefreshTokenMessage (state, payload) {
      state.user ? state.user.showRefreshTokenMessage = payload : false
    }
}

const actions = {
      setLogoutTimer ({dispatch}, {refreshToken, expirationTimeInMilli}) {
        setTimeout(() => {
          dispatch('logout', refreshToken)
        }, expirationTimeInMilli)
      },
      setRefreshTokenTimer ({commit}, expirationTimeInMilli) {
        setTimeout(() => {
          commit('showRefreshTokenMessage', true)
        }, expirationTimeInMilli - process.env.VUE_APP_ASK_USER_TO_REFRESH_TOKEN_BEFORE_ACCESS_TOKEN_EXP_IN_MILLI)
      },
      
      signup ({commit, dispatch}, authData) {
        commit('clearMessages')
        axios.post('/signup', {
          username: authData.username,
          password: authData.password,
          returnSecureToken: true
        })
        .then(res => {
          dispatch('logUserIn', res)
        })
        .catch(error => {
          if(!error.response) {
            commit('addMessage', {
              messageId: 'loginError',
              type: 'danger',
              message: 'Login error: ' + error
            })
          } else if(error.response.status === 409) {
              commit('addMessage', {
                  messageId: 'signupFailed',
                  type: 'warning',
                  message: 'Username already exists!'
              })
          } else {
            commit('addMessage', {
              messageId: 'loginError',
              type: 'danger',
              message: 'Login error: ' + error.response.status + ': ' + error.response.statusText
            })
          }
        })
      },
      
      login ({commit, dispatch}, authData) {
        commit('clearMessages')
        axios.post('/login', {
          username: authData.username,
          password: authData.password,
          returnSecureToken: true
        })
        .then(res => {
            dispatch('logUserIn', res)
        })
        .catch(error => {
          if(!error.response) {
            commit('addMessage', {
              messageId: 'loginError',
              type: 'danger',
              message: 'Login error: ' + error
            })
          } else if(error.response.status === 401) {
            commit('addMessage', {
              messageId: 'loginFailed',
              type: 'warning',
              message: 'Username or Password invalid!'
            })
          } else {
            commit('addMessage', {
              messageId: 'loginError',
              type: 'danger',
              message: 'Login error: ' + error.response.status + ': ' + error.response.statusText
            })
          }
        })
      },

      logUserIn({commit, dispatch}, res) {
        const expirationDate = new Date(res.data.expiresAt * 1000)
        const milliSecsToExpire = expirationDate - new Date().getTime()
        commit('storeAuthUser', {
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          username: res.data.username,
          expirationDateInMilli: expirationDate.getTime(),
          showRefreshTokenMessage: false
        })
        axios.defaults.headers.common['Authorization'] = 'Bearer '+state.user.accessToken
        localStorage.setItem('accessToken', res.data.accessToken)
        localStorage.setItem('refreshToken', res.data.refreshToken)
        localStorage.setItem('username', res.data.username)
        localStorage.setItem('expirationDateInMilli', expirationDate.getTime())
        dispatch('setLogoutTimer', {refreshToken: res.data.refreshToken, expirationTimeInMilli: milliSecsToExpire})
        dispatch('setRefreshTokenTimer', milliSecsToExpire)
        
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
        const refreshToken = localStorage.getItem('refreshToken')
        commit('storeAuthUser', {
          accessToken: accessToken,
          username: username,
          refreshToken: refreshToken,
          expirationDateInMilli: expirationDateInMilli,
          showRefreshTokenMessage: false
        })
        axios.defaults.headers.common['Authorization'] = 'Bearer '+state.user.accessToken
      },

      logout ({commit}, refreshToken) {
        axios.delete('/logout', {
          refreshToken: refreshToken
        })
        .then(res => {
          commit('clearMessages')
          commit('clearAuthData')
          localStorage.removeItem('expirationDateInMilli')
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('username')
          delete axios.defaults.headers.common["Authorization"]
          
          commit('addMessage', {
            messageId: 'loggedOut',
            type: 'warning',
            message: 'You\'ve been logged out.'
          })
          router.replace('/signin')
        })
        .catch(error => {
          if(!error.response) {
            commit('addMessage', {
              messageId: 'logoutError',
              type: 'danger',
              message: 'Login error: ' + error
            })
          } else {
            commit('addMessage', {
              messageId: 'logoutError',
              type: 'danger',
              message: 'Login error: ' + error.response.status + ': ' + error.response.statusText
            })
          }
        })
      }
}

export default {
    state,
    mutations,
    actions,
    getters
}