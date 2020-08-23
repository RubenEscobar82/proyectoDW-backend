var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var usuario = require('../models/usuarios');
var jwt =  require('jsonwebtoken');
var mongoose = require('mongoose');
const usuarios = require('../models/usuarios');

router.get('/', (req, res) => {
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
                        usuarios.aggregate([
                            { $unwind: '$carpetas' },
                            { $match: {}},
                            {
                                $project: {
                                    'filteredValue':{
                                        $filter: {
                                            input: "$carpetas.content",
                                            as: "solicited",
                                            cond: { $eq: [ '$$solicited.public', true ] }
                                        }
                                    },
                                    'folderId': '$carpetas._id',
                                    'author': '$username'
                                }
                            }
                        ]).then(result => {
                            result = result.filter(function(entry){
                                return entry._id!=decoded.id;
                            });
                            let projects = [];
                            let pinnedProjects = [];
                            for(let pinnedProject of userData[0].fiajados){
                                pinnedProjects.push({_id: pinnedProject._id});
                            }
                            for(i=0; i<result.length; i++){
                                for(j=0;  j<result[i].filteredValue.length; j++){
                                    result[i].filteredValue[j]['author']=result[i].author;
                                    result[i].filteredValue[j]['folderId']=result[i].folderId;
                                }
                                projects = projects.concat(result[i].filteredValue);
                            }
                            res.send({ok:1, projects: projects, pinnedProjects: pinnedProjects});
                            res.end();
                        }).catch(fail => {
                            res.send({
                                ok:0,
                                error: fail,                                
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

router.get('/:searchText', (req, res) => {
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
                        usuarios.aggregate([
                            { $unwind: '$carpetas' },
                            { $match: {}},
                            {
                                $project: {
                                    'filteredValue':{
                                        $filter: {
                                            input: "$carpetas.content",
                                            as: "solicited",
                                            cond: { $eq: [ '$$solicited.public', true ] }
                                        }
                                    },
                                    'folderId': '$carpetas._id',
                                    'author': '$username'
                                }
                            }
                        ]).then(result => {
                            result = result.filter(function(entry){
                                return entry._id!=decoded.id;
                            });                            
                            let projects = [];
                            let pinnedProjects = [];
                            for(let pinnedProject of userData[0].fiajados){
                                pinnedProjects.push({_id: pinnedProject._id});
                            }
                            for(i=0; i<result.length; i++){
                                for(j=0;  j<result[i].filteredValue.length; j++){
                                    result[i].filteredValue[j]['author']=result[i].author;
                                    result[i].filteredValue[j]['folderId']=result[i].folderId;
                                }
                                projects = projects.concat(result[i].filteredValue);
                            }

                            let resultsByName = projects.filter(function(entry){
                                return entry.name.toLowerCase().includes(req.params['searchText'].toLowerCase());
                            });
                            let resultsByUser = projects.filter(function(entry){
                                return entry.author.toLowerCase().includes(req.params['searchText'].toLowerCase());
                            });
                            
                            for(i = 0; i<resultsByName.length; i++){
                                resultsByUser = resultsByUser.filter(function(entry){
                                    return entry._id!=resultsByName[i]._id;
                                });
                            }
                            
                            projects = resultsByName.concat(resultsByUser);
                            res.send({ok:1, searchResults: projects, pinnedProjects: pinnedProjects});
                            res.end();
                        }).catch(fail => {
                            res.send({
                                ok:0,
                                error: fail,                                
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

module.exports = router;