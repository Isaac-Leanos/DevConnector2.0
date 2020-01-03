const express = require("express");
const Post = require('../../models/Post').Post
const Profile = require('../../models/Profile').Profile
const User = require('../../models/User').User
const jwtAuth = require('../../middleware/auth');
const {check, validationResult} = require('express-validator')


// ------------------------------------()----------------------------------------------------------


const router = express.Router();







//@route  POST /api/post
//@desc   create post for users
//@access PRIVATE
router.post("/", [ jwtAuth,
    [
        check('text', 'Text is required').not().isEmpty(), 
    ]
], async (req, res)=> 
{
    const errors = validationResult(req);
    if(!errors.isEmpty())
    {
        return res.status(400).json({ errors: errors.array() });
    }

    // extract text field & user from request object
    const {text} = req.body;
    const user = req.user.id

    try 
    {
        // find user to access name and avatar
        const {name, avatar} = await User.findOne({_id: user}) 

        const post = new Post({
            user,
            text,
            name,
            avatar
        })    

        await post.save()
        
        return res.json({addedPost: post})


    } catch (error) 
    {
        console.log("~~~", error)
        return res.status(500).send('Server Error')
    }


});

//@route  GET /api/post
//@desc   GET all post for users
//@access PRIVATE
router.get("/", jwtAuth, async (req, res)=> 
{

    try 
    {
        const posts = await Post.find().sort({date: -1}) // sort by most recent

        if(!posts)
        {
            return res.status(400).json({ errors: [{msg: 'Posts not found'}]})       
        }  
        
        return res.json({allPost: posts})


    } catch (error) 
    {
        console.log("~~~", error)
        return res.status(500).send('Server Error')
    }


});


//@route  GET /api/post/:pst_id
//@desc   GET post for user
//@access PRIVATE
router.get("/:pst_id", jwtAuth, async (req, res)=> 
{

    const postToFind = req.params.pst_id

    try 
    {
        const post = await Post.findById({_id: postToFind})

        if(!post)
        {
            return res.status(400).json({ errors: [{msg: 'Post not found'}]})       
        }  
        
        return res.json({post})


    } catch (error) 
    {
        console.log("~~~", error)

        // if error is url post id related
        if(error.kind === 'ObjectId') 
        {
            return res.status(500).send('Post not found')            
        }
        return res.status(500).send('Server Error')
    }


});

//@route  DELETE /api/post/:pst_id
//@desc   DELETE post for users
//@access PRIVATE
router.delete("/:pst_id", jwtAuth, async (req, res)=> 
{

    const postToDelete = req.params.pst_id
    const user = req.user.id

    try 
    {

        const post = await Post.findById({_id: postToDelete})

        if(!post)
        {
            return res.status(400).json({ errors: [{msg: 'Post not found'}]})       
        }

        // check to see if user making request matches user who created the post
        if(post.user.toString() !== user) 
        {
            return res.status(401).json({msg: 'User not authorized to make this request'}) // 401 not authorized
        }
        
        await post.remove();
        
        return res.json({msg: post})


    } catch (error) 
    {
        console.log("~~~", error)

        // if error is url post id related
        if(error.kind === 'ObjectId') 
        {
            return res.status(500).send('Post not found')            
        }
        return res.status(500).send('Server Error')
    }

});


// ------------------------------------( L I K E S )----------------------------------------------------------


//@route  PUT /api/post/:pst_id/like
//@desc   LIKE user post
//@access PRIVATE
router.put("/:pst_id/like", jwtAuth, async (req, res)=> 
{

    const postToFind = req.params.pst_id
    const user = req.user.id

    try 
    {
        const post = await Post.findById({_id: postToFind})

        if(!post)
        {
            return res.status(400).json({ errors: [{msg: 'Post not found'}]})       
        }  

        if(post.likes.filter(x => x.user.toString() === user).length > 0)
        {
            return res.status(400).json({ errors: [{msg: 'cannot like post twice'}]})  
        }

        const like = {
            user
        }

        post.likes.unshift(like);

        await post.save()
        
        return res.json({likes: post.likes})


    } catch (error) 
    {
        console.log("~~~", error)

        // if error is url post id related
        if(error.kind === 'ObjectId') 
        {
            return res.status(500).send('Post not found')            
        }
        return res.status(500).send('Server Error')
    }


});


//@route  PUT /api/post/:pst_id/unlike
//@desc   UNLIKE user post
//@access PRIVATE
router.put("/:pst_id/unlike", jwtAuth, async (req, res)=> 
{

    const postToFind = req.params.pst_id
    const user = req.user.id

    try 
    {
        const post = await Post.findById({_id: postToFind})

        if(!post)
        {
            return res.status(400).json({ errors: [{msg: 'Post not found'}]})       
        }  

        if(post.likes.filter(x => x.user.toString() === user).length === 0)
        {
            return res.status(400).json({ errors: [{msg: 'Post has not yet been liked'}]})  
        }

        // filter out user by user id
        const clean = post.likes.filter(x => (
            x.user.toString() != user
        ));

        post.likes = [...clean];

        await post.save()
        
        return res.json({likes: post.likes, msg: 'post unliked'})


    } catch (error) 
    {
        console.log("~~~", error)

        // if error is url post id related
        if(error.kind === 'ObjectId') 
        {
            return res.status(500).send('Post not found')            
        }
        return res.status(500).send('Server Error')
    }


});


// ------------------------------------( C O M M E N T S )----------------------------------------------------------


//@route  POST /api/post/:pst_id/comment
//@desc   add comment to post
//@access PRIVATE
router.post("/:pst_id/comment", [ jwtAuth,
    [
        check('text', 'Text is required').not().isEmpty(), 
    ]
], async (req, res)=> 
{
    const errors = validationResult(req);
    if(!errors.isEmpty())
    {
        return res.status(400).json({ errors: errors.array() });
    }
    
    // extract text field, post id, & user from request object
    const {text} = req.body;
    const user = req.user.id;
    const postToFind = req.params.pst_id;

    try 
    {
        // find user -> grab user id and avatar for utilization
        const {avatar} = await User.findOne({_id: user});

        // construct our comment
        const comment = {
            user,
            text, // required
            avatar,
        }  

        // find post user is commenting on and add comment
        const post = await Post.findById({_id: postToFind});

        post.comments.unshift(comment);

        await post.save()
        
        return res.json({addedComment: post, msg: 'Comment added'})


    } catch (error) 
    {
        console.log("~~~", error)

        return res.status(500).send('Server Error')
    }

});


//@route  DELETE /api/post/:pst_id/comment/:cmt_id
//@desc   DELETE comment to a post
//@access PRIVATE
router.delete("/:pst_id/comment/:cmt_id", jwtAuth, async (req, res)=> 
{
    
    // extract user, post, & comment ids from request object
    const user = req.user.id;
    const postToFind = req.params.pst_id;
    const cmtToFind = req.params.cmt_id;

    try 
    {
        // find post we are dealing with with
        const post = await Post.findOne({_id: postToFind});

        if(!post)
        {
            return res.status(400).json({ errors: [{msg: 'Post not found'}]})       
        } 

        // find targeted comment
        const comment = post.comments.find(x => (
            x._id.toString() === cmtToFind
        ))

        // if comment doesn't exist
        if(!comment)
        {
            return res.status(400).json({ errors: [{msg: 'Comment not found'}]})       
        }

        // if comment set for deletion wasn't created by user trying to delete the comment
        if(comment.user.toString() !== user)
        {
            return res.status(400).json({ errors: [{msg: 'User not authorized to make this request'}]})       
        }
        
        // filter out comment set for deletion
        const clean = post.comments.filter(x => (
            x._id.toString() !== cmtToFind
        ))

        post.comments = [...clean]

        await post.save()
        
        return res.json({deletedComment: comment, msg: 'Comment deleted'})


    } catch (error) 
    {
        console.log("~~~", error)
        // if error is url post id related
        if(error.kind === 'ObjectId') 
        {
            return res.status(500).send('Post not found')            
        }
        return res.status(500).send('Server Error')
    }


});

module.exports = {
    router
}