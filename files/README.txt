This folder is necessary to upload and read files on Firebase.
Remember to allow CORS on Firebase: nano cors.json

[
  {
    "origin": ["*"],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]

Finally: gsutil cors set cors.json gs://[URL]
