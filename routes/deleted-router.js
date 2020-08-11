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
                            deletedItems: userData[0].papelera
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

router.put('/', (req, res) =>{
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
                        usuarios.find(
                            { '_id': mongoose.mongo.ObjectId(decoded.id), 'papelera._id': mongoose.mongo.ObjectId(req.body.contentId)},
                            { 'papelera.$._id': mongoose.mongo.ObjectId(req.body.contentId) }
                        )
                        .then(result=>{
                            let deletedContent = result[0].papelera[0];
                            let originFolderId = deletedContent.folderId;
                            if(!(deletedContent.folderId==='restored-elements')){
                                originFolderId = mongoose.mongo.ObjectId(originFolderId);
                            }
                            usuarios.find(
                                {'_id': mongoose.mongo.ObjectId(decoded.id), 'carpetas._id': originFolderId},
                                {'carpetas.$._id': originFolderId}
                            ).then(folderCoincidences =>{
                                if(folderCoincidences.length==1){
                                    let folderId = folderCoincidences[0].carpetas[0]._id;
                                    usuarios.updateOne({"carpetas._id": originFolderId},
                                        {"$push": {"carpetas.$.content": deletedContent}}, function(err, val) {
                                        if(!err){
                                            usuarios.update(
                                                { _id: mongoose.mongo.ObjectId(decoded.id)},
                                                { "$pull": { "papelera": { "_id": mongoose.mongo.ObjectId(deletedContent._id)}}},
                                                { safe: true, multi:true }, function(err, obj) {
                                                    res.send({
                                                        ok: 1                                                        
                                                    });
                                                    res.end();
                                            });                                            
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
                                else{
                                    usuarios.updateOne({"carpetas._id": "restored-elements"},
                                        {"$push": {"carpetas.$.content": deletedContent}}, function(err, val) {
                                        if(!err){
                                            usuarios.update(
                                                { _id: mongoose.mongo.ObjectId(decoded.id)},
                                                { "$pull": { "papelera": { "_id": mongoose.mongo.ObjectId(deletedContent._id)}}},
                                                { safe: true, multi:true }, function(err, obj) {
                                                    res.send({
                                                        ok: 1                                                        
                                                    });
                                                    res.end();
                                            });                                            
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
                            });
                        });
                    }
                    else{
                        res.send({
                            ok:0,
                            error:'userError'
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