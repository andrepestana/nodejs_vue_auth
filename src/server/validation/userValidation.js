module.exports = {
    validateUsername:  function(username) {
        const messageForId = "username"
        const messageId = "usernameValidation"
        const fieldName = "Username"
        let validationMessages = []
        validationMessages.push(required(username, messageForId, messageId, fieldName))

        return validationMessages
    },
    validatePassword: function(password) {
        const messageForId = "password"
        const messageId = "passwordValidation"
        const fieldName = "Password"
        let validationMessages = []
        validationMessages.push(required(password, messageForId, messageId, fieldName))

        return validationMessages
    },
    validateAge: function(age) {
        const messageForId = "age"
        const messageId = "ageValidation"
        const fieldName = "Age"
        let validationMessages = []
        validationMessages.push(required(age, messageForId, messageId, fieldName))

        return validationMessages
    }
}
function required(input, messageForId, messageId, fieldName) {
    if(!input) {
        return {
            messageForId,
            messageId,
            message: `${fieldName} is required`
        }
    }
}