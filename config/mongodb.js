const mongoose = require("mongoose"); // object modeling tool for mongo db
const mongodbURI = require("config").get('mongoURI');


// --------------------

const connectDB = async ()=>
{
    try 
    {
        await mongoose.connect(mongodbURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        });
        console.log('~~~ mongoose->mongoDB connected ~~~');
    } catch (error) 
    {
        console.log('~~~ mongoose/mongo ~~~',error.message);
        // exit process
        process.exit(1);
    }
}


module.exports = {
    connectDB
}