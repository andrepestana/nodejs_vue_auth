const authUtil = {
    authRouteAccess(store, next) {
        if (store.state.auth && 
            store.state.auth.user && 
            store.state.auth.user.accessToken) {
            next()
        } else {
            store.commit('addMessage', {
                messageId: 'logInBeforeContinuingMesage',
                category: 'warningMessage',
                message: 'Please log in before continuing'
              })
            next('/signin')
        }
    }
}

export default authUtil