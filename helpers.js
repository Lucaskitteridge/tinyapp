//helper function
const getUserByEmail = (email, database) => {
  const keys = Object.keys(database)
    for (const key of keys) {
      const user = database[key]
      if (user.email === email) {
        return key
      }
    }    
  }

  module.exports = { getUserByEmail }