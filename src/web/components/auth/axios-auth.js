import axios from 'axios'
import store from '../../store'

const instance = axios.create({
  baseURL: 'http://localhost:4000/'
})

export default instance