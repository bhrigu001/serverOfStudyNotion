const Course = require("../models/Course");
const Tag = require("../models/category");
const User = require("../models/User");
const {uploadImageToCloudinary} = require("../utils/imageUploader");

//Create course handler function
exports.createCourse = async (req,res) =>{
    try{
        //fetch data
        const {courseName,courseDescription,whatYouWillLearn,price,tag}=req.body;
        
        //get thumbnail
        const thumbnail = req.files.thumbnailImage;

        //validation
        if(!courseName || !courseDescription || !whatYouWillLearn ||!price ||!tag ||!thumbnail){
            return res.status(400).json({
                success:false,
                message:'All fields are required',
            });
        }

        //check for instructor
        const userId = req.user.id;
        const instructorDetails = await User.findById(userId);
        console.log("Instructor Details: ",instructorDetails);
        //todo: verify that userId and instructorDetails._id are same or different

        if(!instructorDetails){
            return res.status(404).json({
                success:false,
                message:'Instructor Details not found',
            });
        }

        //check given tag is valid or not
        const tagDetails = await Tag.findById(tag);
        if(!tagDetails){
            return res.status(404).json({
                success:false,
                message:'Tag Details not found',
            });
        }
        //Upload Image to Cloudinary
        const thumbnailImage = await uploadImageToCloudinary(thumbnail,process.env.FOLDER_NAME);

        //Create an entry for new Course
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor:instructorDetails._id,
            whatYouWillLearn:whatYouWillLearn,
            price,
            tag:tagDetails._id,
            thumbnail:thumbnailImage.secure_url,
        });
        
        // add the new course to the user schema of Instructor
        await User.findByIdAndUpdate(
            {_id:instructorDetails._id},
            {
                $push:{
                    courses:newCourse._id,
                }
            },
            {new:true},
        );

        //return response
        return res.status(200).json({
            success:true,
            message:"Course Created Successfully",
            data:newCourse,
        })

    }catch(err){
       console.log(err);
       return res.status(500).json({
        success:false,
        message:'Failed to create Course',
        error:err.message,
       })
    }
};


//getAll Courses handler function
 
exports.showAllCourses = async (req,res)=>{
    try{
       const allCourses =await Course.find({},{courseName:true,
                                               price:true,
                                               thumbnail:true,
                                               instructor:true,
                                               ratingAndReviews:true,
                                               studentsEnrolled:true, })
                                               .populate("instructor")
                                               .exec();
       return res.status(200).json({
        success:true,
        message:'Data for all courses fetched successfully',
        data:allCourses,
       })
    }catch(err){
      console.log(err);
      return res.status(500).json({
        success:false,
        message:'Cannot Fetch course data',
        error:err.message,
      })
    }
}