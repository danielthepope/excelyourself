var config = {
  port: process.env.PORT || 3000
}
var express = require('express');
var multer = require('multer');
var path = require('path');
var storage = multer.memoryStorage();
var upload = multer({
  limits: {
    fileSize: 16000
  },
  fileFilter: fileFilter,
  storage: storage
});
var supportedUploadTypes = ['image/svg+xml', 'image/png'];

function fileFilter(req, file, cb) {
  console.log(file.mimetype);
  cb(null, supportedUploadTypes.indexOf(file.mimetype) > -1);
}

var app = express();
// app.get
app.use(express.static('public'));

var server = app.listen(config.port, function () {
  console.log('listening on port', config.port);
});
