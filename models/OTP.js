const mongoose=require("mongoose");
const mailSender = require("../utils/mailSender");

const OTPSchema=new mongoose.Schema({
   email:{
    type:String,
    required:true,
   },
   otp:{
    type:String,
    required:true,
   },
   createdAt:{
    type:Date,
    default:Date.now(),
    expires:5*60,
   },
});

//writing function to send email before export statement and after schema defination
async function sendVerificationEmail(email,otp){
    try{
      const mailResponse = await mailSender(email,"Verification Email from StudyNotion",otp);
      console.log("Email sent Successfully: ",mailResponse);
    }catch(err){
    console.log("Error occured while sending email",err);
    throw err;
    }
}

// To send otp as email just before saving the document
OTPSchema.pre("save",async function(next){
    await sendVerificationEmail(this.email,this.otp);
    next();
})

module.exports=mongoose.model("OTP",OTPSchema);