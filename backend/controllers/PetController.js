const ObjectId = require('mongoose').Types.ObjectId

const Pet = require('../models/Pet')

const getToken = require('../helpers/get-token')
const getUserByToken = require('../helpers/get-user-by-token')

module.exports = class PetController {
  static async create(req, res) {
    const { name, age, weight, color } = req.body
    const images = req.files
    const available = true

    if (!name) {
      return res.status(422).json({ message: 'O campo nome é obrigatório' })
    }

    if (!age) {
      return res.status(422).json({ message: 'O campo idade é obrigatório' })
    }

    if (!weight) {
      return res.status(422).json({ message: 'O campo peso é obrigatório' })
    }

    if (!color) {
      return res.status(422).json({ message: 'O campo cor é obrigatório' })
    }

    if (images.length === 0) {
      return res.status(422).json({ message: 'O campo imagens é obrigatório' })
    }

    const token = getToken(req)
    const user = await getUserByToken(token)

    const pet = new Pet({
      name,
      age,
      weight,
      color,
      available,
      images: [],
      user: {
        _id: user._id,
        name: user.name,
        image: user.image,
        phone: user.phone
      }
    })

    images.map((image) => {
      pet.images.push(image.filename)
    })

    try {
      const newPet = await pet.save()
      return res.status(201).json({
        message: 'Pet cadastrado com sucesso!',
        newPet
      })
    } catch (error) {
      return res.status(500).json({ message: error })
    }
  }

  static async getAll(req, res) {
    const pets = await Pet.find().sort('-createdAt')

    return res.status(200).json({
      pets: pets
    })
  }

  static async getAllUserPets(req, res) {
    const token = getToken(req)
    const user = await getUserByToken(token)

    const pets = await Pet.find({ 'user._id': user._id }).sort('-createdAt')

    return res.status(200).json({ pets: pets })
  }

  static async getAllUserAdoptions(req, res) {
    const token = getToken(req)
    const user = await getUserByToken(token)

    const pets = await Pet.find({ 'adopter._id': user._id }).sort('-createdAt')

    return res.status(200).json({ pets: pets })
  }

  static async getPetById(req, res) {
    const id = req.params.id

    if (!ObjectId.isValid(id)) {
      return res.status(422).json({ message: 'ID inválido' })
    }

    const pet = await Pet.findOne({ _id: id })

    if (!pet) {
      return res.status(404).json({ message: 'Pet não encontrado!' })
    }

    return res.status(200).json({ pet: pet })
  }

  static async removePetById(req, res) {
    const id = req.params.id

    if (!ObjectId.isValid(id)) {
      return res.status(422).json({ message: 'ID inválido' })
    }

    const pet = await Pet.findOne({ _id: id })

    if (!pet) {
      return res.status(404).json({ message: 'Pet não encontrado!' })
    }

    const token = getToken(req)
    const user = await getUserByToken(token)

    if (pet.user._id.toString() !== user._id.toString()) {
      return res.status(422).json({ message: 'Houve um problema ao processar a sua solicitação, por favor tente mais tarde!' })
    }

    await Pet.findByIdAndDelete(id)

    return res.status(200).json({ message: 'Pet removido com sucesso!' })
  }

  static async updatePet(req, res) {
    const id = req.params.id

    if (!ObjectId.isValid(id)) {
      return res.status(422).json({ message: 'ID inválido' })
    }

    const pet = await Pet.findOne({ _id: id })

    if (!pet) {
      return res.status(404).json({ message: 'Pet não encontrado!' })
    }

    const token = getToken(req)
    const user = await getUserByToken(token)

    if (pet.user._id.toString() !== user._id.toString()) {
      return res.status(422).json({ message: 'Houve um problema ao processar a sua solicitação, por favor tente mais tarde!' })
    }

    const { name, age, weight, color, available } = req.body
    const images = req.files
    const updatedData = {}

    if (!name) {
      return res.status(422).json({ message: 'O campo nome é obrigatório' })
    } else {
      updatedData.name = name
    }

    if (!age) {
      return res.status(422).json({ message: 'O campo idade é obrigatório' })
    } else {
      updatedData.age = age
    }

    if (!weight) {
      return res.status(422).json({ message: 'O campo peso é obrigatório' })
    } else {
      updatedData.weight = weight
    }

    if (!color) {
      return res.status(422).json({ message: 'O campo cor é obrigatório' })
    } else {
      updatedData.color = color
    }

    if (images.length === 0) {
      return res.status(422).json({ message: 'O campo imagens é obrigatório' })
    } else {
      updatedData.images = []
      images.map((image) => {
        updatedData.images.push(image.filename)
      })
    }

    await Pet.findByIdAndUpdate(id, updatedData)

    return res.status(200).json({ message: 'Pet atualizado com sucesso' })
  }

  static async schedule(req, res) {
    const id = req.params.id

    if (!ObjectId.isValid(id)) {
      return res.status(422).json({ message: 'ID inválido' })
    }

    const pet = await Pet.findOne({ _id: id })

    if (!pet) {
      return res.status(404).json({ message: 'Pet não encontrado!' })
    }

    const token = getToken(req)
    const user = await getUserByToken(token)

    if (pet.user._id.equals(user._id)) {
      return res.status(422).json({ message: 'Você não pode agendar uma visita com o seu próprio Pet!' })
    }

    if (pet.adopter) {
      if (pet.adopter._id.equals(user._id)) {
        return res.status(422).json({ message: 'Você já agendou uma visita para este Pet!' })
      }
    }

    pet.adopter = {
      _id: user._id,
      name: user.name,
      image: user.image
    }

    await Pet.findByIdAndUpdate(id, pet)

    return res.status(200).json({ message: `A visita foi agendada com sucesso, entre em contato com ${pet.user.name} pelo telefone ${pet.user.phone}` })
  }

  static async concludeAdoption(req, res) {
    const id = req.params.id

    if (!ObjectId.isValid(id)) {
      return res.status(422).json({ message: 'ID inválido' })
    }

    const pet = await Pet.findOne({ _id: id })

    if (!pet) {
      return res.status(404).json({ message: 'Pet não encontrado!' })
    }

    const token = getToken(req)
    const user = await getUserByToken(token)

    if (pet.user._id.toString() !== user._id.toString()) {
      return res.status(422).json({ message: 'Houve um problema ao processar a sua solicitação, por favor tente mais tarde!' })
    }

    pet.available = false

    await Pet.findByIdAndUpdate(id, pet)

    return res.status(200).json({ message: 'Parabéns, o ciclo de adoção foi finalizado com sucesso!' })
  }
}