import SigninPage from './signin.vue'
import SignupPage from './signup.vue'
import UserSessions from './userSessions.vue'
import ChangePassword from './changePassword.vue'
import ConfirmEmail from './confirmEmail.vue'
import authUtil from './authUtil'


let routes = [
    { path: '/signup', component: SignupPage },
    { path: '/signin', component: SigninPage },
    { 
        path: '/userSessions', 
        component: UserSessions,
        beforeEnter (to, from, next) {
            authUtil.authRouteAccess(next)
        }  
    },
    { 
        path: '/changePassword', 
        component: ChangePassword,
        beforeEnter (to, from, next) {
            authUtil.authRouteAccess(next)
        } 
    },
    { path: '/confirmEmail', component: ConfirmEmail }
]

export default routes