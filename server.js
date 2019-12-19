const express = require('express');
const connectToDB = require('./config/mongodb').connectDB;
// ----------------------------------------------------------------------------------------------

const app = express();
const PORT = process.env.PORT || 5000;

connectToDB();

app.get('/',(req, res)=>{
    res.send('api running')
});

// console.log(process.env)

app.listen(PORT, ()=> console.log(`~~~ port running on port ${PORT} ~~~`));