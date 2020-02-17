import axios from './axios-auth'
import router from '../../router'

const state = {
  user: null,
  userSessions: []
}

const getters = {
  user(state) {
    return state.user
  },
  isAuthenticated(state) {
    return state.user && state.user.accessToken !== null
  },
  userSessions(state) {
    return state.userSessions
  }
}

const mutations = {
  storeAuthUser(state, userData) {
    state.user = userData
  },
  clearAuthData(state) {
    state.user = null
  },
  storeUserSessions(state, userSessions) {
    state.userSessions = userSessions
  }
}

const actions = {
  getUserSessions({commit}) {
    axios.get('/api/auth/userSessions')
    .then(res => {
      commit('storeUserSessions', res.data)
    })
    .catch(error => {
      commit('addMessage', {
        messageId: 'errorWhileGettingUserSessions',
        category: 'errorMessage',
        message: 'Error while getting user sessions: ' + error.response.status + ': ' + error.response.statusText
      })
    })
  },
  changePassword({commit}, authData) {
    commit('clearAllMessages')
    return new Promise((result, reject) => {
      axios.post('/api/auth/changePassword', authData)
        .then(resp => {
          commit('addMessages', resp.data.messages)
          result()
        })
        .catch(error => {
          if(error.response && 
            error.response.data && 
            error.response.data.messages)
            commit('addMessages', error.response.data.messages )
          else
            commit('addMessage', {
                messageId: 'changePasswordError',
                category: 'errorMessage',
                message: 'Change password error: ' + (error.response ? 
                                            (error.response.status + ': ' + error.response.statusText) : 
                                            error)
          })
          reject()
        })
    })  
  },
  setLogoutTimer({ dispatch }, { refreshToken, expirationTimeInMilli }) {
    setTimeout(() => {
      dispatch('logout', refreshToken)
    }, expirationTimeInMilli)
  },
  setRefreshTokenTimer({ dispatch }, expirationTimeInMilli) {
    setTimeout(() => {
      if (state.user) {
        axios.post('/api/auth/token', {
          refreshToken: state.user.refreshToken
        })
        .then(res => {
          dispatch('registerLoggedUser', res)
        })
        .catch(error => {
          dispatch('logout', state.user.refreshToken)
        })
      }
    }, expirationTimeInMilli - process.env.VUE_APP_TIME_TO_REFRESH_TOKEN_BEFORE_ACCESS_TOKEN_EXP_IN_MILLI)
  },

  signup({ commit, dispatch }, authData) {
    commit('clearAllMessages')
    return new Promise( (result,reject) => {
      axios.post('/api/auth/signup', authData)
        .then(resp => {
          commit('addMessages', resp.data.messages )
          dispatch('registerLoggedUser', resp)
          result()
        })
        .catch(error => {
          if(error.response && 
            error.response.data && 
            error.response.data.messages)
            commit('addMessages', error.response.data.messages )
          else
            commit('addMessage', {
                messageId: 'signupError',
                category: 'errorMessage',
                message: 'Signup error: ' + (error.response ? 
                                            (error.response.status + ': ' + error.response.statusText) : 
                                            error)
          })
          reject()
        })
    })
  },

  login({ commit, dispatch }, authData) {
    commit('clearAllMessages')
    return new Promise((result, rejection) => {
      axios.post('/api/auth/login', {
        username: authData.username,
        password: authData.password,
        returnSecureToken: true
      })
        .then(resp => {
          commit('addMessages', resp.data.messages )
          dispatch('registerLoggedUser', resp)
          result()
        })
        .catch(error => {
          if(error.response && 
            error.response.data && 
            error.response.data.messages)
            commit('addMessages', error.response.data.messages )
          else {
            commit('addMessage', {
                messageId: 'loginError',
                category: 'errorMessage',
                message: 'Login error: ' + (error.response ? 
                                            (error.response.status + ': ' + error.response.statusText) : 
                                            error)
            })
            rejection()
          }
        })
    })
  },

  registerLoggedUser({ commit, dispatch }, res) {
    const accessTokenExpirationDate = res.data.accessTokenExpirationDate
    const refreshTokenExpirationDate = res.data.refreshTokenExpirationDate
    const milliSecsToExpire = accessTokenExpirationDate - new Date().getTime()
    let authUserData = {
      accessToken: res.data.accessToken,
      refreshToken: res.data.refreshToken,
      username: res.data.username,
      accessTokenExpirationDateInMilli: accessTokenExpirationDate,
      refreshTokenExpirationDateInMilli: refreshTokenExpirationDate,
      timeToRefreshAccessTokenBeforeExpirationInMilli: process.env.VUE_APP_TIME_TO_REFRESH_TOKEN_BEFORE_ACCESS_TOKEN_EXP_IN_MILLI
    }
    commit('storeAuthUser', authUserData)
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + state.user.accessToken
    saveAuthDataToLocalStorage(authUserData)
    dispatch('setRefreshTokenTimer', milliSecsToExpire)
  },

  tryAutoLogin({ commit, dispatch }) {
    const refreshToken = localStorage.getItem('refreshToken')
    return axios.post('/api/auth/token', {
      refreshToken: refreshToken
    })
  },

  deregisterLoggedUser({ commit }) {
    commit('clearAuthData')
    removeAuthDataFromLocalStorage(localStorage)
    delete axios.defaults.headers.common["Authorization"]
  },
  logItOut({ commit, dispatch }, refreshToken) {
    
    axios.delete('/api/auth/logout', {
      params: { refreshToken: refreshToken }
    })
    .then(resp => {
      commit('addMessages', resp.data.messages )
      dispatch('getUserSessions')
    })
    .catch(error => {
      commit('addMessage', {
        messageId: 'logItOutError',
        category: 'errorMessage',
        message: 'Error while trying to log a user session out: ' + error
      })
    })
  },
  logout({ commit, dispatch }, refreshToken) {
    commit('clearAllMessages')
    return new Promise((result, rejection) => {
      axios.delete('/api/auth/logout', {
        params: { refreshToken }
      })
      .then(resp => {
        commit('addMessages', resp.data.messages )
        dispatch('deregisterLoggedUser')
        commit('addMessage', {
          messageId: 'loggedOut',
          category: 'warningMessage',
          message: 'You\'ve been logged out.'
        })
        result()
      })
      .catch(error => {
        if(error.response && 
          error.response.data && 
          error.response.data.messages)
          commit('addMessages', error.response.data.messages )
        else {
          commit('addMessage', {
              messageId: 'logoutError',
              category: 'errorMessage',
              message: 'Logout error: ' + (error.response ? 
                                          (error.response.status + ': ' + error.response.statusText) : 
                                          error)
          })
          rejection()
        }
      })
    })
  },
  confirmEmail({ commit, dispatch }, emailConfirmationToken) {
    commit('clearAllMessages')
    axios.get('/api/auth/confirmEmail', {
      params: { emailConfirmationToken }
    })
    .then(res => {
      commit('addMessages', res.data)
    })
    .catch(error => {
      if (!error.response) {
        commit('addMessage', {
          messageId: 'confirmEmailError',
          category: 'errorMessage',
          message: 'Confirm email error: ' + error
        })
      } else {
        commit('addMessage', {
          messageId: 'confirmEmailError',
          category: 'errorMessage',
          message: 'Confirm email error: ' + error.response.status + ': ' + error.response.statusText
        })
      }
    }) 
  },
  sendEmailToRetrievePassword({ commit, dispatch }, formData) {
    commit('clearAllMessages')
    return new Promise(( res, rej ) => {
      axios.post('/api/auth/sendEmailToRetrievePassword', formData)
        .then(resp => {
          commit('addMessages', resp.data)
          res()
        })
        .catch(error => {
          if (!error.response) {
            commit('addMessage', {
              messageId: 'recoverPasswordError',
              category: 'errorMessage',
              message: 'Recover password error: ' + error
            })
          } else {
            if (error.response.status === 422) {
              commit('addMessages', error.response.data)
            } else {
              commit('addMessage', {
                messageId: 'recoverPasswordError',
                category: 'errorMessage',
                message: 'Recover password error: ' + error.response.status + ': ' + error.response.statusText
              })
            }
          }
          rej()
        })
    }) 
  },
  changeLostPassword({ commit, dispatch }, formData) {
    commit('clearAllMessages')
    return new Promise((res, rej) => {
        axios.post('/api/auth/changeLostPassword', formData)
          .then(resp => {
            commit('addMessages', resp.data.messages )
            res()
          })
          .catch(error => {
            if(error.response && 
              error.response.data && 
              error.response.data.messages)
              commit('addMessages', resp.data.messages )
            else
              commit('addMessage', {
                  messageId: 'changeLostPasswordError',
                  category: 'errorMessage',
                  message: 'Change lost password error: ' + (error.response ? 
                                                            (error.response.status + ': ' + error.response.statusText) : 
                                                            error)
            })
            rej()
          }) 
    })
  }
}

function saveAuthDataToLocalStorage(authUserData) {
  localStorage.setItem('accessToken', authUserData.accessToken)
  localStorage.setItem('refreshToken', authUserData.refreshToken)
  localStorage.setItem('username', authUserData.username)
  localStorage.setItem('accessTokenExpirationDateInMilli', authUserData.accessTokenExpirationDateInMilli)
  localStorage.setItem('refreshTokenExpirationDateInMilli', authUserData.refreshTokenExpirationDateInMilli)
}
function removeAuthDataFromLocalStorage(localStorage) {
  localStorage.removeItem('refreshTokenExpirationDateInMilli')
  localStorage.removeItem('accessTokenExpirationDateInMilli')
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('username')
}

export default {
  state,
  mutations,
  actions,
  getters
}