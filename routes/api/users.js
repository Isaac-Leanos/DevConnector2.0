
const express = require("express");
const {check, validationResult} = require('express-validator');
const User = require('../../models/User').User;
const gravatar = require("gravatar");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const config = require('config');
const nodemailer = require('nodemailer');

// ------------------------------------()----------------------------------------------------------



const router = express.Router();

//@route  GET /api/users
//@access PUBLIC

router.post("/",
[
    check('name', 'Name is required').not().isEmpty(), // first parameter/argument is key/property of post data as in (req.body.name) // may change to body(...)
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must have a minimum of 6 characters').isLength({min: 6})
], async (req, res)=> 
{
    // validation
    let errors = validationResult(req);
    if (!errors.isEmpty()) 
    {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const {name, email, password} = req.body;

    // user data passes validation checks
    try 
    {
        let user = await User.findOne({email});
        if(user)
        {
           return res.status(400).json({ errors: [{msg: 'User already exist'},]})         // 400 bad request // array errors to mimic expresss-validator
        }

        const avatar = gravatar.url(email, {s: '200', r: 'pg', d: 'mm'});     // s=size, r=rated pg, d=default image

        user = new User({name, email, password, avatar}); // instance of User, inherits functionality

        let salt = await bcrypt.genSalt(10);

            user.password = await bcrypt.hash(password, salt);

        await user.save();
        // -------------------
        // transporter is going to be an object that is able to send mail
        // transport is the transport configuration object, connection url or a transport plugin instance
        // defaults is an object that defines default values for mail options

        
        
        
            let testAccount = await nodemailer.createTestAccount();

            let transporter = nodemailer.createTransport({

                host: "smtp.ethereal.email",
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: testAccount.user, // generated ethereal user
                    pass: testAccount.pass // generated ethereal password
                },
                tlc: {
                    rejectUnauthorized: false
                }
            });
        
            // send mail with defined transport object
            let info = await transporter.sendMail({

                from: 'devconnector.heroku.com', // sender address // access deployed heroku URL
                to: `${user.email}`, // list of receivers
                subject: "Confirm Email ✔", // Subject line
                text: "Click on the following link to confirm your email", // re route to main page
            });
        
            console.log("Message sent: %s", info.messageId);

            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info)); /// display this for user to go to confirmation
            
            res.send('email sent')


        
            // ------------------


            // payload object attaches to token object
            // const payload = {user: {id: user.id }} // id = _id from mongodb

            // jwt.sign(payload,config.get('jwtSecret'),{expiresIn: 360000},(err, token)=>
            // {
            //     if(err) throw err;
            //     res.json({token}); // verification code route?
            // }
            // )

        
    } catch (error) 
    {
        console.log('~~~ error message ~~~', error.message)
        return res.status(500).send('Server error')
    }

});


module.exports = {
    router
}