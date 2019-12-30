const express = require("express");
// ------------------------------------()----------------------------------------------------------



const router = express.Router();

//@route GET /api/profile/:user
//@desc access user profile
//@access PRIVATE
router.get("/", (req, res)=> 
{
    res.send('post router')
});


module.exports = {
    router
}