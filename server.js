'use strict'
const port = process.env.PORT || 8080

// Firebase Settings
const admin = require('firebase-admin')
const serviceAccount = require('./serviceAccountKey.json')
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const database = admin.firestore()
const bucket = admin.storage().bucket('gs://rhinocytology.appspot.com')

const Slide = database.collection('Slides')

// Express Settings
const express = require('express')
const cors = require('cors')
const path = require('path')

const app = express()
app.use(express.json())
app.use(cors())
app.use(express.static(__dirname + '/dist/rhinocyt'))

// Multer Settings
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

// POST: Upload Slide API
app.post('/api/slides/upload', upload.single('image'), async (req, res) => {
  try {
    const image = req.file
    const destination = 'slides/' + image.filename
    await bucket.upload(image.path, { destination: destination })
    await unlinkAsync(image.path)
    await Slide.add({ image: destination, date: new Date() })
    res.status(200).send({ msg: 'Uploaded' })
  } catch(error) {
    console.log('Upload Slide API: ' + error.message)
    res.status(400).send({ msg: 'Error' })
  }
})

// DELETE: Remove Slide API
app.delete('/api/slides/remove', async (req, res) => {
  try {
    const image = 'slides/' + req.query.id
    const slide = await Slide.where('image', '==', image).get()
    slide.docs.map((doc) => (Slide.doc(doc.id).delete()))
    await bucket.file(image).delete()
    res.status(200).send({ msg: 'Removed' })
  } catch (error) {
    console.log('Remove Slide API: ' + error.message)
    res.status(400).send({ msg: 'Error' })
  }
})

// App Settings
app.get('/*', function (req,res) {
  res.sendFile(path.join(__dirname + '/dist/rhinocyt/index.html'))
})

app.listen(port)
