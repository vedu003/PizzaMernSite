//DB Connection

const mongoose = require("mongoose");
const conn = mongoose.connect("mongodb://localhost:27017/pizzamern",{
    useNewUrlParser:true,
    useUnifiedTopology:true,
    useCreateIndex:true
}).then(()=> {
    console.log("connection sucessful");
}).catch((e)=> {
    console.log(e);
});

