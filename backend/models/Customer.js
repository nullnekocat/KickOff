const mongoose = require('mongoose');

const CustomerSchema = mongoose.Schema(
    {
        date:{
            type: Date,
            required: false
        },
        name:{
            type: String,
            required: true
        },
        email:{
            type: String,
            required: true
        },
        phone:{
            type: String,
            required: true
        },
    }
)

const Customer = mongoose.model('customers', CustomerSchema);

module.exports = Customer;