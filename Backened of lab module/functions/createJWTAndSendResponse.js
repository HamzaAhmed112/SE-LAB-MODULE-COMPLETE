const jwt = require('jsonwebtoken')
//const pool = require('../db/db_connection')
const executeQuery = require('./executeQuery')
const uniqueID = require('uniqid')



function createJWTAndSendResponce(req, res) {
    // Create a payload object for JWT
    const jwtPayload = {
      email: req.body.email,
      // Add other user-related information as needed
    };
  
    // Sign the JWT token
    const jwtToken = jwt.sign(jwtPayload, 'thisisdevelopment', { expiresIn: '30d', algorithm: 'HS512' });
  
    const jwtSQLQuery = `Exec login '${jwtToken}'`;
  
    executeQuery(jwtSQLQuery)
      .then(() => {
        res.status(200).send({ jwt: jwtToken });
      })
      .catch((error) => {
        console.error('Error in the JWT SQL query:', error);
        res.status(500).send(error);
      });
  }




exports.createJWTAndSendResponce = createJWTAndSendResponce;
