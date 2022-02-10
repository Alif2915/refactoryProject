const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
        uid: String,
        name: String,
        email: String
});

module.exports = mongoose.model('User', userSchema);