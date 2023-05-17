const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
    myItem: {type: Schema.Types.ObjectId, ref:'Trade', required: [true]},
    theirItem: {type: Schema.Types.ObjectId, ref:'Trade', required: [true]},
    status: { type: String, required: [true]},
    createdBy : {type: Schema.Types.ObjectId, ref:'User'},
}
);


//collection name is stories in the database
module.exports = mongoose.model('Transaction', transactionSchema);