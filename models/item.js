const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tradeSchema = new Schema({
    name : {type: String, required: [true, 'name is required']},
    category : {type: String, required: [true, 'category is required']},
    createdBy : {type: Schema.Types.ObjectId, ref:'User'},
    manufacturer: {type: String, required: [true, 'manufacturer is required']},
    description: {type: String, required: [true, 'description is required'],
                  minLength: [10, 'the content should have atleast 10 characters'] },
    image: { type: String, required: [true, 'Image field is required'],
    validate: {
        validator: function(v) {
        return /^((http|https):\/\/)?[^\s/$.?#].[^\s]*$/.test(v);
        },
        message: 'Invalid URL'
    }
    },
    status: {type: String, required: [true]},
    isOffered: {type: Boolean}
},

{timestamps: true}
);

module.exports = mongoose.model('Trade', tradeSchema);