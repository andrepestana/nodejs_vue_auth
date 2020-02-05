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
    }
}

const actions = {
      setLogoutTimer ({dispatch}, {refreshToken, expirationTimeInMilli}) {
        setTimeout(() => {
          dispatch('logout', refreshToken)
        }, expirationTimeInMilli)
      },
      setRefreshTokenTimer ({dispatch}, expirationTimeInMilli) {
        setTimeout(() => {
          if(state.user) {
            axios.post('/token', {
              refreshToken: state.user.refreshToken            
            })
            .then(res => {
              dispatch('logUserIn', res)
            })
            .catch(error => {
              dispatch('logout', error)
            })
          }
        }, expirationTimeInMilli - process.env.VUE_APP_TIME_TO_REFRESH_TOKEN_BEFORE_ACCESS_TOKEN_EXP_IN_MILLI)
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
          router.push('/')
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
            router.push('/')
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
        const accessTokenExpirationDate = new Date(res.data.accessTokenExpiresAt * 1000)
        const refreshTokenExpirationDate = new Date(res.data.refreshTokenExpiresAt * 1000)
        const milliSecsToExpire = accessTokenExpirationDate - new Date().getTime()
        commit('storeAuthUser', {
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          username: res.data.username,
          accessTokenExpirationDateInMilli: accessTokenExpirationDate.getTime(),
          refreshTokenExpirationDateInMilli: refreshTokenExpirationDate.getTime(),
          timeToRefreshAccessTokenBeforeExpirationInMilli: process.env.VUE_APP_TIME_TO_REFRESH_TOKEN_BEFORE_ACCESS_TOKEN_EXP_IN_MILLI
        })
        axios.defaults.headers.common['Authorization'] = 'Bearer '+state.user.accessToken
        localStorage.setItem('accessToken', res.data.accessToken)
        localStorage.setItem('refreshToken', res.data.refreshToken)
        localStorage.setItem('username', res.data.username)
        localStorage.setItem('accessTokenExpirationDateInMilli', accessTokenExpirationDate.getTime())
        localStorage.setItem('refreshTokenExpirationDateInMilli', refreshTokenExpirationDate.getTime())
        
        dispatch('setRefreshTokenTimer', milliSecsToExpire)
      },

      tryAutoLogin ({commit, dispatch}) {
       
        const refreshTokenExpirationDateInMilli = localStorage.getItem('refreshTokenExpirationDateInMilli')
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
          commit('clearAuthData')
          return
        }
        const now = new Date()
        if (now.getTime() >= refreshTokenExpirationDateInMilli) {
          commit('clearAuthData')
          return
        }
        const accessToken = localStorage.getItem('accessToken')
        const accessTokenExpirationDateInMilli = localStorage.getItem('accessTokenExpirationDateInMilli')
        const username = localStorage.getItem('username')

        if (now.getTime() >= accessTokenExpirationDateInMilli) {
          //refreshToken
          axios.post('/token', {
            refreshToken: refreshToken            
          })
          .then(res => {
            dispatch('logUserIn', res)
            router.push('/dashboard')
          })
          .catch(error => {
            dispatch('logout', error)
          })
          return
        }
        
        commit('storeAuthUser', {
          accessToken: accessToken,
          username: username,
          refreshToken: refreshToken,
          accessTokenExpirationDateInMilli: accessTokenExpirationDateInMilli
        })
        axios.defaults.headers.common['Authorization'] = 'Bearer '+state.user.accessToken
        
        const accessTokenMilliSecsFromNowToExpire = accessTokenExpirationDateInMilli - new Date().getTime()
        dispatch('setRefreshTokenTimer', accessTokenMilliSecsFromNowToExpire)
        
      },

      logout ({commit}) {
        axios.delete('/logout', {
          params: { refreshToken: state.user.refreshToken }
        })
        .then(res => {
          commit('clearMessages')
          commit('clearAuthData')
          localStorage.removeItem('refreshTokenExpirationDateInMilli')
          localStorage.removeItem('accessTokenExpirationDateInMilli')
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