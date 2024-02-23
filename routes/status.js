var mongoose = require('mongoose');

 


var statusSchema = mongoose.Schema({
 userid : {type:mongoose.Schema.Types.ObjectId,ref:"user"},
 img:String,
  createdAt: {
    type: Date,
    default: Date.now
  }
})



module.exports = mongoose.model("status",statusSchema)