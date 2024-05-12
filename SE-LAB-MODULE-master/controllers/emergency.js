const path = require('path')


const index = (req,res)=>{
        res.sendFile(path.join(__dirname,'..','public','emergency','index.html'));
}

const login = (req,res)=>{
    res.sendFile(path.join(__dirname,'..','public','emergency','login.html'));
}

module.exports ={
    index,
    login
}