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
                            if(result[0].papelera[0].type){
                                let count = 0;
                                let max = 5;
                                if(userData[0].pro){
                                    max = 50;
                                }
                                for(let carpeta of userData[0].carpetas){
                                    for(let content of carpeta.content){
                                        if(content.type===result[0].papelera[0].type){
                                            count = count +1;
                                        }                                        
                                    }
                                }
                                if(count<max){
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
                                }
                                else{
                                    res.send({
                                        ok:0,
                                        error: `${result[0].papelera[0].type}sCount`,
                                        type: result[0].papelera[0].type,
                                        pro: userData[0].pro
                                    });
                                    res.end();
                                }
                            }
                            else{
                                let projectsCount = 0;
                                let snippetsCount = 0;
                                let max = 5;
                                if(userData[0].pro){
                                    max=50;
                                }
                                for (let carpeta of userData[0].carpetas){
                                    for(let content of carpeta.content){
                                        if(content.type==='project'){
                                            projectsCount=projectsCount+1;
                                        }
                                        if(content.type==='snippet'){
                                            snippetsCount=snippetsCount+1;
                                        }
                                    }
                                }                                                           
                                for(let content of result[0].papelera[0].content){
                                        if(content.type==='project'){
                                            projectsCount=projectsCount+1;
                                        }
                                        if(content.type==='snippet'){
                                            snippetsCount=snippetsCount+1;
                                        }
                                }
                                
                                if(projectsCount>max){
                                    res.send({
                                        ok:0,
                                        error: 'projectsCount',
                                        type: 'project',
                                        pro: userData[0].pro
                                    });
                                    res.end();
                                }
                                else{
                                    if(snippetsCount>max){
                                        res.send({
                                            ok:0,
                                            error: 'snippetsCount',
                                            type: 'count',
                                            pro: userData[0].pro
                                        });
                                        res.end();
                                    }
                                    else{
                                        let deletedContent = result[0].papelera[0];
                                        usuarios.updateOne(
                                            {_id: decoded.id},
                                            {'$push': {'carpetas': deletedContent}},function(err1, val1){
                                                if(!err1){
                                                    usuarios.updateOne(
                                                        { 
                                                            "_id": mongoose.mongo.ObjectId(decoded.id), 
                                                            "papelera._id": mongoose.mongo.ObjectId(deletedContent._id)
                                                        },
                                                        { 
                                                            "$pull":{ 
                                                                "papelera": {'_id': mongoose.mongo.ObjectId(deletedContent._id)}
                                                            }
                                                        },
                                                        function(f,v){
                                                            console.log(f);
                                                            console.log(v);
                                                            if(!f){
                                                                res.send({ok:1});
                                                                res.end();
                                                            }
                                                            else{
                                                                res.send({ok:0, error: f});
                                                                res.end();
                                                            }
                                                        }
                                                    );
                                                }
                                                else{
                                                    res.send({ok:0, error:err1});
                                                    res.end();
                                                }
                                            }
                                        );
                                    }
                                }
                            }                            
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

router.delete('/:contentId', function(req, res){
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
                            {'_id': decoded.id},
                            {'$pull': {'papelera': {'_id': mongoose.mongo.ObjectId(req.params['contentId'])}}},
                            function(err1, val1){
                                if(!err1){
                                    res.send({ok:1});
                                    res.end();
                                }
                                else{
                                    res.send({ok:0, error:err1});
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