var express = require('express')

var app = express()
var port = 9998
app.listen(port, function() {
    console.log('start express server on: ' + port + ' port')
})

console.log(__dirname)
app.use(express.static('app'))
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/app/main.html')
})
