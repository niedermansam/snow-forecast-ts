module.exports = () => {
    const mongoose = require('mongoose'); 


    const skiMapSchema = new mongoose.Schema({
        id: { type: String, unique: true },
        name: String,
        lift_count: Number,
        official_website: String,
        owner: String,
        terrain_park: String,
        night_skiing: String,
        operating_status: String,
        latitude: Number,
        longitude: Number,
        top_elevation: Number,
        bottom_elevation: Number,
        lift_count: Number,
        run_count: Number,
        maps: [Object],
        tags: [mongoose.Schema.Types.Mixed],
        ski_maps:
            [Object],
        open_ski_maps: [mongoose.Schema.Types.Mixed],
        created: String,
        regions: [Object]
    });

    const SKIMAP = new mongoose.model('SkiMap', skiMapSchema);

    return SKIMAP;
}