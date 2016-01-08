var config = {
  port: process.env.PORT || 3000
}
var Excel = require("exceljs");
var express = require('express');
var fs = require('fs');
var getPixels = require('get-pixels');
var multer = require('multer');
var path = require('path');
var uuid = require('uuid');
// var storage = multer.memoryStorage();
// var storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/')
//   },
//   filename: function (req, file, cb) {
//     cb(null, uuid.v4() + '.jpg')
//   }
// })
var upload = multer({
  limits: {
    fileSize: 512000
  },
  fileFilter: fileFilter,
  dest: 'uploads/'
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
  imageToExcel(file.path, function(filename) {
    console.log(filename);
    // res.sendFile(path.join(__dirname, filename))
    res.send(filename);
  });
  // res.sendStatus(200);
});

app.use(express.static('public'));

var server = app.listen(config.port, function () {
  console.log('listening on port', config.port);
});

function imageToExcel(path, cb) {
  getPixels(path, 'image/jpeg', function(err,pixels) {
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
        image[3*y].push(pixels.data[(y*width*channels)+(x*channels)]);
        image[(3*y)+1].push(pixels.data[((y*width*channels)+(x*channels))+1]);
        image[(3*y)+2].push(pixels.data[((y*width*channels)+(x*channels))+2]);
      }
    }
    var workbook = new Excel.Workbook();
    var sheet = workbook.addWorksheet("My Sheet");
    for (var y = 0; y < image.length; y++) {
      for (var x = 0; x < image[0].length; x++) {
        sheet.getCell(getCellRef(x,y)).value = image[y][x];
        var fill = getFillColour(image[y][x], y);
        sheet.getCell(getCellRef(x,y)).fill = {
          type: "pattern",
          pattern:"solid",
          fgColor:{argb:fill},
          bgColor:{argb:fill}
        }
      }
    }
    var id=uuid.v4();
    fs.mkdirSync('./public/excel/'+id+'/');
    var filename = './public/excel/'+id+'/excelyourself.xlsx';
    workbook.xlsx.writeFile(filename)
    .then(function() {
        cb(id);
    });
  })
}

function getFillColour(value, row) {
  var hex = value.toString(16).toUpperCase();
  if (hex.length === 1) hex = '0' + hex;
  if (row%3 == 0) {
    return 'FF'+hex+'0000';
  } else if (row%3 == 1) {
    return 'FF00'+hex+'00';
  } else {
    return 'FF0000'+hex;
  }
}

function getCellRef(col, row) {
  var letters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
  var letter = '';
  if (col >= 26) letter = letters[Math.floor(col/26)-1];
  letter += letters[col%26];
  return letter + (row+1);
}
