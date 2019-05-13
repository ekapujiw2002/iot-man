var mongoose = require('mongoose');

var deviceSchema = new mongoose.Schema({
    name: {type: String, required: true, max: 100},
    value: {type: Number, required: true},
    isDeleted : {type: Boolean},
    createTime : {type: Date},
    updateTime : {type: Date, default: Date.now}
});

var Device  = mongoose.model('Device', deviceSchema);

module.exports = Device;


// UserModel.find()                   // find all users
//          .skip(100)                // skip the first 100 items
//          .limit(10)                // limit to 10 items
//          .sort({firstName: 1}      // sort ascending by firstName
//          .select({firstName: true} // select firstName only
//          .exec()                   // execute the query
//          .then(docs => {
//             console.log(docs)
//           })
//          .catch(err => {
//             console.error(err)
//           })