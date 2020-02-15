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
    axios.get('/userSessions')
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
    return new Promise((res, rej) => {
      axios.post('/changePassword', authData)
        .then(resp => {
          commit('addMessage', {
            messageId: 'successOnChangingPassword',
            category: 'successMessage',
            message: 'Your password was successfully changed.'
          })
          res()
        })
        .catch(error => {
          if (error.response.status === 422) {
            commit('addMessages', error.response.data)
          } else {
            commit('addMessage', {
              messageId: 'errorWhileChangingPassword',
              category: 'errorMessage',
              message: 'Error while changing password: ' + error.response.status + ': ' + error.response.statusText
            })
          }
          rej()
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
        axios.post('/token', {
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
    axios.post('/signup', authData)
    .then(res => {
      dispatch('registerLoggedUser', res)
      router.push('/')
    })
    .catch(error => {
      if (!error.response) {
        commit('addMessage', {
          messageId: 'loginError',
          category: 'errorMessage',
          message: 'Login error: ' + error
        })
      } else if (error.response.status === 409) {
        commit('addMessage', {
          messageId: 'signupFailed',
          category: 'warningMessage',
          message: 'Username already exists!'
        })
      } else if (error.response.status === 422) {
        commit('addMessages', error.response.data)
      } else {
        commit('addMessage', {
          messageId: 'loginError',
          category: 'errorMessage',
          message: 'Login error: ' + error.response.status + ': ' + error.response.statusText
        })
      }
    })
  },

  login({ commit, dispatch }, authData) {
    commit('clearAllMessages')
    axios.post('/login', {
      username: authData.username,
      password: authData.password,
      returnSecureToken: true
    })
      .then(res => {
        dispatch('registerLoggedUser', res)
        router.push('/')
      })
      .catch(error => {
        if (!error.response) {
          commit('addMessage', {
            messageId: 'loginError',
            category: 'errorMessage',
            message: 'Login error: ' + error
          })
        } else if(error.response.status === 401) {
          commit('addMessage', {
            messageId: 'loginFailed',
            category: 'validationMessage',
            message: 'Username or Password invalid'
          })
        } else if(error.response.status === 422) {
          commit('addMessages', error.response.data)
        } else {
          commit('addMessage', {
            messageId: 'loginError',
            category: 'errorMessage',
            message: 'Login error: ' + error.response.status + ': ' + error.response.statusText
          })
        }
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
    return axios.post('/token', {
      refreshToken: refreshToken
    })
  },

  deregisterLoggedUser({ commit }) {
    commit('clearAuthData')
    removeAuthDataFromLocalStorage(localStorage)
    delete axios.defaults.headers.common["Authorization"]
  },
  logItOut({ commit, dispatch }, refreshToken) {
    axios.delete('/logout', {
      params: { refreshToken: refreshToken }
    })
    .then(res => {
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
    axios.delete('/logout', {
      params: { refreshToken }
    })
    .then(res => {
      dispatch('deregisterLoggedUser')
      commit('clearAllMessages')
      commit('addMessage', {
        messageId: 'loggedOut',
        category: 'warningMessage',
        message: 'You\'ve been logged out.'
      })
      router.replace('/signin')
    })
    .catch(error => {
      if (!error.response) {
        commit('addMessage', {
          messageId: 'logoutError',
          category: 'errorMessage',
          message: 'Login error: ' + error
        })
      } else {
        commit('addMessage', {
          messageId: 'logoutError',
          category: 'errorMessage',
          message: 'Login error: ' + error.response.status + ': ' + error.response.statusText
        })
      }
    })
  },
  confirmEmail({ commit, dispatch }, emailConfirmationToken) {
    commit('clearAllMessages')
    axios.get('/confirmEmail', {
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
      axios.post('/sendEmailToRetrievePassword', formData)
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

      axios.post('/changeLostPassword', formData)
        .then(resp => {
          commit('addMessage', {
            messageId: 'successOnChangingPassword',
            category: 'successMessage',
            message: 'Your password was successfully changed.'
          })
          res()
        })
        .catch(error => {
          if (!error.response) {
            commit('addMessage', {
              messageId: 'changeLostPasswordError',
              category: 'errorMessage',
              message: 'Change lost password error: ' + error
            })
          } else {
            if (error.response.status === 422) {
              commit('addMessages', error.response.data)
            } else {
              commit('addMessage', {
                messageId: 'changeLostPasswordError',
                category: 'errorMessage',
                message: 'Change lost password error: ' + error.response.status + ': ' + error.response.statusText
              })
            }
          }
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