const mongoose = require('mongoose');

const msgSchema = mongoose.Schema({
    filepicture:String,
    msg: String,
    sender: String,/* username */
    receiver: String,/* username */
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('msg', msgSchema)