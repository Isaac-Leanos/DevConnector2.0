const mongoose = require("mongoose"); // object modeling tool for mongo db
const config = require("config");


const mongodbURI = config.get("mongoURI"); 

const connectDB = async ()=>
{
    try 
    {
        await mongoose.connect(mongodbURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
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