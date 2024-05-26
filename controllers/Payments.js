const {instance} = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const {courseEnrollmentEmail} = require("../mail/templates/courseEnrollmentEmail");


//capture the payment and initiate the Razorpay order
exports.capturePayment = async (req,res) =>{
    //get courseId and UserId
    const {course_id} = req.body;
    const userId = req.user.id;
    //validation
    //valid courseId
    if(!course_id){
        return res.json({
            success:false,
            message:'Please provide valid course ID',
        })
    };
    //valid courseDetail
    let course;
    try{
        course = await Course.findById(course_id);
        if(!course){
            return res.json({
                success:false,
                message:'Could not find the course',
            });
        }
    //check if user already paid for the same course
    const uid = new mongoose.Types.ObjectId(userId);
    if(course.studentsEnrolled.includes(uid)){
        return res.status(400).json({
            success:false,
            message:'Student is already enrolled',
        })
    }
    }catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:err.message,
        });

    };

    //order create
    const amount = course.price;
    const currency = "INR";

    const options = {
        amount:amount*100,
        currency,
        receipt:Math.random(Date.now()).toString(),
        notes:{       //it is not mandatory field but we are storing it as we'll need course Id and userId int future
            courseId:course_id,
            userId,
        }
    };

   try{
    //initiate the payment using razorpay
    const paymentResponse = await instance.orders.create(options);
    console.log(paymentResponse);
    //return response
    return response.status(200).json({
        success:true,
        courseName:course.courseName,
        courseDescription:course.courseDescription,
        thumbnail:course.thumbnail,
        orderId:paymentResponse.id,
        currency:paymentResponse.currency,
        amount:paymentResponse.amount,
    });
   }catch(err){
      console.log(err);
      res.json({
        success:false,
        message:"Could not initiate order",
      });
   }
    //return response
}


//verify signature of Razorpay and Server

exports.verifySignature = async (req,res) =>{
    const webhookSecret = "123456";

    const signature = req.headers("x-razorpay-signature");

    const shasum = crypto.createHmac("sha256",webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if(signature===digest){
        console.log("Payment is authorized");
        const {courseId,userId} = req.body.payload.payment.entity.notes;

        try{
           //fulfill the action
           //find the course and enroll students in it
           const enrolledCourse = await Course.findOneAndUpdate(
                                           {_id:courseId},
                                            {
                                                $push:{
                                                    studentsEnrolled:userId
                                                }
                                            },
                                            {new:true},
           );
           if(!enrolledCourse){
            return res.status(500).json({
                success:false,
                message:'Course not found',
            });
           }
           console.log(enrolledCourse);

           //find the student and add the course to their enrolled cours
           const enrolledStudent = await User.findOneAndUpdate(
                                            {_id:userId},
                                            {$push:{courses:courseId}},
                                                {new:true},
           );
           console.log((enrolledStudent));

           //sending confirmation mail
           const emailResponse = await mailSender(
                                  enrolledStudent.email,
                                  "Congratulatiions from StudyNotion",
                                  "Congratulations, you are onboard into new StudyNotion Course",
           );

           console.log(emailResponse);
           return res.status(200).json({
            success:true,
            message:"Signature Verified and Course Added",
           });
        }catch(err){
          console.log(err);
          return res.status(500).json({
            success:false,
            message:err.message,
          })
        }
    }
    else{
        return res.status(400).json({
            success:false,
            message:'Invalid request',
        })
    }
};













