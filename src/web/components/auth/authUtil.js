import store from '../../store' //main store

const authUtil = {
    authRouteAccess(next) {

        //TODO move this to apply to any route(public or not): app is not auto authenticating when access public route
        if (store.state.auth && 
            !store.state.auth.user) {
            store.dispatch('tryAutoLogin')
                .then(res => {
                    store.dispatch('registerLoggedUser', res)
                    .then(res => {
                        next()
                    })
                    .catch(error => {
                        const refreshToken = localStorage.getItem('refreshToken')
                        if(refreshToken) { 
                            store.dispatch('logout', refreshToken)
                                .then(() => {
                                    store.commit('addMessage', {
                                        messageId: 'errorWhileAutoLoginMessage',
                                        category: 'errorMessage',
                                        message: 'Something wrong happened when trying to auto login:' + error
                                    })
                                })
                                .catch(() => {})
                        }
                    })
                })
                .catch(error => {
                    const refreshToken = localStorage.getItem('refreshToken')
                    if(refreshToken) {
                        store.dispatch('logout', refreshToken)
                            .then(() => {
                                store.commit('addMessage', {
                                    messageId: 'errorWhileAutoLoginMessage',
                                    category: 'errorMessage',
                                    message: 'Something wrong happened when trying to auto login:' + error
                                })
                            })
                            .catch(() => {})
                    }
                })
            
        } else if (store.state.auth && 
            store.state.auth.user && 
            store.state.auth.user.accessToken) {
            next()
        } else {
            store.commit('clearAllMessages')
            store.commit('addMessage', {
                messageId: 'logInBeforeContinuingMessage',
                category: 'warningMessage',
                message: 'Please log in before continuing'
              })
            next('/signin')
        }
    }, 
    authRouteForRetrievingPassword(to, next) {
        if (to.query.retrievePasswordToken) {

            next()
        } else {
            next('/signin')
        }
    }
}

export default authUtil