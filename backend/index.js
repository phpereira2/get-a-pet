const express = require('express')
const cors = require('cors')
const app = express()

const conn = require('./db/conn')
const usersRoutes = require('./routes/usersRoutes')
const petsRoutes = require('./routes/petsRoutes')

app.use(express.json())

app.use(cors({ credentials: true, origin: 'http://localhost:5173' }))

app.use(express.static('public'))

app.use('/users', usersRoutes)
app.use('/pets', petsRoutes)

app.listen(3000)