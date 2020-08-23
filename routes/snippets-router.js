var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var usuario = require('../models/usuarios');
var jwt =  require('jsonwebtoken');
var mongoose = require('mongoose');
const usuarios = require('../models/usuarios');

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
                        let snippetsCount=0;
                        let max = 5;
                        if(userData[0].pro){
                            max=50;
                        }
                        for(let carpeta of userData[0].carpetas){
                            for(let content of carpeta.content){
                                if(content.type==='snippet'){
                                    snippetsCount=snippetsCount+1;
                                }
                            }                   
                        }
                        if(snippetsCount<max){
                            let snippetId = new mongoose.mongo.ObjectID();
                            let createdAt = new Date();
                            let newSnippet = {
                                _id: snippetId,
                                name: req.body.name,
                                language: req.body.language,
                                type: 'snippet',
                                createdAt: createdAt.toLocaleString(),
                                updatedAt: createdAt.toLocaleString(),
                                content: "",
                                public: false
                            };                        
                            usuarios.updateOne({"carpetas._id": mongoose.mongo.ObjectID(req.body['folderId'])},
                                {"$push": {"carpetas.$.content": newSnippet}}, function(err, val) {
                                    if(!err){
                                        res.send({
                                            ok: 1,
                                            snippetId: snippetId
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
                        else{
                            res.send({ok:0, error: 'snippetsCount', pro: userData[0].pro});
                            res.end();
                        }                      
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
router.get('/:folderId/:snippetId', function(req, res){
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
                        let folderId = req.params['folderId'];
                        if(!(folderId==='restored-elements')){
                            folderId = mongoose.mongo.ObjectId(folderId);
                        }
                        usuarios.aggregate([
                            { $unwind: '$carpetas' },
                            { $match: {'carpetas._id': mongoose.mongo.ObjectId(req.params['folderId'])}},
                            {
                                $project: {
                                    'filteredValue':{
                                        $filter: {
                                            input: "$carpetas.content",
                                            as: "solicited",
                                            cond: { $eq: [ '$$solicited._id', mongoose.mongo.ObjectId(req.params['snippetId']) ] }
                                        }
                                    }
                                }
                            }
                        ]).then(result => {
                            let snippetData = result[0].filteredValue[0];
                            snippetData.author = userData[0]['username'];
                            res.send({
                                ok:1,
                                snippetData: snippetData
                            });
                            res.end();
                        }).catch(fail => {
                            res.send({
                                ok:0,
                                projectId: fail
                            });
                            res.end();
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
                        res.send({
                            ok:1
                        });
                        res.end();
                        let updatedAt = new Date();
                        usuarios.updateOne(
                            { 
                              "_id": mongoose.mongo.ObjectId(decoded.id), 
                              "carpetas._id": mongoose.mongo.ObjectId(req.body.folderId), 
                              "carpetas.content._id": mongoose.mongo.ObjectId(req.body.snippetId) 
                            },
                            { 
                              "$set":{
                                  "carpetas.$[i].content.$[j].name":req.body.name,
                                  "carpetas.$[i].content.$[j].language":req.body.language,
                                  "carpetas.$[i].content.$[j].content":req.body.content,
                                  "carpetas.$[i].content.$[j].updatedAt": updatedAt.toLocaleString()
                                }
                            },
                            {
                                arrayFilters:[
                                    {"i._id":mongoose.mongo.ObjectId(req.body.folderId)}
                                    ,{"j._id":mongoose.mongo.ObjectId(req.body.snippetId)}
                                ]
                            },
                            function(f,v){
                                console.log(f);
                                console.log(v);
                            }
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