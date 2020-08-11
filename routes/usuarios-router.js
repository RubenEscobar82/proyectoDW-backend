var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var usuario = require('../models/usuarios');
var jwt =  require('jsonwebtoken');
const usuarios = require('../models/usuarios');

router.post('/signupemail', (req, res)=>{
    usuarios.find({email: req.body.email})
    .then(coincidence =>{
        if(coincidence.length==0){
            res.send({
                ok:1
            });
            res.end();
        }
        else{
            res.send({
                ok:0,
                error: 'Este correo ya está registrado'
            });
            res.end();
        }
    });
});
router.post('/', (req, res) => {
    usuario.find({email: req.body.email}).then(coincidence => {
        if(coincidence.length==0){
            bcrypt.hash(req.body.password, 10, (err, hash) => {
                let nuevoUsuario = new usuario({
                    username: req.body.userName,
                    email: req.body.email,
                    password: hash,
                    carpetas: req.body.carpetas,
                    fijados: req.body.fijados,
                    papelera: req.body.papelera,
                    tarjeta: req.body.tarjeta,
                    pro: req.body.pro
                });
                console.log(nuevoUsuario);
                nuevoUsuario.save().then(result => {
                    usuarios.find({_id: result._id}).then(visagejsUser =>{
                        //let visageUserToken = jwt.sign(visagejsUser[0].toJSON(),'secret');
                        let visageUserToken = jwt.sign({id: visagejsUser[0]._id},'secret');
                        res.cookie('visagejsUserToken', visageUserToken, { maxAge:  48* 60 * 60 * 1000,
                            // You can't access these tokens in the client's javascript
                              httpOnly: false
                             });
                        res.send({
                            ok: 1
                        });
                        res.end();
                    }).catch(error => {
                        res.send({
                            ok: 0,
                            error: 'userTokenError',
                            detail: error
                        });
                        res.end();
                    });
                }).catch(error => {
                    res.send({
                        ok: 0,
                        error: 'saveError'
                    });
                    res.end();
                });        
            });
        }
        else{
            res.send({
                ok:0,
                error:'emailError'
            });
            res.end();
        }
    }).catch(error => {
        res.send({
            ok: 0,
            error: 'connectError'
        });
    });
});
router.post('/signin', (req, res) => {
    usuario.find({email: req.body.email})
    .then(coincidence =>{
        if(coincidence.length==1){    
            if(bcrypt.compareSync(req.body.password, coincidence[0].password)){
                //let visageUserToken = jwt.sign(coincidence[0].toJSON(),'secret');
                let visageUserToken = jwt.sign({id: coincidence[0]._id},'secret');
                res.cookie('visagejsUserToken', visageUserToken, { maxAge:  48* 60 * 60 * 1000, httpOnly: false});
                res.send({
                    ok:1
                });
                res.end();
            }
            else{
                res.send({
                    ok:0,
                    error: 'passwordError'
                });
                res.end();
            }
        }
        else{
            res.send({
                ok:0,
                error:'emailError'
            });
        }
    });
});
router.get('/', (req, res)=>{
    usuario.find().then(result =>{
        if(result.length>0){
            res.send(result);
            res.end();
        }
        else{
            res.send("No hay usuarios registrados");
            res.end();
        }
    }).catch(error => {
        res.send("**Se produjo un error al realizar la consulta");
        res.end();
    })    
});

module.exports = router;