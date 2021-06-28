const mongoose = require("mongoose");

    const orderSchema= new mongoose.Schema({
        
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Register',
        required: true
    },
    items: {
        type:Object,
        required: true
    },

    contact: {
        type: Number,
        required:true,
    },
    address: {
        type:String,
        required:true
    },
    paymentType: {
        type:String,
        default: "COD"
    },
    status: {
        type:String,
        default: "Order_Placed"
    }
},{timestamps :true})

const Order = new mongoose.model("Order",orderSchema);
module.exports=Order;