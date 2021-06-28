const mongoose = require("mongoose");
const validator = require("validator");

const contactuser= new mongoose.Schema({
    name: {
        type:String,
        required:true
    },
    email: {
        type:String,
        required:true,
        validate(value) {
            if(!validator.isEmail(value)){
                throw new Error("Email is Invalid");
            }
        }
    },
    contactno: {
        type: Number,
        required:true,
    },
    msg: {
        type: String,
        required: true
    },
    date: {
        type:Date,
        default:Date.now
    }
})
const ContactUserInfo = new mongoose.model("ContactUserInfo",contactuser);
module.exports=ContactUserInfo;