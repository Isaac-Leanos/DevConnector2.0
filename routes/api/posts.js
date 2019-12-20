const express = require("express");
// ------------------------------------()----------------------------------------------------------



const router = express.Router();

//@route
//@access
router.get("/", (req, res)=> // change to function 
{
    res.send('post router')
});


module.exports = {
    router
}