const mongoose=require("mongoose");

const userSchema=new mongoose.Schema({
    firstName: {
        type:String,
        required:true,
        trim:true,
    },
    lastName:{
        type:String,
        require:true,
        trim:true,
    },
    email:{
        type:String,
        require:true,
        trim:true,
    },
    password:{
        type:String,
        require:true,
    },
    accountType:{
        type:String,
        enum:["Admin","Student","Instructor"],
        require:true,
    },
    active: {
        type: Boolean,
        default: true,
    },
    approved: {
        type: Boolean,
        default: true,
    },
    additionalDetails:{
        type:mongoose.Schema.Types.ObjectId,
        require:true,
        ref:"Profile",
    },
    courses:[
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Course",
    }
    ],
    image:{
        type:String,
        required:true,
    },
    token:{
        type:String,
        required:true,
    },
    resetPasswordExpires:{
        type:Date,
    },
    courseProgress:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"CourseProgress",
        }
    ],
},
// Add timestamps for when the document is created and last modified
{ timestamps: true }

);

module.exports=mongoose.model("User",userSchema);