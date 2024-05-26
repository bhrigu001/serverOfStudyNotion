const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");

//createRating
exports.createRating=async (req,res) =>{
    try{
        //get User Id
        const userId = req.user.id;
        //fetch Data from req body
        const {rating,review,courseId}=req.body;
        //check if user is enrolled or not
        const courseDetails = await Course.findOne(
                                        {_id:courseId,
                                            studentsEnrolled:{$elemMatch:{$eq:userId}},
                                        });
        if(!courseDetails){
            return res.status(404).json({
                success:false,
                message:'Student is not enrolled in the course',
            });
        }                                
        //check if user already reviewed the course
        const alreadyReviewed = await RatingAndReview.findOne({
                                                   user:userId,
                                                   course:courseId,
                                                });
        if(alreadyReviewed){
            return res.status(403).json({
                success:false,
                message:'Course is already reviewed by the user',
            });
        }                                        
        //create rating and reviews
        const ratingReview = await RatingAndReview.create({
                                          rating,review,
                                          course:courseId,
                                          user:userId,
        });
        //update course with this rating and reviews
       const updatedCourseDetails = await Course.findByIdAndUpdate({_id:courseId},
                                        {
                                            $push:{
                                                ratingAndReviews:ratingReview._id,
                                            }
                                        },
                                        {new:true} );
        console.log(updatedCourseDetails);                               
        //return response
        return res.status(200).json({
            success:true,
            message:"Rating and Review created Successfully",
            ratingReview,
        })


    }catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:err.message,
        })

    }
}


//getAverageRating
exports.getAverageRating = async (req,res) =>{
    try{
         //get Course Id
         const courseId = req.body.courseId;
         //calculate avg rating
         const result = await RatingAndReview.aggregate([
            {
                $match:{
                    course:new mongoose.Types.ObjectId(courseId),
                },
            },
                {
                 $group:{
                    _id:null,
                    averageRating:{$avg:"$rating"},
                 }
                }
              
            ])
         //return rating
         if(result.length>0){
            return res.status(200).json({
                success:true,
                averageRating:result[0].averageRating,  //result will return an array of 1 length whose averageRating property will store average rating
            })
         }

         //if no rating/review exist
         return res.status(200).json({
            success:true,
            message:'Average Rating is 0,no ratings given till now',
            averageRating:0,
         })

    }catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:err.message,
        })
    }
}


//getAllRatingsAndReviews

exports.getAllRating = async (req,res) => {
    try{
        const allReviews = await RatingAndReview.find({}).
                                    sort({rating:"desc"})
                                    .populate({
                                        path:"user",
                                        select:"firstName lastName email image"   //this means we want only course name in return of populated query
                                    })
                                    .populate(
                                        {
                                            path:"course",
                                            select:"courseName",
                                        }
                                    )
                                    .exec();

    return res.status(200).json({
        success:true,
        message:"All reviews fetched successfully",
        data:allReviews,
    });
    }catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:err.message,
        })
    }
}



























