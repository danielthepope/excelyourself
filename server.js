var config = {
  port: process.env.PORT || 3000
}
var excellent = require('excellent');
var express = require('express');
var fs = require('fs');
var getPixels = require('get-pixels');
var multer = require('multer');
var path = require('path');
var uuid = require('uuid');
// var storage = multer.memoryStorage();
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    cb(null, uuid.v4() + '.jpg')
  }
})
var upload = multer({
  limits: {
    fileSize: 512000
  },
  fileFilter: fileFilter,
  storage: storage
});
var supportedUploadTypes = ['image/jpeg'];

function fileFilter(req, file, cb) {
  console.log(file.mimetype);
  cb(null, supportedUploadTypes.indexOf(file.mimetype) > -1);
}

var app = express();

app.post('/toexcel', upload.single('webcam'), function (req, res) {
  var file = req.file;
  console.log(file.path);
  imageToExcel(file.path);
  res.sendStatus(200);
});

app.use(express.static('public'));

var server = app.listen(config.port, function () {
  console.log('listening on port', config.port);
});

function imageToExcel(path) {
  getPixels(path, function(err,pixels) {
    if (err) throw err;
    var width = pixels.shape[0];
    var height = pixels.shape[1];
    var channels = pixels.shape[2];
    var image = [];
    for (var y = 0; y < height; y++) {
      image.push([]);
      image.push([]);
      image.push([]);
      for (var x = 0; x < width; x++) {
        image[3*y].push(pixels.data[(y*x)+(x*channels)]);
        image[(3*y)+1].push(pixels.data[((y*x)+(x*channels))+1]);
        image[(3*y)+2].push(pixels.data[((y*x)+(x*channels))+2]);
      }
    }
    console.log('excellent...');
    var excellentRows = image.map(function(imageRow, rowNum) {
            return {cells: imageRow.map(function(cell) {
              return {value: cell
              , style: getFillColour(cell, rowNum)
              }
            })};
          });
    var colours255 = [];
    for (var x = 0; x < 255; x++) {
      var hex = x.toString(16);
      colours255.push('0'+hex);
      colours255.push('1'+hex);
      colours255.push('2'+hex);
    }
    var excellentStyles = colours255.map(function(colour) {
      var colourType = colour[0];
      var hex = colour.slice(1);
      var colourHex = '';
      if (colourType === 0) colourHex = ('FF'+hex+'0000').toUpperCase();
      else if (colourType === 0) colourHex = ('FF00'+hex+'00').toUpperCase();
      else colourHex = ('FF0000'+hex).toUpperCase();
      return {label:'C'+colour, fill: {rgb: colourHex}}
    });
    var doc = excellent.create({
      // sheets: {
      //   'sheet1': {
      //     rows: image
      //   }
      // }
      sheets: {
        'Summary': {
          rows: excellentRows,
          
            // rows: [{
            //     cells: [
            //         'foo',
            //         {value: 'bar', style: 'bold'},
            //         {value: 'foo', style: 'lemonBg'},
            //         'baz',
            //         {value: 'quux', style: 'lemonBgBold'}
            //     ]
            // }, {
            //     cells: ['', {value: 'WAT?!', style: 'brick'}, {value: 'dotty', style: 'dotty'}]
            // }]
          }
      },
      styles: {cellStyles: excellentStyles}
    });
    fs.writeFileSync('uploads/test.xlsx', doc.file);
  })
}

function getFillColour(value, row) {
  var hex = value.toString(16).toUpperCase();
  return 'C'+ row%3 + hex;
}
