console.log('Node version: ' + process.version);

const express = require('express')
const app = express()
const fs = require("fs");
const path = require("path");

app.get('/', (req, res) => res.send('Hello World!'))

app.get('/video',(req, res) => {
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

app.listen(3000, () => console.log('Example app listening on port 3000!'))