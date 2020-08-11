var mongoose = require('mongoose');

var esquema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    carpetas: Array,
    fiajados: Array,
    papelera: Array,
    tarjeta: mongoose.SchemaTypes.Mixed,
    pro: Boolean 
});

module.exports = mongoose.model('usuarios', esquema);