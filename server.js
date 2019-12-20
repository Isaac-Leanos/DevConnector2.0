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

app.use('/api/users', require('./routes/api/users').router); // when we hit this endpoint, use router bein required
app.use('/api/auth', require('./routes/api/auth').router);
app.use('/api/profiles', require('./routes/api/profiles').router);
app.use('/api/posts', require('./routes/api/posts').router);


// ----------------------------------------------------------------------------------------------


app.listen(PORT, ()=> console.log(`~~~ port running on port ${PORT} ~~~`));