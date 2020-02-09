import SigninPage from './signin.vue'
import SignupPage from './signup.vue'
import UserSessions from './userSessions.vue'

let routes = [
    { path: '/signup', component: SignupPage },
    { path: '/signin', component: SigninPage },
    { path: '/userSessions', component: UserSessions }
]

export default routes