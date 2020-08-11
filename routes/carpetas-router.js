var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var usuario = require('../models/usuarios');
var jwt =  require('jsonwebtoken');
var mongoose = require('mongoose');
const usuarios = require('../models/usuarios');

router.get('/', function(req, res){
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
                        res.send({
                            ok:1,
                            userName: userData[0].username,
                            carpetas: userData[0].carpetas
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
router.post('/', (req, res)=>{
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
                        let folderId = new mongoose.mongo.ObjectId();
                        let createdAt = new Date();
                        let folders = userData[0].carpetas;
                        let newFolder = {
                            _id: folderId,
                            _id_string: folderId.toString(),
                            name: req.body.folderName,
                            content: [],
                            createdAt: createdAt.toLocaleString(),
                            updatedAt: createdAt.toLocaleString()
                        }
                        folders.push(newFolder);
                        usuarios.update({'_id': decoded.id}, {'$set': {
                            'carpetas': folders}}, function(err) {});
                        res.send({
                            ok:1
                        });
                        res.end();
                    }
                })
                .catch(error =>{
                    res.send({
                        ok:0,
                        error: "DB error"
                    });
                    res.end();
                });
            }
        });
    }
    else{
        res.send({
            ok: 0,
            error: "tokenError"
        });
        res.end();
    }
});
router.delete('/:folderId', (req, res)=>{
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
                //5f29fb7145e3932a30ba5401
                //5f29fb7145e3932a30ba5401
                usuarios.find({_id: decoded.id})
                .then(userData =>{
                    if (userData.length==1){
                        console.log("id: ");
                        console.log(req.params.folderId);
                        usuarios.updateOne({'_id': decoded.id}, {$pull : {
                            'carpetas': {_id: mongoose.mongo.ObjectID(req.params['folderId'])}}}, function(err, val) {
                                console.log("No se pudo borrar;");
                                console.log(val);
                            });
                        res.send({
                            ok:1
                        });
                        res.end();
                    }
                })
                .catch(error =>{
                    res.send({
                        ok:0,
                        error: "DB error"
                    });
                    res.end();
                });
            }
        });
    }
    else{
        res.send({
            ok: 0,
            error: "tokenError"
        });
        res.end();
    }
});
router.put('/', (req, res)=>{
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
                        let updatedAt = new Date();
                        usuarios.updateOne(
                            {
                                "carpetas._id": mongoose.mongo.ObjectID(req.body['folderId'])
                            },
                            {
                                "$set": { 
                                    "carpetas.$.name": req.body['folderName'],
                                    "carpetas.$.updatedAt": updatedAt.toLocaleString()
                                }
                            }, function(err, val) {}
                        );
                        res.send({
                            ok:1
                        });
                        res.end();
                    }
                })
                .catch(error =>{
                    res.send({
                        ok:0,
                        error: "DB error"
                    });
                    res.end();
                });
            }
        });
    }
    else{
        res.send({
            ok: 0,
            error: "tokenError"
        });
        res.end();
    }
});
module.exports = router;