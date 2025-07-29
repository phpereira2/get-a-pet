const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const User = require('../models/User')
const createUserToken = require('../helpers/create-user-token')
const getToken = require('../helpers/get-token')
const getUserByToken = require('../helpers/get-user-by-token')

module.exports = class UserController {
  static async register(req, res) {
    const { name, email, phone, password, confirmpassword } = req.body

    if (!name) {
      return res.status(422).json({ message: 'O campo nome é obrigatório' })
    }

    if (!email) {
      return res.status(422).json({ message: 'O campo e-mail é obrigatório' })
    }

    if (!phone) {
      return res.status(422).json({ message: 'O campo telefone é obrigatório' })
    }

    if (!password) {
      return res.status(422).json({ message: 'O campo senha é obrigatório' })
    }

    if (!confirmpassword) {
      return res.status(422).json({ message: 'O campo confirmação de senha é obrigatório' })
    }

    if (password !== confirmpassword) {
      return res.status(422).json({ message: 'Os campos senha e confirmação de senha precisam ser iguais' })
    }

    const userExists = await User.findOne({ email })

    if (userExists) {
      return res.status(422).json({ message: 'Este usuário já se encontra registrado' })
    }

    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(password, salt)

    const user = new User({
      name,
      email,
      phone,
      password: passwordHash
    })

    try {
      const newUser = await user.save()

      await createUserToken(newUser, req, res)
    } catch (error) {
      return res.status(500).json({ message: error })
    }
  }

  static async login(req, res) {
    const { email, password } = req.body

    if (!email) {
      return res.status(422).json({ message: 'O campo e-mail é obrigatório' })
    }

    if (!password) {
      return res.status(422).json({ message: 'O campo senha é obrigatório' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' })
    }

    const checkPassword = await bcrypt.compare(password, user.password)
    if (!checkPassword) {
      return res.status(401).json({ message: 'Senha inválida' })
    }

    await createUserToken(user, req, res)
  }

  static async checkUser(req, res) {
    let currentUser

    if (req.headers.authorization) {
      const token = getToken(req)
      const verified = jwt.verify(token, 'my_secret')

      currentUser = await User.findById(verified.id).select('-password')
    } else {
      currentUser = null
    }

    return res.status(200).json({ currentUser })
  }

  static async getUserById(req, res) {
    const id = req.params.id

    const user = await User.findById(id).select('-password')

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' })
    }

    return res.status(200).json({ user })
  }

  static async editUser(req, res) {
    const { name, email, phone, password, confirmpassword } = req.body

    const token = getToken(req)
    const user = await getUserByToken(token)

    if (req.file) {
      user.image = req.file.filename
    }

    if (!user) {
      return res.status(400).json({ message: 'Acesso negado' })
    }

    if (!name) {
      return res.status(422).json({ message: 'O campo nome é obrigatório' })
    }

    user.name = name

    if (!email) {
      return res.status(422).json({ message: 'O campo e-mail é obrigatório' })
    }

    const userExists = await User.findOne({ email })
    if (user.email !== email && userExists) {
      return res.status(422).json({ message: 'E-mail inválido ou já em uso' })
    }

    user.email = email

    if (!phone) {
      return res.status(422).json({ message: 'O campo telefone é obrigatório' })
    }

    user.phone = phone

    if (password !== confirmpassword) {
      return res.status(422).json({ message: 'Os campos senha e confirmação de senha precisam ser iguais' })
    } else if (user.password !== password && password != null) {
      const salt = await bcrypt.genSalt(12)
      const passwordHash = await bcrypt.hash(password, salt)
      
      user.password = passwordHash
    }

    try {
      await User.findOneAndUpdate({ _id: user.id }, { $set: user }, { new: true })

      return res.status(200).json({ message: 'Usuário atualizado com sucesso' })
    } catch (error) {
      return res.status(500).json({ message: error })
    }
  }
}