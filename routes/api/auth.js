const express = require("express");
const jwtAuth = require('../../middleware/auth');
const User = require('../../models/User').User;
const {check, validationResult} = require('express-validator');
const jwt = require("jsonwebtoken");
const config = require('config');
const bcrypt = require('bcryptjs');


// ------------------------------------()----------------------------------------------------------


const router = express.Router();

// ------------------------------------()----------------------------------------------------------



//@route  GET /api/auth
//@access PRIVATE
router.get("/", jwtAuth, async (req, res)=> // change to function 
{
    try 
    {
        // using header, retreive user data from mongodb
        let user = req.user; 
        user = await User.findById(user.id).select('-password'); // .select() = select all data from found user except password
        res.json(user)
        

    } catch (error) 
    {
        console.log('~~~', error);
        return res.status(500).send('Server error');
    }
});





//@route  POST /api/auth
//@descr  Sign in - authenticate user & fetch token
//@access PUBLIC

router.post("/",
[
    check('email', 'Please include a valid email').isEmail(),
    // check('password', 'Password must have a minimum of 6 characters').exists()
], async (req, res)=> 
{
    // validation
    let errors = validationResult(req);
    if (!errors.isEmpty()) 
    {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const {email, password} = req.body;

    // user data passes validation checks
    try 
    {
        let user = await User.findOne({email});
        if(!user)
        {
           return res.status(400).json({ errors: [{msg: 'You have entered an invalid email or password'} ]})         // 400 bad request // array errors to mimic expresss-validator
        }

            const matchPassword = await bcrypt.compare(password, user.password);

            if(!matchPassword)
            {
                return res.status(400).json({ errors: [{msg: 'You have entered an invalid email or password'} ]})
            } 



            const payload = {user: {id: user.id }} // id = _id from mongodb

            jwt.sign(payload,config.get('jwtSecret'),{expiresIn: 360000},(err, token)=>
            {
                if(err) throw err;
                res.json({token}); // verification code route?
            })

        
    } catch (error) 
    {
        console.log('~~~ error message ~~~', error.message)
        return res.status(500).send('Server error')
    }

});





module.exports = {
    router
}