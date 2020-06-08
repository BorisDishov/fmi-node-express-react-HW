const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/"
const app = express();
const port = 3000;
const users = require('./router/user-router.js');

MongoClient.connect(url, {useUnifiedTopology: true}, function(err, con) {
    if (err) throw err;
    app.locals.db = con.db('cooking');
    console.log("Connection established!");
    app.listen(port, () => console.log(`The app is listening at http://localhost:${port}`));
  });

app.use(bodyParser.json({limit: '50mb'}));
app.use("/api/users", users);