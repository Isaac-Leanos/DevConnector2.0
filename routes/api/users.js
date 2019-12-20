const express = require("express");
const {check, validationResults} = require('express-validator');

// ------------------------------------()----------------------------------------------------------



const router = express.Router();

//@route
//@access

router.post("/", (req, res)=> 
{
    // console.log(`~~~ ${req.body} ~~~`)
    res.send(req.body)
});


module.exports = {
    router
}