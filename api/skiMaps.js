module.exports = (app) => {
    const mongoose = require('mongoose')
    const axios = require('axios')
    const URI = require('./../setup/mongoString')('resorts');
    mongoose.connect(URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
    mongoose.set('useCreateIndex', true);

    const bodyParser = require('body-parser');
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());


    const SKIMAP = require('./schemas/skiMapSchema.js')()

    app.get('/api/maps', (req, res) => {
        console.log('getting all maps...')
        SKIMAP.find({}, '-_id, -__v',(err, data) => {
            if(err) console.log(err);
            res.json(data)
        });

    })

    app.get('/api/maps/random', (req, res) => {

        SKIMAP.find({ num_maps: { $gte: 2 } }).countDocuments().exec(function (err, count) {

            // Get a random entry
            console.log(count)
            var random = Math.floor(Math.random() * count)

            // Again query all users but only fetch one offset by our random #
            SKIMAP.findOne({num_maps: { $gte: 2}}).skip(random).exec(
                function (err, data) {
                    if(err) return console.log(err)
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
    
    app.post('/api/maps/vote', (req, res) => {
        console.log('voting')
        console.log(req.body)
        let { resortId, mapId } = req.body;
        console.log(resortId)
        SKIMAP.find({id: resortId}).exec((err, resort) => {
            if (err) res.json({
                'error': 'There was an error finding the resort, please try again.',
                resort_id: resortId,
                map_id: mapId
            })
            let selectedMap // = resort.maps.filter(map => map.map_id === mapId);
            console.log(resort[0])

            let newMaps = resort[0].maps.map(x => {
                if(x.map_id === mapId){
                    selectedMap = x;
                    x.votes = x.votes ? x.votes + 1 : 1;
                }
                return x;
            })

            let totalVotes = resort[0].votes ? resort[0].votes + 1 : 1;

            SKIMAP.findOneAndUpdate({ id: resortId }, { maps: newMaps, display_map: selectedMap, votes: totalVotes }, (err, resp) => {
                if(err) return res.json({
                    'error': 'There was an error casting your vote, please try again.',
                    resort_id: resortId,
                    map_id: mapId
                })
                res.json({
                    'message': 'SUCCESS',
                    resort_id: resortId,
                    map_id: mapId
                })
            })

        })
    })

    app.get('/test', async (req, res) => {
        // axios.post('/api/maps/vote', { resortId: "6", mapId: "14347"})
        res.json({"message": "Move along, nothing to see here..."})
    })
}