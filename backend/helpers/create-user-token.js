const jwt = require('jsonwebtoken')

const createUserToken = async(user, req, res) => {
  const token = jwt.sign({
    name: user.name,
    id: user._id
  }, 'my_secret')

  return res.status(200).json({
    message: 'Usuário autenticado',
    token: token,
    userId: user._id
  })
}

module.exports = createUserToken