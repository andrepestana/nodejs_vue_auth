import axios from 'axios'
import store from '../../store'

const instance = axios.create({
  baseURL: process.env.AUTH_URL
})

export default instance