import Vue from 'vue'
import VueRouter from 'vue-router'
import store from './store'
import WelcomePage from './components/welcome/welcome.vue'
import DashboardPage from './components/dashboard/dashboard.vue'
import authRoutes from './components/auth/router'
import authUtil from './components/auth/authUtil'

Vue.use(VueRouter)

let routes = [
  { path: '/', component: WelcomePage },
  {
    path: '/dashboard',
    component: DashboardPage,
    beforeEnter (to, from, next) {
      authUtil.authRouteAccess(store, next)
    }
  }
]
routes = routes.concat(
  authRoutes
)

export default new VueRouter({mode: 'history', routes})