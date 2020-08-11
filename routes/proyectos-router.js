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
router.get('/:folderId/:projectId', (req, res) => {
    console.log("Solicitud de proyecto");
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
                            { $match: {'carpetas._id': folderId}},
                            {
                                $project: {
                                    'filteredValue':{
                                        $filter: {
                                            input: "$carpetas.content",
                                            as: "proyRequerido",
                                            cond: { $eq: [ '$$proyRequerido._id', mongoose.mongo.ObjectId(req.params['projectId']) ] }
                                        }
                                    }
                                }
                            }
                        ]).then(result => {
                            console.log(req.params);
                            res.send({
                                ok:1,
                                project: result[0].filteredValue[0]
                            });
                            res.end();
                        }).catch(fail => {
                            console.log(fail);
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
                        let projectId = new mongoose.mongo.ObjectID();
                        let createdAt = new Date();
                        let newProject = {
                            _id: projectId,
                            _id_string: projectId.toString(),
                            name: req.body.content2Save.name,
                            type: 'project',
                            public: req.body.content2Save.public,
                            createdAt: createdAt.toLocaleString(),
                            updatedAt: createdAt.toLocaleString(),
                            htmlContent: req.body.content2Save.htmlContent,
                            jsContent: req.body.content2Save.jsContent,
                            cssContent: req.body.content2Save.cssContent,
                            includeBootstrap: req.body.content2Save.includeBootstrap,
                            includeMaterialize: req.body.content2Save.includeMaterialize,
                            includeJQuery: req.body.content2Save.includeJQuery,
                            includeFontawesome: req.body.content2Save.includeFontawesome
                        };
                        usuarios.updateOne({"carpetas._id": mongoose.mongo.ObjectID(req.body['folderId'])},
                            {"$push": {"carpetas.$.content": newProject}}, function(err, val) {
                                if(!err){
                                    res.send({
                                        ok: 1,
                                        projectId: projectId
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
                        //*************************** */
                        /*usuarios.aggregate([
                            { $unwind: '$carpetas' },
                            { $match: {'carpetas._id': mongoose.mongo.ObjectId('5f2b69c749e68228444b2b00')}},
                            {
                                $project: {
                                    'filteredValue':{
                                        $filter: {
                                            input: "$carpetas.content",
                                            as: "proyRequerido",
                                            cond: { $eq: [ '$$proyRequerido._id', mongoose.mongo.ObjectId('5f2c66f2f49a1e01f045e089') ] }
                                        }
                                    }
                                }
                            }
                        ]).then(result => {
                            console.log(result[0].filteredValue[0]);
                            res.send({
                                ok:1,
                                projectId: 'new'
                            });
                            res.end();
                        }).catch(fail => {
                            console.log(fail);
                            res.send({
                                ok:0,
                                projectId: fail
                            });
                            res.end();
                        });*/

                        /*usuarios.updateOne({"carpetas._id": mongoose.mongo.ObjectID(req.body['folderId'])},
                            {"$set": {"carpetas.$.content": []}}, function(err, val) {
                                if(!err){
                                    res.send({
                                        ok: 1,
                                        projectId: projectId
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
                        });*/
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
//db.usuarios.updateOne({'_id': ObjectId('5f2b69c449e68228444b2aff'),'carpetas': ObjectId('5f2c66b73ab2aa1c849c7b06'),'carpetas.content': ObjectId('5f2c6701f49a1e01f045e08a')},{$set: { "carpetas.content.$$.htmlContent": '<div>:v</div>',}});
                usuarios.find({_id: decoded.id})
                .then(userData =>{
                    if (userData.length==1){
                        let updatedAt = new Date();
                        let folderId = req.body.folderId;
                        if(!(folderId==='restored-elements')){
                            folderId=mongoose.mongo.ObjectId(folderId);
                        }
                        usuarios.updateOne(
                            { 
                              "_id": mongoose.mongo.ObjectId(decoded.id), 
                              "carpetas._id": folderId, 
                              "carpetas.content._id": mongoose.mongo.ObjectId(req.body.projectId) 
                            },
                            { 
                              "$set":{ 
                                  "carpetas.$[i].content.$[j].htmlContent":req.body.content2Save.htmlContent,
                                  "carpetas.$[i].content.$[j].jsContent":req.body.content2Save.jsContent,
                                  "carpetas.$[i].content.$[j].cssContent":req.body.content2Save.cssContent,
                                  "carpetas.$[i].content.$[j].includeBootstrap":req.body.content2Save.includeBootstrap,
                                  "carpetas.$[i].content.$[j].includeMaterialize":req.body.content2Save.includeMaterialize,
                                  "carpetas.$[i].content.$[j].includeJQuery":req.body.content2Save.includeJQuery,
                                  "carpetas.$[i].content.$[j].includeFontawesome":req.body.content2Save.includeFontawesome,
                                  "carpetas.$[i].content.$[j].updatedAt": updatedAt.toLocaleString()
                                }
                            },
                            {
                                arrayFilters:[
                                    {"i._id":folderId}
                                    ,{"j._id":mongoose.mongo.ObjectId(req.body.projectId)}
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
router.delete('/:folderId/:contentId', (req, res)=>{
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
                        if(!(req.params['folderId']==='restored-elements')){
                            usuarios.aggregate([
                                { $unwind: '$carpetas' },
                                { $match: {'carpetas._id': mongoose.mongo.ObjectId(req.params['folderId'])}},
                                {
                                    $project: {
                                        'filteredValue':{
                                            $filter: {
                                                input: "$carpetas.content",
                                                as: "proyRequerido",
                                                cond: { $eq: [ '$$proyRequerido._id', mongoose.mongo.ObjectId(req.params['contentId']) ] }
                                            }
                                        }
                                    }
                                }
                            ]).then(result => {
                                let deletedContent = result[0].filteredValue[0];
                                deletedContent.folderId=req.params['folderId']
                                usuarios.updateOne({},
                                {"$push": {"papelera": deletedContent}}, function(err, val) {
                                    if(!err){
                                        usuarios.updateOne(
                                            { 
                                            "_id": mongoose.mongo.ObjectId(decoded.id), 
                                            "carpetas._id": mongoose.mongo.ObjectId(req.params['folderId']), 
                                            "carpetas.content._id": mongoose.mongo.ObjectId(req.params['contentId']) 
                                            },
                                            { 
                                            "$pull":{ 
                                                  "carpetas.$.content": {'_id': mongoose.mongo.ObjectId(req.params['contentId'])}
                                                }
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
                                    else{
                                        res.send({
                                            ok: 0,
                                            error: 'saveError'
                                        });
                                        res.end();
                                    }
                                });
                            }).catch(fail => {
                                console.log(fail);
                                res.send({
                                    ok:0,
                                    projectId: fail
                                });
                                res.end();
                            });
                        }else{
                            usuarios.aggregate([
                                { $unwind: '$carpetas' },
                                { $match: {'carpetas._id': req.params['folderId']}},
                                {
                                    $project: {
                                        'filteredValue':{
                                            $filter: {
                                                input: "$carpetas.content",
                                                as: "proyRequerido",
                                                cond: { $eq: [ '$$proyRequerido._id', mongoose.mongo.ObjectId(req.params['contentId']) ] }
                                            }
                                        }
                                    }
                                }
                            ]).then(result => {
                                let deletedContent = result[0].filteredValue[0];
                                deletedContent.folderId=req.params['folderId']
                                usuarios.updateOne({},
                                {"$push": {"papelera": deletedContent}}, function(err, val) {
                                    if(!err){
                                        usuarios.updateOne(
                                            { 
                                            "_id": mongoose.mongo.ObjectId(decoded.id), 
                                            "carpetas._id": req.params['folderId'], 
                                            "carpetas.content._id": mongoose.mongo.ObjectId(req.params['contentId']) 
                                            },
                                            { 
                                            "$pull":{ 
                                                  "carpetas.$.content": {'_id': mongoose.mongo.ObjectId(req.params['contentId'])}
                                                }
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
                                    else{
                                        res.send({
                                            ok: 0,
                                            error: 'saveError'
                                        });
                                        res.end();
                                    }
                                });
                            }).catch(fail => {
                                console.log(fail);
                                res.send({
                                    ok:0,
                                    projectId: fail
                                });
                                res.end();
                            });
                        }
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