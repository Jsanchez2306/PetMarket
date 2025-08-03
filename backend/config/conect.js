
const mongoose = require('mongoose');

const URI ='mongodb+srv://andresbmx11:YqjHa9dITL2eSLEN@2873441.pjmsoid.mongodb.net/petmarket'

mongoose.connect(URI);

module.exports = mongoose;
