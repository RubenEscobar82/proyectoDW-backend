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
                             res.cookie('userName', req.body.userName, { maxAge:  48* 60 * 60 * 1000,
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
                res.cookie('userName', coincidence[0].username, { maxAge:  48* 60 * 60 * 1000, httpOnly: false});
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
    if(req.cookies['visagejsUserToken']){
        jwt.verify(req.cookies['visagejsUserToken'], 'secret', async (err, decoded)=>{
            if(err){
                res.json({
                    ok:0,
                    error: 'tokenError'
                });
                res.end();
            }
            else{
                usuarios.find({_id: decoded.id})
                .then(userData =>{
                    if (userData.length==1){
                        let response = {
                            username: userData[0].username,
                            email: userData[0].email,
                            pro: userData[0].pro,
                            tarjeta: userData[0].tarjeta
                        }
                        res.send({
                            ok:1,
                            userData: response
                        });
                        res.end();
                    }
                    else{
                        res.send({
                            ok: 0,
                            error: 'idError'
                        });
                        res.end();
                    }
                }).catch(error =>{
                    res.send({
                        ok:0,
                        error: error
                    });
                    res.end();
                });
            }
        });
    }
});

router.put('/general_config', (req, res) => {
    if(req.cookies['visagejsUserToken']){
        jwt.verify(req.cookies['visagejsUserToken'], 'secret', async (err, decoded)=>{
            if(err){
                res.json({
                    ok:0,
                    error: 'tokenError'
                });
                res.end();
            }
            else{
                usuarios.find({_id: decoded.id})
                .then(userData =>{
                    if (userData.length==1){
                        usuarios.updateOne(
                            {_id: decoded.id},
                            {'$set': req.body.data},
                            function(err1, val1){
                                if(!err1){
                                    res.send({ok:1});
                                    res.end();
                                }
                                else{
                                    res.send({ok:0, error: err1});
                                    res.end();
                                }
                            }
                        );
                    }
                    else{
                        res.send({
                            ok: 0,
                            error: 'idError'
                        });
                        res.end();
                    }
                }).catch(error =>{
                    res.send({
                        ok:0,
                        error: error
                    });
                    res.end();
                });                
            }
        });
    }
});

router.put('/security_config', (req, res) => {
    if(req.cookies['visagejsUserToken']){
        jwt.verify(req.cookies['visagejsUserToken'], 'secret', async (err, decoded)=>{
            if(err){
                res.json({
                    ok:0,
                    error: 'tokenError'
                });
                res.end();
            }
            else{
                usuarios.find({_id: decoded.id})
                .then(userData =>{
                    if (userData.length==1){
                        if(bcrypt.compareSync(req.body.data.currentPassword, userData[0].password)){
                            bcrypt.hash(req.body.data.newPassword, 10, (err1, hash) => {
                                usuarios.updateOne(
                                    {_id: decoded.id},
                                    {'$set': {'password': hash}},
                                    function(err2, val2){
                                        if(!err2){
                                            res.send({ok:1});
                                            res.end();
                                        }
                                        else{
                                            res.send({ok:0, error: err2});
                                            res.end();
                                        }
                                    }
                                );
                            });
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
                            ok: 0,
                            error: 'idError'
                        });
                        res.end();
                    }
                }).catch(error =>{
                    res.send({
                        ok:0,
                        error: error
                    });
                    res.end();
                });                
            }
        });
    }
});

router.put('/plan_config', (req, res) => {
    if(req.cookies['visagejsUserToken']){
        jwt.verify(req.cookies['visagejsUserToken'], 'secret', async (err, decoded)=>{
            if(err){
                res.json({
                    ok:0,
                    error: 'tokenError'
                });
                res.end();
            }
            else{
                usuarios.find({_id: decoded.id})
                .then(userData =>{
                    if (userData.length==1){
                        let carpetas = [
                            {
                                name: "Elementos restaurados",
                                _id: "restored-elements",
                                content: []
                            }
                        ];
                        usuarios.updateOne(
                            {_id: decoded.id},
                            {'$set': {
                                'carpetas': carpetas,
                                'papelera': [],
                                'fiajados': [],
                                'pro': req.body.pro
                            }},
                            function(err1, val1){
                                if(!err1){
                                    res.send({ok:1});
                                    res.end();
                                }
                                else{
                                    res.send({ok:0, error: err1});
                                    res.end();
                                }
                            }
                        );
                    }
                    else{
                        res.send({
                            ok: 0,
                            error: 'idError'
                        });
                        res.end();
                    }
                }).catch(error =>{
                    res.send({
                        ok:0,
                        error: error
                    });
                    res.end();
                });                
            }
        });
    }
});

router.put('/card_config', (req, res) => {
    if(req.cookies['visagejsUserToken']){
        jwt.verify(req.cookies['visagejsUserToken'], 'secret', async (err, decoded)=>{
            if(err){
                res.json({
                    ok:0,
                    error: 'tokenError'
                });
                res.end();
            }
            else{
                usuarios.find({_id: decoded.id})
                .then(userData =>{
                    if (userData.length==1){
                        usuarios.updateOne(
                            {_id: decoded.id},
                            {'$set': {
                                'tarjeta': req.body.data
                            }},
                            function(err1, val1){
                                if(!err1){
                                    res.send({ok:1});
                                    res.end();
                                }
                                else{
                                    res.send({ok:0, error: err1});
                                    res.end();
                                }
                            }
                        );
                    }
                    else{
                        res.send({
                            ok: 0,
                            error: 'idError'
                        });
                        res.end();
                    }
                }).catch(error =>{
                    res.send({
                        ok:0,
                        error: error
                    });
                    res.end();
                });                
            }
        });
    }
});

router.delete('/', (req, res) => {
    if(req.cookies['visagejsUserToken']){
        jwt.verify(req.cookies['visagejsUserToken'], 'secret', async (err, decoded)=>{
            if(err){
                res.json({
                    ok:0,
                    error: 'tokenError'
                });
                res.end();
            }
            else{
                usuarios.find({_id: decoded.id})
                .then(userData =>{
                    if (userData.length==1){
                        usuarios.remove(
                            {_id: decoded.id},
                            function(err1){
                                if(!err1){
                                    res.send({ok:1});
                                    res.end();
                                }
                                else{
                                    res.send({ok:0, error: err1});
                                    res.end();
                                }
                            });
                    }
                    else{
                        res.send({
                            ok: 0,
                            error: 'idError'
                        });
                        res.end();
                    }
                }).catch(error =>{
                    res.send({
                        ok:0,
                        error: error
                    });
                    res.end();
                });                
            }
        });
    }
});

module.exports = router;