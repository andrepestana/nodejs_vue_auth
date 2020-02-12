const ExtendedArray = require('../util/ExtendedArray.js')
const userDao = require('../dao/userDao')

function getValidationsForPasswordDefinition( password, messageForId, messageId, fieldName) {
    const minLength = 6
    let validationMessages = new ExtendedArray()
    validationMessages.pushDefined(required(password, messageForId, messageId, fieldName))
    validationMessages.pushDefined(stringMin(password, messageForId, messageId, fieldName, minLength))
    validationMessages.pushDefined(mustContainOneOf(password, messageForId, messageId, fieldName, 'A-Z', 'uppercase character'))
    validationMessages.pushDefined(mustContainOneOf(password, messageForId, messageId, fieldName, 'a-z', 'lowercase character'))
    validationMessages.pushDefined(mustContainOneOf(password, messageForId, messageId, fieldName, '0-9', 'number'))
    validationMessages.pushDefined(mustContainOneOf(password, messageForId, messageId, fieldName, regExpEscape('"\'-[]{}()*+!<=:?./\\^$|#@,'), 'special characters like "\'-[]{}()*+!<=:?./\\^$|#@,'))
    return validationMessages
}

module.exports = {
    validateUsername: function (username) {
        const messageForId = "username"
        const messageId = "usernameValidation"
        const fieldName = "Username"
        let validationMessages = new ExtendedArray()

        validationMessages.pushDefined(required(username, messageForId, messageId, fieldName))
        validationMessages.pushDefined(isEmail(username, messageForId, messageId, fieldName))

        return validationMessages
    },
    validateUsernameExists(username) {
        const messageForId = "username"
        const messageId = "usernameValidation"
        let validationMessages = new ExtendedArray()

        const persistedUser = userDao.retrieveUserByUsername(username)
        if(!persistedUser || !persistedUser.username) {
            validationMessages.push({
                messageForId,
                messageId,
                message: `Username not registered`,
                category: 'validationMessage'
            })
        }
        return validationMessages
    },
    validateUsernameForLogin: function (username) {
        const messageForId = "username"
        const messageId = "usernameValidation"
        const fieldName = "Username"
        let validationMessages = new ExtendedArray()

        validationMessages.pushDefined(required(username, messageForId, messageId, fieldName))
        
        return validationMessages
    },
    validatePassword: function (password) {
        const messageForId = "password"
        const messageId = "passwordValidation"
        const fieldName = "Password"

        let validationMessages = getValidationsForPasswordDefinition(password, messageForId, messageId, fieldName)

        return validationMessages
    },
    validateConfirmPassword: function (password, confirmPassword) {
        const messageForId = "confirm-password"
        const messageId = "confirmPasswordValidation"
        const fieldName = "Confirm Password"
        const passwordFieldName = "Password"
        let validationMessages = new ExtendedArray()

        validationMessages.pushDefined(required(confirmPassword, messageForId, messageId, fieldName))
        validationMessages.pushDefined(areEqual(confirmPassword, messageForId, messageId, fieldName, password, passwordFieldName))

        return validationMessages
    },
    validatePasswordForLogin: function (password) {
        const messageForId = "password"
        const messageId = "passwordValidation"
        const fieldName = "Password"
        let validationMessages = new ExtendedArray()

        validationMessages.pushDefined(required(password, messageForId, messageId, fieldName))
        return validationMessages
    },
    validateNewPassword: function (newPassword, oldPassword) {
        const messageForId = "new-password"
        const messageId = "newPasswordValidation"
        const fieldName = "New Password"
        
        let validationMessages = getValidationsForPasswordDefinition(newPassword, messageForId, messageId, fieldName)
        validationMessages.pushDefined(newPasswordMustNotBeEqualToPrevious(newPassword, messageForId, messageId, fieldName, oldPassword))

        return validationMessages
    },
    validateAge: function (age) {
        const messageForId = "age"
        const messageId = "ageValidation"
        const fieldName = "Age"
        const minAge = 18
        let validationMessages = new ExtendedArray()

        validationMessages.pushDefined(required(age, messageForId, messageId, fieldName))
        validationMessages.pushDefined(numberMin(age, messageForId, messageId, fieldName, minAge))

        return validationMessages
    },
    validateTerms: function (terms) {
        const messageForId = "terms"
        const messageId = "termsValidation"
        const fieldName = "Accepting Terms"
        let validationMessages = new ExtendedArray()
        validationMessages.pushDefined(required(terms, messageForId, messageId, fieldName))

        return validationMessages
    }
}
function required(input, messageForId, messageId, fieldName) {
    if (!input) {
        return {
            messageForId,
            messageId,
            message: `${fieldName} is required`,
            category: 'validationMessage'
        }
    }
}
function stringMin(input, messageForId, messageId, fieldName, min) {
    if (input && input.length < min) {
        return {
            messageForId,
            messageId,
            message: `${fieldName} should have at least ${min} characters`,
            category: 'validationMessage'
        }
    }
}
function numberMin(input, messageForId, messageId, fieldName, min) {
    if (input && input < min) {
        return {
            messageForId,
            messageId,
            message: `The minimum allowed ${fieldName} is ${min}`,
            category: 'validationMessage'
        }
    }
}
function isEmail(input, messageForId, messageId, fieldName) {
    if (input && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(input)) {
        return {
            messageForId,
            messageId,
            message: `${fieldName} must be a valid email`,
            category: 'validationMessage'
        }
    }
}
function areEqual(input, messageForId, messageId, fieldName, input2, fieldName2) {
    if (input && input2 && input !== input2) {
        return {
            messageForId,
            messageId,
            message: `${fieldName} is different from ${fieldName2}`,
            category: 'validationMessage'
        }
    }
}
function newPasswordMustNotBeEqualToPrevious(newPassword, messageForId, messageId, fieldName, oldPassword) {
    if (newPassword && oldPassword && newPassword === oldPassword) {
        return {
            messageForId,
            messageId,
            message: `${fieldName} must be different from previous password`,
            category: 'validationMessage'
        }
    }
}
function mustContainOneOf(input, messageForId, messageId, fieldName, chars, charsName) {
    if (input) {
        let re = new RegExp('[' + chars + ']');
        if (!re.test(input)) {
            return {
                messageForId,
                messageId,
                message: `${fieldName} must contain a ${charsName}`,
                category: 'validationMessage'
            }
        }
    }
}
function regExpEscape(literal_string) {
    return literal_string.replace(/["\'-[\]{}()*+!<=:?.\/\\^$|#\s,]/g, '\\$&');
}