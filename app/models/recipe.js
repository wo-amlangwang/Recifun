		
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var recipeSchema = mongoose.Schema({
	owner: {type: Schema.Types.ObjectId, ref: 'User'},
	recipeTitle: String,
	date: String,
	// steps: [{type: Schema.Types.ObjectId, ref: 'Step'}],
	steps: [{type: Schema.Types.ObjectId, ref: 'Step'}],
	// comments: [{type: Schema.Types.ObjectId, ref: 'Comment'}],
	comments: [{type: Schema.Types.ObjectId, ref: 'Comment'}],
	numLikes: Number
});

module.exports = mongoose.model('Recipe', recipeSchema);