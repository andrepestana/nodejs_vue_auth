const ExtendedArray = require('../util/ExtendedArray.js')

module.exports = {
    validateUsername:  function(username) {
        const messageForId = "username"
        const messageId = "usernameValidation"
        const fieldName = "Username"
        let validationMessages = new ExtendedArray()
        
        validationMessages.pushDefined(required(username, messageForId, messageId, fieldName))
        validationMessages.pushDefined(isEmail(username, messageForId, messageId, fieldName))
        
        return validationMessages
    },
    validatePassword: function(password) {
        const messageForId = "password"
        const messageId = "passwordValidation"
        const fieldName = "Password"
        const minLength = 6
        let validationMessages = new ExtendedArray()
        
        validationMessages.pushDefined(required(password, messageForId, messageId, fieldName))
        validationMessages.pushDefined(stringMin(password, messageForId, messageId, fieldName, minLength))
        // validationMessages.pushDefined(mustContainOneOf(password, messageForId, messageId, fieldName, 'A-Z', 'uppercase character'))
        // validationMessages.pushDefined(mustContainOneOf(password, messageForId, messageId, fieldName, 'a-z', 'lowercase character'))
        // validationMessages.pushDefined(mustContainOneOf(password, messageForId, messageId, fieldName, '0-9', 'number'))
        // validationMessages.pushDefined(mustContainOneOf(password, messageForId, messageId, fieldName, '!@#\$%\^\&*\)\(+=._-]+', 'special characters like !@#\$%\^\&*\)\(+=._-]+'))

        return validationMessages
    },
    validateConfirmPassword: function(password, confirmPassword) {
        const messageForId = "confirm-password"
        const messageId = "confirmPasswordValidation"
        const fieldName = "Confirm Password"
        const passwordFieldName = "Password"
        let validationMessages = new ExtendedArray()
        
        validationMessages.pushDefined(required(confirmPassword, messageForId, messageId, fieldName))
        validationMessages.pushDefined(areEqual(confirmPassword, messageForId, messageId, fieldName, password, passwordFieldName))
        
        return validationMessages
    },
    validateAge: function(age) {
        const messageForId = "age"
        const messageId = "ageValidation"
        const fieldName = "Age"
        const minAge = 18
        let validationMessages = new ExtendedArray()
        
        validationMessages.pushDefined(required(age, messageForId, messageId, fieldName))
        validationMessages.pushDefined(numberMin(age, messageForId, messageId, fieldName, minAge))

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
    } 
}
function stringMin(input, messageForId, messageId, fieldName, min) {
    if(input && input.length < min) {
        return {
            messageForId,
            messageId,
            message: `${fieldName} should have at least ${min} characters`,
            type: 'danger',
            category: 'validation'
        }
    } 
}
function numberMin(input, messageForId, messageId, fieldName, min) {
    if(input && input < min) {
        return {
            messageForId,
            messageId,
            message: `The minimum allowed ${fieldName} is ${min}`,
            type: 'danger',
            category: 'validation'
        }
    }
}
function isEmail(input, messageForId, messageId, fieldName) {
    if (input && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(input)) {
        return {
            messageForId,
            messageId,
            message: `${fieldName} must be a valid email`,
            type: 'danger',
            category: 'validation'
        }
    } 
}
function areEqual(input, messageForId, messageId, fieldName, input2, fieldName2) {
    if(input && input2 && input !== input2) {
        return {
            messageForId,
            messageId,
            message: `${fieldName} is different from ${fieldName2}`,
            type: 'danger',
            category: 'validation'
        }
    }
}
function mustContainOneOf(input, messageForId, messageId, fieldName, chars, charsName) {
    if(input) {
        let re = new RegExp('/^['+chars+']+$/');
        if(!re.test(input)) {
            return {
                messageForId,
                messageId,
                message: `${fieldName} must contain a ${charsName}`,
                type: 'danger',
                category: 'validation'
            }
        }
    }
}
