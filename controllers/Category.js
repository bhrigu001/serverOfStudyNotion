const Category = require("../models/category");

//create category handler function

exports.createCategory = async (req,res)=>{
    try{
      //fetch data
      const {name,description}=req.body;
      //validation
      if(!name || !description){
        return res.status(400).json({
            success:false,
            message:"All fields are required",
        })
      }
      //Create entry in DB
      const categoryDetails = await Category.create({
        name:name,
        description:description,
      });
      console.log(categoryDetails);
      //return response
      return res.status(200).json({
        succes:true,
        message:"Category Created Successfully"
      })
    }catch(err){
      return res.status(500).json({
        success:false,
        message:err.message,
      });
    }
}

//getAll Category handler

exports.showAllCategories = async (req,res)=>{
    try{
       const allCategories = await Category.find({},{name:true, description:true});  //find all category and categories must have name and description
       res.status(200).json({
        success:true,
        message:'All categories retrieved succesfully'
       })
    }catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:err.message,
            allCategories,
        })

    }
 
}


