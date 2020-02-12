let users = []

const userDao = {
    saveUser(user) {
        if (process.env.FAKE_PERSISTENT_DATA) {
            let foundIndex = users.findIndex(u => u.username == user.username);
            if(foundIndex === -1)
                users.push(user)
            else {
                users[foundIndex] = user;
            }
        } else {
            throw 'Not implemented yet for non fake persistent data'
        }
    },
    update(user) {
        if (process.env.FAKE_PERSISTENT_DATA) {
            let foundIndex = users.findIndex(u => u.username == user.username);
            if(foundIndex !== -1) {
               users[foundIndex] = user;
            }
        } else {
            throw 'Not implemented yet for non fake persistent data'
        }
    },
    retrieveUserByUsername(username) {
        if (process.env.FAKE_PERSISTENT_DATA) {
            return users.find(u => u.username === username)
        } else {
            throw 'Not implemented yet for non fake persistent data'
        }
    }
}
module.exports = userDao