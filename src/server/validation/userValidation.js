const ExtendedArray = require('../util/ExtendedArray.js')

module.exports = {
    validateUsername:  function(username) {
        const messageForId = "username"
        const messageId = "usernameValidation"
        const fieldName = "Username"
        let validationMessages = new ExtendedArray()
        validationMessages.pushDefined(required(username, messageForId, messageId, fieldName))

        return validationMessages
    },
    validatePassword: function(password) {
        const messageForId = "password"
        const messageId = "passwordValidation"
        const fieldName = "Password"
        let validationMessages = new ExtendedArray()
        validationMessages.pushDefined(required(password, messageForId, messageId, fieldName))

        return validationMessages
    },
    validateConfirmPassword: function(password, confirmPassword) {
        const messageForId = "confirm-password"
        const messageId = "confirmPasswordValidation"
        const fieldName = "Confirm Password"
        let validationMessages = new ExtendedArray()
        
        validationMessages.pushDefined(required(confirmPassword, messageForId, messageId, fieldName))
        if(validationMessages.length) return validationMessages
        
        if(password && confirmPassword && password !== confirmPassword) {
            validationMessages.pushDefined({
                messageForId,
                messageId,
                message: `${fieldName} is different from Password`,
                type: 'danger',
                category: 'validation'
            })
        }

        return validationMessages
    },
    validateAge: function(age) {
        const messageForId = "age"
        const messageId = "ageValidation"
        const fieldName = "Age"
        let validationMessages = new ExtendedArray()
        validationMessages.pushDefined(required(age, messageForId, messageId, fieldName))

        return validationMessages
    },
    validateTerms: function(terms) {
        const messageForId = "terms"
        const messageId = "termsValidation"
        const fieldName = "Accepting Terms"
        let validationMessages = new ExtendedArray()
        validationMessages.pushDefined(required(terms, messageForId, messageId, fieldName))
 
        return validationMessages
    }
}
function required(input, messageForId, messageId, fieldName) {
    if(!input) {
        return {
            messageForId,
            messageId,
            message: `${fieldName} is required`,
            type: 'danger',
            category: 'validation'
        }
    } else return null
}