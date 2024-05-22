const jwt = require('jsonwebtoken')
const executeQuery = require('../functions/executeQuery')


async function jwt_authenticate_user(req, res, next) {
  try {
    const rawToken = req.headers.authorization;
    if (!rawToken || !rawToken.startsWith('Bearer ')) {
      return res.status(401).send({ error: 'Invalid token format' });
    }

    const token = rawToken.replace('Bearer ', '');

    const sqlQuery = `
      SELECT * FROM jwts
      WHERE token = '${token}';
    `;

    try {
      const result = await executeQuery(sqlQuery);

      if (!result || result.length === 0) {
        return res.status(401).send({ error: 'Invalid token' });
      }

      const decodedData = jwt.verify(token, 'thisisdevelopment');

      const userID = await executeQuery(`SELECT user_id FROM users WHERE email LIKE '${decodedData.email}'`);

      req.user_id = userID[0].user_id;
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).send({ error: 'Token verification failed' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Internal Server Error' });
  }
}



// function jwt_authenticate_user(req, res, next) {
//     try {
//         console.log('jwt middleware working')
//         console.log(req.headers)
//         var rawToken = req.headers.authorization;
//         const token = rawToken.replace('Bearer ', '');
        
//         var decodedData = jwt.verify(token, 'thisisdevelopment');
//         const user_id = decodedData.user_id;
//         const sqlQuery = SELECT * FROM jwts WHERE token = '${token}';

//         pool.query(sqlQuery, (err, result, fields) => {
//             if (err) {
//                 console.log('t3')
//                 res.status(401).send({
//                    error: err.code,
//                    e: err
//                 });
//                 return;
//             } 
//             jwt.verify(result[0].token, 'thisisdevelopment', function (error, data) {
//                 if (error) {
//                     console.log('t2')
//                     res.status(401).send({error: error.name});
//                     return;
//                 }
//                 if (data.user_id == decodedData.user_id) {
//                     req.user_id = data.user_id;
//                     next();
//                 } else {
//                     console.log('t1')
//                     res.status(401).send();
//                 }
//             })
//         })
//     } catch (err) {
//         console.log(err)
//     }
// }


exports.jwt_auth = jwt_authenticate_user;