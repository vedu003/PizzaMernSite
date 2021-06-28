require('dotenv').config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 1111;
require("./db/conn")

const Menu =  require("./models/menu");
const Register =  require("./models/user");
const Order =  require("./models/order");
const ContactUserInfo =  require("./models/contactus");

const path= require("path");
const ejs=require("ejs");
const expressLayout=require("express-ejs-layouts");

const passport = require('passport');
const moment = require('moment');
const Emitter = require('events');


//Middleware
const guest = require('../public/js/middleware/guest');
const auth = require('../public/js/middleware/auth');
const admin = require('../public/js/middleware/admin');



const flash = require("express-flash"); 
const session = require("express-session");
const MongoDbStore = require("connect-mongodb-session")(session)


const static_path= path.join(__dirname,"../public");
const view_path = path.join(__dirname,"../template");

// set Template Engine         /// here ejs

app.set('view engine', 'ejs');
app.set("views",view_path);
app.use(expressLayout);

app.use(express.static(static_path));

app.use(express.urlencoded({ extended: false}));
app.use(express.json());

// Session Store

const mongoStore =  new MongoDbStore({
    uri: 'mongodb://localhost:27017/pizzamern',
    collection: 'sessions'
})

//Event Emitter

const eventEmitter = new Emitter()
app.set('eventEmitter', eventEmitter)


//Session Config

app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    store: mongoStore,
    saveUninitialized:false,
    cookie: {maxAge: 1000 * 60 * 60 * 24} // 24 hour
}))

//Passport Config

const passportInit = require('../public/js/passport')

passportInit(passport);

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());


//Global Middlewar

app.use((req,res,next) => {
    res.locals.session = req.session;
    res.locals.user = req.user;
    next();
})


// Routing


app.get("/", (req,res)=> {
    res.render("home");
});


app.get("/menu", async (req,res)=> {

        const pizzas = await Menu.find();
        res.render("menu",{pizzas: pizzas});
    });

app.get("/medium", async (req,res)=> {
    const pizzas = await Menu.find();
    res.render("medium",{pizzas: pizzas});
});

app.get("/large", async (req,res)=> {
    const pizzas = await Menu.find();
    res.render("large",{pizzas: pizzas});
});

app.get("/beverages", async (req,res)=> {
    const pizzas = await Menu.find();
    res.render("beverages",{pizzas: pizzas});
});


app.get("/login",guest, (req,res)=> {
    res.render("login");
 }); 


app.post("/login", (req,res, next)=> {
    
    passport.authenticate('local',(err,register,info)=> {
        if(err) {
            req.flash('error',info.message)
            return next(err)
        }
        if(!register) {
            req.flash('error',info.message)
            return res.redirect('/login')
        }

        req.logIn(register,(err) => {
            if(err) {
                req.flash('error',info.message)
                return next(err)
            }

            return res.redirect(req.user.role === 'admin' ? '/adminorders' : '/')
            
        })
    })(req,res,next)

 });  


app.get("/register",guest, (req,res)=> {
    res.render("register");
 }); 

 app.post("/register",async (req,res)=> {

    const {name, email, contact, pass, cpass} = req.body;

    Register.exists({email: email}, (err, result) => {
        if(result) {
            req.flash('error', "Email Already Exists.");
            req.flash('name',name);
            req.flash('contact',contact);
            return res.redirect('/register');
        }
    })

    try{    
        if(pass === cpass) {
            
            const registerUser = new Register({
                name:name,
                email:email,
                contact:contact,
                pass:pass,
                cpass:cpass
            })
            const register = await registerUser.save();
            res.status(201).render("login");
        }
        else {
            req.flash('err', "Please Enter Same Password");
            req.flash('name',name);
            req.flash('contact',contact);
            req.flash('email',email);
            return res.redirect('/register');
        }
    }
    catch (error) {
        res.status(400).send(error).render("register");
    }
 });

app.post("/logout",(req,res)=>{

    req.logout();
    return res.redirect('/login');
})

app.get("/cart", (req,res)=> {
    res.render("cart");
 }); 

app.post("/update-cart",(req,res)=> {

    if(!req.session.cart) {
        req.session.cart = {
            items: {},
            totalQty: 0,
            totalPrice: 0
        }
    }
    let cart = req.session.cart
    if(!cart.items[req.body._id]) {
        cart.items[req.body._id] = {
            item: req.body,
            qty:1
        }
        cart.totalQty = cart.totalQty + 1;
        cart.totalPrice = cart.totalPrice + req.body.price;
    }
    else {
        cart.items[req.body._id].qty = cart.items[req.body._id].qty + 1;
        cart.totalQty = cart.totalQty + 1;
        cart.totalPrice = cart.totalPrice + req.body.price;
    }
    return res.json({ totalQty: req.session.cart.totalQty})
})

app.post("/orders",auth,(req,res)=> {
    
    const {contact,address} = req.body;

    const order = new Order ({
        customerId: req.user._id,
        items: req.session.cart.items,
        contact:contact,
        address:address
    })

    order.save().then(result => {
        Order.populate(result, {path : 'customerId'}, (err, placedOrder)=> {

            req.flash('success','Order Placed Successfully.')
            delete req.session.cart;
            //Emit
            const eventEmitter = req.app.get('eventEmitter')
            eventEmitter.emit('orderPlaced', placedOrder)

            return res.redirect('/orders')
            
        })
        

    }).catch(err => {
        req.flash('error','Something went wrong')
        return res.redirect('/cart')
    })
})

app.get('/orders',auth, async (req,res)=> {
    const orders= await Order.find({customerId:req.user._id},null, {sort: {'createdAt':-1 }})
    res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0')
    return res.render('orders', {orders:orders, moment:moment})
})


app.get('/adminorders',admin, async (req,res)=> {
    Order.find({status : { $ne: 'completed'} },null, {sort: {'createdAt':-1 }}).populate('customerId','-pass').exec((err,orders)=>{
        if(req.xhr) {
            return res.json(orders)
        }
        else {
            return res.render('adminorders',{moment:moment});
        }
    })

})


app.post('/adminorderstatus',admin, (req,res)=> {
    
    Order.updateOne({_id:req.body.orderId}, {status: req.body.status}, (err,data) => {
        if(err) {
            return res.redirect('adminorders')
        }
        //emit event
        const eventEmitter = req.app.get('eventEmitter')
        eventEmitter.emit('orderUpdated', {id:req.body.orderId , status: req.body.status})
        return res.redirect('adminorders')
    })

})

app.get('/orders/:id',auth, async (req,res)=> {

    try {
    const order = await Order.findById(req.params.id)
    if(req.user._id.toString() === order.customerId.toString())
    {
        return res.render('singleOrder', {order: order})
    }
        return res.redirect('/');
    }
    catch(e) {
        console.log(e)
    }

})

app.get("/contact", (req,res)=> {
    res.render("contact");
});

app.post("/contact", async (req,res)=> {
    
    try {    
            const contactdetailuser = new ContactUserInfo(req.body);
            await contactdetailuser.save();
            res.status(201).render("home");
        }
        
    catch (error) {
        res.status(400).send(error);
    }

 });

 //Listening Port

const server = app.listen(PORT,()=> {
    console.log(`Server is Running at ${PORT}`);
})


// Socket

const io = require('socket.io')(server)

io.on('connection', (socket)=> {

    socket.on('join', (orderId) => {
        socket.join(orderId);
    })

})
    eventEmitter.on('orderUpdated', (data) => {    
        
        io.to(`order_${data.id}`).emit('orderUpdated', data)
    })
    
    eventEmitter.on('orderPlaced', (data) => {    
        
        io.to('adminRoom').emit('orderPlaced', data)
    })
    

