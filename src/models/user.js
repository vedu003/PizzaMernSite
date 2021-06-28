const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

    const userregi= new mongoose.Schema({
        
    name: {
        type:String,
        required:true
    },
    email: {
        type:String,
        required:true,
        unique:true,
        validate(value) {
            if(!validator.isEmail(value)){
                throw new Error("Email is Invalid");
            }
        }
    },
    contact: {
        type: Number,
        required:true,
    },
    pass: {
        type:String,
        required:true
    },
    cpass: {
        type:String,
        required:true
    },
    role: {
        type:String,
        default: "Customer"
    }
},{timestamps :true})

userregi.pre("save",async function(next){

    if(this.isModified("pass")) {
    this.pass = await bcrypt.hash(this.pass,10);
    this.cpass=undefined;
    }
    next();
})

const Register = new mongoose.model("Register",userregi);
module.exports=Register;