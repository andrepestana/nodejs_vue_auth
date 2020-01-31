const authUtil = {
    authRouteAccess(store, next) {
        if (store.state.auth.user && store.state.auth.user.accessToken) {
            next()
        } else {
            next('/signin')
        }
    }
}

export default authUtil