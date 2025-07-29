const mongoose = require('mongoose')

async function main() {
  await mongoose.connect('mongodb://localhost:27017/get-a-pet')
  console.log('Conexão com o banco de dados realizada com sucesso')
}

main().catch((error) => console.log(error))

module.exports = mongoose