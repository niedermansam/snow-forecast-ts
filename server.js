


const snotel = require('./api/snotel')
const express = require('express');
const app = express();

const http = require('http');
const https = require('https');
const fs = require('fs')


const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static('dist', { dotfiles: 'allow' }));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/dist/index.html');
});

snotel(app);


http.createServer(app).listen(80)

/*
 https.createServer({
        key: fs.readFileSync('/etc/letsencrypt/live/snowfinder.site/privkey.pem'),
        cert: fs.readFileSync('/etc/letsencrypt/live/snowfinder.site/fullchain.pem')
    }, app).listen(443)
*/