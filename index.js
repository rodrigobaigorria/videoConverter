const express = require("express");

const hbjs = require('handbrake-js');
const path = require('path');


const bodyParser = require("body-parser");

const fs = require("fs");

const fileUpload = require("express-fileupload");

const app = express();

const PORT = process.env.PORT || 5005

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

//support parsing of application/x-www-form-urlencoded post data

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);


app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.post("/convert", (req, res) => {
  //res.contentType(`video/${to}`);
  //res.attachment(`output.${to}`

  let to = req.body.to;
  let file = req.files.file;
  let dat = path.parse(file.name);
  let fileName = `${dat.name}.${to}`;

  file.mv("tmp/" + file.name, function (err) {
    if (err) return res.sendStatus(500).send(err);
    console.log("File Uploaded successfully");
  });

  hbjs.spawn({ input: `tmp/${file.name}`, output: `${fileName}` })
    .on('error', err => {
      console.log("an error happened: " + err.message);
      fs.unlink("tmp/" + file.name, function (err) {
        if (err) throw err;
        console.log("File deleted");
      });    })
    .on('progress', progress => {
      console.log(progress.percentComplete);
      console.log(
        'Percent complete: %s: %s',
        progress.percentComplete,
        progress.eta
      )
    })
   .on("end", function (stdout, stderr) {
      console.log("Finished");
      res.download(fileName, function (err) {
        if (err) throw err;

        fs.unlink(fileName, function (err) {
          if (err) throw err;
          console.log("File deleted");
        });
      });
      fs.unlink("tmp/" + file.name, function (err) {
        if (err) throw err;
        console.log("File deleted");
      });
    })
  //.pipe(res, { end: true });
});

app.listen(PORT);
