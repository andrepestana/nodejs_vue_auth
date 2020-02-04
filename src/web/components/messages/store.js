const state = {
    messages: []
}

const mutations = { 
    clearMessages (state) {
        state.messages = []
    },
    addMessage (state, message) {
        state.messages.push(message)
    }
}

const getters = {
    messages (state) {
        return state.messages
    }
}

export default {
    state,
    mutations,
    getters
}