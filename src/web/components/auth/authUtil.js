import store from '../../store' //main store

const authUtil = {
    authRouteAccess(next) {
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
                    if(refreshToken) store.dispatch('logout', refreshToken)
                    store.commit('addMessage', {
                        messageId: 'errorWhileAutoLoginMessage',
                        category: 'errorMessage',
                        message: 'Something wrong happened when trying to auto login:' + error
                    })
                })
            })
            .catch(error => {
                const refreshToken = localStorage.getItem('refreshToken')
                if(refreshToken) store.dispatch('logout', refreshToken)
                store.commit('addMessage', {
                    messageId: 'errorWhileAutoLoginMessage',
                    category: 'errorMessage',
                    message: 'Something wrong happened when trying to auto login:' + error
                })
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