const jwt = require("jsonwebtoken");
const config = require("config");









// verifies user by obtaining token from header
// decode token -> extract user -> pass to request object for later use
module.exports = function(req, res, next)
                 {
                     const token = req.header('x-auth-token'); // retrieve token from header

                     if(!token) return res.status(401).json({msg: 'No token, request denied'});

                     try {
                         const decoded = jwt.verify(token, config.get("jwtSecret")); // verify token has not been altered or simply verify user
                         req.user = decoded.user; // payload object -> attach user property to request object for further use 
                         console.log('~~~ payload', decoded.user);
                         next();
                     } catch (error) {
                         console.log("~~~ auth middleware error", error)
                         return res.status(401).json({msg: 'Token not valid'});
                     }


                 }