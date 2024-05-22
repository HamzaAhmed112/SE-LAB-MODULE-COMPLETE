const express = require('express')
const path = require('path')
const erms = require('./routes/emergency');
const lab = require('./routes/lab')
const cors=require('cors')
const bodyParser = require('body-parser');


const application = express();
const PORT = process.env.PORT || 3000;
require('dotenv').config({ path: '.env' });
//middleware
application.use(cors());
application.use(express.static('./public'));
application.use(express.json())
application.use(bodyParser.json());
application.use(express.urlencoded({ extended: true }));

//router
application.use('/emergency', erms)
application.use('/', lab)



//server
application.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});