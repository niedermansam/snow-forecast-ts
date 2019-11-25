module.exports = (app) => {
    const mongoose = require('mongoose')
    const URI = require('./../setup/mongoString')('resorts');
    mongoose.connect(URI, { useNewUrlParser: true, useUnifiedTopology: true });
    mongoose.set('useCreateIndex', true);

    const SKIMAP = require('./schemas/skiMapSchema.js')()

    app.get('/api/maps', (req, res) => {
        console.log(URI)
        SKIMAP.find({}, '-_id, -__v',(err, data) => {
            if(err) console.log(err);
            res.json(data)
        });

    })

    app.get('/api/maps/random', (req, res) => {

        SKIMAP.estimatedDocumentCount().exec(function (err, count) {

            // Get a random entry
            console.log(count)
            var random = Math.floor(Math.random() * count)

            // Again query all users but only fetch one offset by our random #
            SKIMAP.findOne().skip(random).select('name latitude longitude maps official_website').exec(
                function (err, data) {
                    // Tada! random user
                    let { name, latitude, longitude, maps, official_website} = data;
                    console.log(data)
                    res.json({
                        name: name,
                        lat: latitude,
                        lng: longitude,
                        site: official_website,
                        maps: maps
                    })
                })
        })
    })

}