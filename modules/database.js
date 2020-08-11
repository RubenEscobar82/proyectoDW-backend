var mongoose = require('mongoose');

let db = "visagejs";
let port = "27017";
let host = "localhost";

class Database{
    constructor(){
        this.conectar();
    }
    conectar(){
        mongoose.connect(`mongodb://${host}:${port}/${db}`)
        .then(result => {
            console.log('Conexión a MongoDB establecida');
        })
        .catch(error => {
            console.log(`***Error al conectar con MondoDB: `);
        });
    }
}
module.exports = new Database();