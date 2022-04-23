'use strict'
const port = process.env.PORT || 8080

const admin = require('firebase-admin')
const serviceAccount = require('./serviceAccountKey.json')
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const database = admin.firestore()
const bucket = admin.storage().bucket('gs://rhinocytology.appspot.com')

const Slide = database.collection('Slides')

const express = require('express')
const cors = require('cors')
const path = require('path')

const app = express()
app.use(express.json())
app.use(cors())
app.use(express.static(__dirname + '/dist/rhinocyt'))

global.XMLHttpRequest = require('xhr2');
const fs = require('fs')
const { promisify } = require('util')
const unlinkAsync = promisify(fs.unlink)
const multer = require('multer')
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './files')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})
const upload = multer({ storage: storage })

app.post('/api/slides/create', upload.single('image'), async (req, res) => {
  try {
    const file = req.file
    const destination = 'slides/' + file.filename
    await bucket.upload(file.path, {destination: destination})
    await unlinkAsync(file.path)
    await Slide.add({ image: destination })
    res.status(200).send({ msg: 'Created' })
  } catch(error) {
    console.log(error.message)
    res.status(400).send({ msg: 'Error' })
  }
})

app.get('/*', function (req,res) {
  res.sendFile(path.join(__dirname + '/dist/angular-tour-of-heroes/index.html'))
})

app.listen(port)
