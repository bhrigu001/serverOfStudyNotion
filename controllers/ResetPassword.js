const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");

//resetPasswordToken
exports.resetPasswordToken = async (req,res) =>{
   try{
 //get email from req body
 const email = req.body.email;
 //email validation
 const user = await User.findOne({email:email});
 if(!user){
     return res.json({
         sucess:false,
         message:'Your email is not registered with us'
     });
 }
 //generate token
 const token =crypto.randomUUID();  //generating token which will be attached with link of frontend so tha each user gets to new link
 //update user by adding token and expiration time
 const updatedDetails = await User.findOneAndUpdate(
                         {email:email},
                           {
                             token:token,
                             resetPasswordExpires:Date.now()+5*60*1000,
                           },
                           {new:true} ); //to get updated list in return 



//create url
const url =`http://localhost:3000/update-password/${token}`;
//Sending mail containing the url
await mailSender(email,
         "Password Reset Link",
         `Password Reset Link: ${url}`);

//return response
return res.json({
 success:true,
 message:'Email sent successfuly, please check email and change password'
});            

   }catch(err){
      console.log(err);
      return res.status(500).json({
        success:false,
        message:'Something went wrong while sendind reset password and mail'
      })
   }
}   



//resetPassword

exports.resetPassword = async (req,res)=>{
  try{
        //data fetch
        const {password,confirmPassword,token}=req.body;  //token wil be send from frontend
        //validation
        if(password!==confirmPassword){
            return res.json({
                success:false,
                message:'Password not matching',
            });
        }
        //get user details from db using token
        const userDetails = await User.findOne({token:token});
        //if no entry - invalid token
        if(!userDetails){
            return res.json({
                success:false,
                message:'Token is invalid',
            });
        }
        //token time check
        if(userDetails.resetPasswordExpires < Date.now()){
            return res.json({
                success:false,
                message:'Token is expired, please regenerate your token',
            });
        }
        //hasing password
        const hashedPassword = await bcrypt.hash(password,10);
        //update password
        await User.findOneAndUpdate(
            {token:token},
            {password:hashedPassword},
            {new:true},
        )
        //return response 
        return res.status(200).json({
            success:true,
            message:'Password reset successful'
        })

  }catch(err){
    console.log(err);
    return res.status(500).json({
      success:false,
      message:''

  });
}
}