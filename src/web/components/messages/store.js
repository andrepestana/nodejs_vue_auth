const state = {
    messages: []
}

const mutations = { 
    clearMessages (state) {
        state.messages = []
    },
    addMessage (state, message) {
        state.messages.push(message)
    },
    addMessages (state, messages) {
        state.messages = state.messages.concat(messages)
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