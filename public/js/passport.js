const LocalStrategy = require('passport-local').Strategy;
const Register =  require("../../src/models/user");
const bcrypt = require("bcryptjs");

function init(passport) {
    passport.use(new LocalStrategy({usernameField: 'email'}, async (email,password,done) => {
        const register = await Register.findOne({email:email})
        if(!register) {
            return done(null, false, {message:"Email Not Registered."})
        }
        else {
            bcrypt.compare(password,register.pass).then(match => {

                if(match) {
                    return done(null,register, {message:"Login Sucessfully."})
                }

                return done(null,false, {message:"Wrong Email or Password."})
            }).catch(err => {
                return done(null,false, {message:"Something Went Wrong."})
            })
        }
    } ))

    passport.serializeUser((register,done)=> {
        done(null,register._id)
    })

    passport.deserializeUser((id,done)=>{
        Register.findById(id,(err,register) => {
            done(err,register)
        })
    })
}

module.exports = init