const Course = require("../models/Course");
const Category = require("../models/category");
const User = require("../models/User");
const {uploadImageToCloudinary} = require("../utils/imageUploader");

//Create course handler function
exports.createCourse = async (req,res) =>{
    try{
        //fetch data
        let {courseName,courseDescription,whatYouWillLearn,price,category,tag,status,instructions}=req.body;
        
        //get thumbnail
        const thumbnail = req.files.thumbnailImage;

        //validation
        if(!category || !courseName || !courseDescription || !whatYouWillLearn ||!price ||!tag ||!thumbnail){
            return res.status(400).json({
                success:false,
                message:'All fields are required',
            });
        }
        if (!status || status === undefined) {
			status = "Draft";
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
		const categoryDetails = await Category.findById(category);
		if (!categoryDetails) {
			return res.status(404).json({
				success: false,
				message: "Category Details Not Found",
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
            status: status,
            instructions: instructions,
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
    // Add the new course to the Categories
		await Category.findByIdAndUpdate(
			{ _id: category },
			{
				$push: {
					course: newCourse._id,
				},
			},
			{ new: true }
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