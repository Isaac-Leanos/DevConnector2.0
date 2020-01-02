const express = require("express");
const jwtAuth = require('../../middleware/auth');
const Profile = require('../../models/Profile').Profile;
const User = require('../../models/User').User;
const {check, validationResult} = require('express-validator')
const request = require('request');
const config = require('config')

// ------------------------------------()----------------------------------------------------------



const router = express.Router();

//@route GET /api/profile/:user
//@desc access a user profile
//@access PRIVATE
router.get("/self", jwtAuth, async (req, res)=> 
{
    try 
    {
        const profile = await Profile.findOne({user: req.user.id}).populate('user', ['name','avatar']) // add fields from our User model to this profile query

        if(!profile) 
        {
            return res.status(400).json({msg: 'Profile doesn\'t exist'})
        }

        res.json({profile})
    } catch (error) 
    {
        console.log("~~~", error)
        res.status(500).send('Server Error')
    }
});


//@route GET /api/profile/:user_id
//@desc GET specific user profiles
//@access PUBLIC
router.get("/:user_id", async (req, res)=> 
{
    try 
    {
        const profile = await Profile.findOne({user: req.params.user_id}).populate('user', ['name', 'avatar']);

        if(!profile) 
        {
            return res.status(400).json({msg: 'Profile doesn\'t exist'})
        }

        res.json({profile})
    } catch (error) 
    {
        console.log(error)
        if(error.kind === 'ObjectId') // this kind of error throws when :user_id is not a valid mongoose/mongo ObjectId
        {
            return res.status(400).json({msg: 'Profile doesn\'t exist'})
        }
        res.status(500).send('Server Error')

    }
})


//@route GET /api/profile/:users
//@desc GET ALL user profiles
//@access PUBLIC
router.get("/", async (req, res)=> 
{
    try 
    {
        const allProfiles = await Profile.find().populate('user', ['name', 'avatar']);

        if(!allProfiles) 
        {
            return res.status(400).json({msg: 'Profiles not found'})
        }

        res.json({allProfiles})
    } catch (error) 
    {
        console.log(error)
        res.status(500).send('Server Error')

    }
})

// ------------------------------------( E X P E R I E N C E field related )----------------------------------------------------------

//@route POST /api/profile/:user
//@desc UPDATE user profile
//@access PRIVATE
router.post("/", jwtAuth, async (req, res)=> 
{

    // destructure data from req.body and structure it to fit mongo schema
    const { // education , experience not included
        company,
        website,
        location,
        status,
        skills,
        bio,
        githubusername,
        youtube,
        twitter,
        facebook,
        linkedin,
        instagram
    } = req.body;

    const profileFields = {
        company,
        website,
        location,
        status,
        skills,
        bio,
        githubusername,
    };
    
    profileFields.user = req.user.id;
    if(skills) profileFields.skills = skills.split(',').map(x => x.trim());
    
    const socialObj = {
        youtube, 
        twitter, 
        facebook, 
        linkedin, 
        instagram
    }
    profileFields.social = socialObj;


    // user data passes validation checks
    try {
        let profile = await Profile.findOne({user: req.user.id})

        if(!profile)
        {
            return res.status(400).json({msg: 'Profile not found'})
        }

        // if profile exist, update it
        if(profile) 
        {
            profile = await Profile.findOneAndUpdate(
                {user: req.user.id}, // find by user id
                {$set: profileFields}, 
                {new: true}
                );

            return res.json(profile)
        }

        // if profile doesn't exist, create it
        // profile = new Profile(profileFields);
        // await profile.save()
        // res.json(profile)

    } catch (error) {
        console.log("~~~", error)
        res.status(500).send('Server Error')
    }
});


//@route DELETE /api/profile
//@desc DELETE user profile
//@access PRIVATE
router.delete("/", jwtAuth, async (req, res)=> 
{
    try 
    {
        // attempt to delete user profile before deleting user itself
        const deletedProfile = await Profile.findOneAndRemove({user: req.user.id});

          if (!deletedProfile) 
          {
            return res.status(400).json({ msg: 'Profile not found' });
          }
       
        // If there is a Profile to delete, then there is a related User to delete
          await User.findOneAndRemove({ _id: req.user.id });
       
          return res.json({ msg: 'User deleted' });

    } catch (error) 
    {
        console.log("~~~", error)
        res.status(500).send('Server Error')
    }
})



//@route PUT /api/profile/experience
//@desc ADD (update?) experience data to user profile
//@access PRIVATE
router.put("/experience", [ jwtAuth,
    [
        check('title', 'Title is required').not().isEmpty(), // first parameter/argument is key/property of post data as in (req.body.name) // may change to body(...)
        check('company', 'Company is required').not().isEmpty(),
        check('from', 'From date is required').not().isEmpty()
    ]
], async (req, res)=> 
{
    const errors = validationResult(req);
    if(!errors.isEmpty()) 
    {
        return res.status(400).json({ errors: errors.array() });
    }

    // destructure variables from req.object
    const {
        title, // required
        company, // required
        from, // required
        location,
        to,
        current,
        description, 
    } = req.body;

    const fieldsToAdd = {
        title, 
        company, 
        from, 
        location,
        to,
        current,
        description,
    }

    try 
    {
        const profile = await Profile.findOne({user: req.user.id});

        if(!profile)
        {
            return res.status(400).json({ msg: 'Profile not found' });
        }

        profile.experience.unshift(fieldsToAdd);

        await profile.save();

        return res.json(profile)
        
    } catch (error) 
    {
        console.log(error.message)
        res.status(500).send("Server Error")
    }
})



//@route DELETE /api/profile/experience
//@desc DELETE experience data for user profile
//@access PRIVATE
router.delete("/experience/:exp_id", jwtAuth, async (req, res)=> 
{

    const experienceID = req.params.exp_id;

    try 
    {
        const profile =  await Profile.findOne({user: req.user.id});

        if(!profile)
        {
            return res.status(400).json({ msg: 'Profile not found' });
        }

        const clean = profile.experience.filter(x => (
            x._id != experienceID
        ))

        profile.experience = [...clean];

        await profile.save();

        return res.json(profile)
        
    } catch (error) 
    {
        console.log(error.message)
        res.status(500).send("Server Error")
    }
});


// ------------------------------------( E D U C A T I O N field related )----------------------------------------------------------


//@route PUT /api/profile/education
//@desc ADD (update?) education data to user profile
//@access PRIVATE
router.put("/education", [ jwtAuth,
    [
        check('degree', 'Degree is required').not().isEmpty(), // first parameter/argument is key/property of post data as in (req.body.name) // may change to body(...)
        check('school', 'School is required').not().isEmpty(),
        check('fieldofstudy', 'Field of study is required').not().isEmpty(),
        check('from', 'From date is required').not().isEmpty()
    ]
], async (req, res)=> 
{
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // destructure variables from req.object
    const {
        degree, // required
        school, // required
        fieldofstudy,
        from, // required
        to,
        current,
        description, 
    } = req.body;

    const fieldsToAdd = {
        degree, 
        school, 
        fieldofstudy,
        from, 
        to,
        current,
        description,
    }

    try 
    {
        const profile = await Profile.findOne({user: req.user.id});

        if(!profile)
        {
            return res.status(400).json({ msg: 'Profile not found' });
        }

        profile.education.unshift(fieldsToAdd);

        await profile.save();

        return res.json(profile)
        
    } catch (error) 
    {
        console.log(error.message)
        res.status(500).send("Server Error")
    }
})

//@route DELETE /api/profile/education
//@desc DELETE education data for user profile
//@access PRIVATE
router.delete("/education/:edu_id", jwtAuth, async (req, res)=> 
{

    const educationID = req.params.edu_id;

    try 
    {
        const profile =  await Profile.findOne({user: req.user.id});

        if(!profile)
        {
            return res.status(400).json({ msg: 'Profile not found' });
        }

        const clean = profile.education.filter(x => (
            x._id != educationID
        ))

        profile.education = [...clean];

        await profile.save();

        return res.json(profile)
        
    } catch (error) 
    {
        console.log(error.message)
        res.status(500).send("Server Error")
    }
});


// ------------------------------------( G I T H U B - A P I )----------------------------------------------------------



//@route  GET /api/profile/github/:username
//@desc   GET github data for user
//@access PUBLIC
router.get("/github/:username", async (req, res)=> 
{

    try 
    {
        const requestOptions = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubApiClientId')}&client_secret=${config.get('githubApiClientSecret')}`,
            method: 'get',
            headers: {'user-agent': 'node.js'}
        }

        request(requestOptions, (error, response, body)=>
        {
            if (error) console.log(error);

            if(response.statusCode !== 200)
            {
                return res.status(400).json({ msg: 'Github profile not found' }); // 404 not found
            }

           return res.json(JSON.parse(body) );

        })

        
    } catch (error) 
    {
        console.log(error.message)
        res.status(500).send("Server Error")
    }
});





module.exports = {
    router
}