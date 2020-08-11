var express = require('express');
var app = express();
var cors = require('cors');
var bodyParser = require('body-parser');
var database = require('./modules/database');
var usuariosRouter = require('./routes/usuarios-router');
var carpetasRouter = require('./routes/carpetas-router');
var proyectosRouter = require('./routes/proyectos-router');
var snippetsRouter = require('./routes/snippets-router');
var deletedRouter = require('./routes/deleted-router');
var cookieParser = require('cookie-parser');
const port = '8888';

//Middlewares:
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(cors({ origin:['http://localhost:4200'] ,credentials: true}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
//Fin-Middlewares

//Rutas
app.use('/usuarios', usuariosRouter);
app.use('/carpetas', carpetasRouter);
app.use('/proyectos', proyectosRouter);
app.use('/snippets', snippetsRouter);
app.use('/deleted', deletedRouter);
//Fin-Rutas

//Servidor
app.listen(port, function(){
    console.log(`Servidor levantado en ${port}`);
});
//Fin-Servidor