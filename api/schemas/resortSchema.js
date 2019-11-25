module.exports = function() {
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

let resortSchema = new Schema({
    name: { type: String, required: true },
    alias: { type: String, unique: true, required: true },
    location: String,
    lat: Number,
    lng: Number,
    vertical_rise: String,
    base_elevation: String,
    base_elevation: String,
    summit_elevation: String,
    annual_snowfall: String,
    number_of_trails: Number,
    skiable_acres: Number,
    longest_run: String,
    snowmaking: Schema.Types.Mixed,
    website: { type: String, unique: true },

    tickets: Object,

    lifts: {
        total: Number,
        gondolas_trams: Number,
        high_speed_six: Number,
        high_speed_quad: Number,
        quad: Number,
        triple: Number,
        double: Number,
        surface_lifts: Number,
        lift_capacity: String,
    },
    skiCentral: Object,
    skimap: Object,
    wikipedia: Object
})

const RESORT = mongoose.model("Resort", resortSchema)
return RESORT;
}