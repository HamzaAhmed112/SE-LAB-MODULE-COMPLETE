const express = require('express')
const router = express.Router()

//controller  functions
const {
    index,
    login
} = require("../controllers/emergency")


//routes 
router.route('/').get(index)
router.route('/login').get(login)

module.exports= router