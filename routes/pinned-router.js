var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var usuario = require('../models/usuarios');
var jwt =  require('jsonwebtoken');
var mongoose = require('mongoose');
const usuarios = require('../models/usuarios');

router.get('', (req, res)=>{
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
                        let pinnedProjects = userData[0].fiajados;
                        for(i=0; i<pinnedProjects.length; i++){
                            pinnedProjects[i].alreadyPinned = true;
                        }                                     
                        res.send({ok:1, pinnedProjects: pinnedProjects});
                        res.end();
                    }
                })
                .catch(error =>{
                    res.send({
                        ok:0,
                        error: error
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
                        let project = req.body.project;
                        project._id = new mongoose.mongo.ObjectId(project._id);
                        usuarios.updateOne({_id: mongoose.mongo.ObjectID(decoded.id)},
                                {"$push": {"fiajados": project}}, function(err, val) {
                                    if(!err){
                                        res.send({
                                            ok: 1
                                        });
                                        res.end();
                                    }
                                    else{
                                        res.send({
                                            ok: 0,
                                            error: 'saveError'
                                        });
                                        res.end();
                                }
                        });                                          
                    }
                })
                .catch(error =>{
                    res.send({
                        ok:0,
                        error: error
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

router.delete('/:projectId', (req, res)=>{
    console.log("*****Remover pin********");
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
                        usuarios.updateOne({_id: mongoose.mongo.ObjectID(decoded.id)},
                                {"$pull": {"fiajados": {_id: mongoose.mongo.ObjectId(req.params['projectId'])}}}, function(err, val) {
                                    if(!err){
                                        res.send({
                                            ok: 1
                                        });
                                        res.end();
                                    }
                                    else{
                                        res.send({
                                            ok: 0,
                                            error: 'deleteError'
                                        });
                                        res.end();
                                }
                        });                                          
                    }
                })
                .catch(error =>{
                    res.send({
                        ok:0,
                        error: error
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