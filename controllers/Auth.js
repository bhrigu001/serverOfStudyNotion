const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt=require("jsonwebtoken");
const mailSender = require('../utils/mailSender');

//send OTP
exports.sendOTP = async (req,res)=>{
    try{
      //fetch email from request body
      const {email}=req.body;

      //checking if email already exists
      const checkUserPresent = await User.findOne({email});

      if(checkUserPresent){
        return res.status(401).json({
            success:false,
            message:'User already registered'
        })
      }
      //generate otp
      var otp=otpGenerator.generate(6,{
        upperCaseAlphabets:false,
        lowerCaseAlphabets:false,
        specialChars:false,
      });
      console.log("OTP generated: ",otp);

      //checking if otp is unique or not
       let result=await OTP.findOne({otp:otp});
      //bad practice as in Industry we use such otp generators which give unique otp codes only
       while(result){
        otp=otpGenerator(6,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false,            
        });
        result=await OTP.findOne({otp:otp});
       }

       const otpPayload ={email,otp};
       //create an entry for otp
       const otpBody=await OTP.create(otpPayload);
       console.log(otpBody);

       //return response as successful
       res.status(200).json({
        success:true,
        message:'OTP Sent Successfully',
        otp,
       })
    }catch(err){
      console.log(error);
      return res.status(500).json({
        success:false,
        message:err.message,
      })
    }

}

//sign up
exports.signUp = async (req,res)=>{
    try{
    //fetch data from request body
    const {
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        accountType,
        contactNumber,
        otp
    }=req.body;
    //Validation
        // List of required fields
        const requiredFields = [
            'firstName',
            'lastName',
            'email',
            'password',
            'confirmPassword',
            'otp'
        ];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
        return res.status(403).json({
            success: false,
            message: `The following fields are required: ${missingFields.join(', ')}`
        });
    }
    //Match created password and confirm password
    if(password!==confirmPassword){
        return res.status(400).json({
            success:false,
            message:'Password and confirm password values do not match please try again',
        });
    }
    // Check if user already exists
     const existingUser=await User.findOne({email});
     if(existingUser){
        return res.status(400).json({
            succes:false,
            message:'User already registered',
        });
     }
    //find most recent OTP stored for the user
     const recentOtp = await OTP.find({email}).sort({createdAt:-1}).limit(1);
     console.log(recentOtp);
    //validate OTP
    if(recentOtp.length==0){
        //Otp not found
        return res.status(400).json({
            success:false,
            message:'OTP not found',
        })
    }else if(otp!==recentOtp.otp){
        //Invalid Otp entered by user
        return res.status(400).json({
            success:false,
            message:"Invalid OTP",
        });
    }
    //Hash password
    const hashedPassword = await bcrypt.hash(password,10);
    //entry created in DB

    const profileDetails = await Profile.create({
        gender:null,
        dateOfBirth:null,
        about:null,
        contactNumber:null,
    });

    const user=await User.create({
        firstName,
        lastName,
        email,
        contactNumber,
        password:hashedPassword,
        accountType,
        additionalDetails:profileDetails._id,
        image:`https://api.dicebear.com/5.x/initials/svg?seed=${firstname} ${lastName}`,
    })
    //return res
    return res.status(200).json({
        success:true,
        message:'User is registered Successfully',
        user,
    });

   }catch(err){
      console.log(err);
      return res.status(500).json({
        success:false,
        message:"User can't be registered please try again",
      })
   }
}

//Login
exports.login=async(req,res)=>{
    try{
        // get data from req body
        const {email,password}=req.body;
        // validation of data
        if(!email && !password){
            return res.status(403).json({
                success:false,
                message:'All fields are required, please try again',
            })
        }
        // check if user exist or not
        const user = await User.findOne({email}).populate("additionalDetails");
        if(!user){
            return res.status(401).json({
                success:false,
                message:"User is not registered please signup first",
            });
        }
        // generate JWT,after password matching
        if(bcrypt.compare(password,user.password)){
           const payload={
            email:user.email,
            id:user._id,
            accountType:user.accountType,
           }
           const token = jwt.sign(payload,process.env.JWT_SECRET,{
            expiresIn:"2h",
           });
           user.token = token;
           user.password=undefined;

           //create cookie and send response
           const options = {
            expires:new Date(Date.now()+3*24*60*60*1000),
            httpOnly:true,
           }
           res.cookie("token",token,options).status(200).json({
            success:true,
            token,
            user,
            message:'Logged in successfully',
           })
        }else{
            return res.status(401).json({
                success:false,
                message:'Password is incorrect',
            })
        }
        //Create cookie and send response

    }catch(err){
      console.log(err);
      return res.status(500).json({
        success:false,
        message:'Login failure, please try again'
      })
    }
};

//change Password
exports.changePassword = async (req,res)=>{
try{
        //get data from req body i.e; oldPassword ,newPassword,confirmNewPassword
    const {oldPassword,newPassword,confirmNewPassword}=req.body;
    //validation
    if (!oldPassword || !newPassword || !confirmNewPassword) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required'
        });
    }   
    if (newPassword !== confirmNewPassword) {
        return res.status(400).json({
            success: false,
            message: 'New password and confirm password do not match'
        });
    }
    //comapring old password with password saved in db
    const userId = req.user._id; // Or however you get the logged-in user's ID

    // Fetch user from the database
    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    // Verify the old password
    const isMatch = bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
        return res.status(401).json({
            success: false,
            message: 'Old password is incorrect'
        });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 6);

    // Update password in the database
    user.password = hashedPassword;
    await user.save();     
    //send mail - password updated
    const email = user.email;
    const title = 'Password Updated Successfully';
    const body = '<p>Your password has been updated successfully.</p>';
    await mailSender(email, title, body);
    //return response
    res.status(200).json({
        sucess:true,
        message:'Password updated successfuly'
    })

}catch(err){
   console.log(err);
   return res.status(500).json({
    succes:false,
    message:'Server error, please try again'
   });
}
};
