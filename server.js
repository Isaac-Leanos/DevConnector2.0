const express = require('express');
const connectToDB = require('./config/mongodb').connectDB;

// ------------------------------------(I N I T I A L I Z A T I O N)----------------------------------------------------------

const app = express();
const PORT = process.env.PORT || 5000;
connectToDB();

// ------------------------------------(M I D D L E W A R E)----------------------------------------------------------

app.use(express.json({extended: false})); // for request.body

// ------------------------------------()----------------------------------------------------------

app.get('/',(req, res)=>
{
    res.send('api running')
});

// ------------------------------------(R O U T E R)----------------------------------------------------------

app.use('/api/user', require('./routes/api/user').router); // when we hit this endpoint, use router bein required
app.use('/api/auth', require('./routes/api/auth').router);
app.use('/api/profile', require('./routes/api/profile').router);
app.use('/api/post', require('./routes/api/post').router);


// ----------------------------------------------------------------------------------------------


app.listen(PORT, ()=> console.log(`~~~ port running on port ${PORT} ~~~`));