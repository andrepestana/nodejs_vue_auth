import SigninPage from './signin.vue'
import SignupPage from './signup.vue'
import UserSessions from './userSessions.vue'
import ChangePassword from './changePassword.vue'

let routes = [
    { path: '/signup', component: SignupPage },
    { path: '/signin', component: SigninPage },
    { path: '/userSessions', component: UserSessions },
    { path: '/changePassword', component: ChangePassword }
]

export default routes