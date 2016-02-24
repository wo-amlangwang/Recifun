var mongoose = require('mongoose');

var stepSchema = mongoose.Schema({
	
	order: Number,
	stepContent: String,
	picture: String,
	video: String
	
});

module.exports = mongoose.model('Step', stepSchema);
