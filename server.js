// print out node version
console.log('Node version: ' + process.version);

let visitedUsers = []

// read port from environment variable(for heroku since heroku sets its port in PORT environment variable) else use 3000 as default
const port = process.env.PORT || 3000;

// all imports
const express = require('express')
const app = express()
const fs = require("fs");
const path = require("path");

// health check handler
app.get('/', (req, res) => res.send('I am alive!'))

app.get('/video',(req, res) => {

    // x-forwarded-for header is to be used if the request is coming from a proxy such as nginx
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // if user has already visited return 
    if (visitedUsers.indexOf(ip) > -1) {
        res.send('You have already watched the video')
        return 
    } else{
        visitedUsers.push(ip)
        console.log("adding current users ip to visited user list")
    }

    // read file from current directory
    const videoFile = path.resolve(__dirname,"sample-video.mp4");
    let fileSize;

    //check if file exists if not return error
    fs.stat(videoFile, function(err, stats) {
        if (err) {
          if (err.code === 'ENOENT') {
            // 404 Error if file not found
            return res.sendStatus(404);
          }
        res.end(err);
        }
        fileSize = stats.size;
    });

    var range = req.headers.range;
    // if range header does not exist then return error
    if (!range) {
     // 416 Wrong range
     return res.sendStatus(416);
    }

    // compute requested range
    var positions = range.replace("/bytes=/", "").split("-");
    var start = parseInt(positions[0], 10);
    var total = fileSize;
    var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
    var chunksize = (end - start) + 1;

    //set respomse headers
    res.writeHead(206, {
        "Content-Range": "bytes " + start + "-" + end + "/" + total,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "video/mp4"
      });

      // write video content to response
      let stream = fs.createReadStream(videoFile, { start: start, end: end })
        .on("open", function() {
          stream.pipe(res);
        }).on("error", function(err) {
          res.end(err);
        });

});

//start listening for requests on given port
app.listen(port, () => console.log('Example app listening on port :',port))