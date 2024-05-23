// Import necessary modules
const Section = require("../models/Section");
const SubSection = require("../models/Subsection");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

// Create a new sub-section for a given section
exports.createSubSection = async (req, res) => {
	try {
		// Extract necessary information from the request body
		const { sectionId, title, timeDuration, description } = req.body;
		const video = req.files.videoFile;

		// Check if all necessary fields are provided
		if (!sectionId || !title || !timeDuration || !description || !video) {
			return res
				.status(404)
				.json({ success: false, message: "All Fields are Required" });
		}

		// Upload the video file to Cloudinary
		const uploadDetails = await uploadImageToCloudinary(
			video,
			process.env.FOLDER_NAME
		);

		// Create a new sub-section with the necessary information
		const SubSectionDetails = await SubSection.create({
			title: title,
			timeDuration: timeDuration,
			description: description,
			videoUrl: uploadDetails.secure_url,
		});

		// Update the corresponding section with the newly created sub-section
		const updatedSection = await Section.findByIdAndUpdate(
			{ _id: sectionId },
			{ $push: { subSection: SubSectionDetails._id } },
			{ new: true }
		).populate("subSection");

		// Return the updated section in the response
		return res.status(200).json({ success: true, data: updatedSection });
	} catch (error) {
		// Handle any errors that may occur during the process
		console.error("Error creating new sub-section:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message,
		});
	}
};


//updateSubSection
// Update an existing sub-section
exports.updateSubSection = async (req, res) => {
	try {
		// Extract necessary information from the request body
		const { subSectionId, title, timeDuration, description } = req.body;

		// Check if all necessary fields are provided
		if (!subSectionId || !title || !timeDuration || !description) {
			return res
				.status(404)
				.json({ success: false, message: "All Fields are Required" });
		}

		// Find and update the sub-section with the new information
		const updatedSubSection = await SubSection.findByIdAndUpdate(
			subSectionId,
			{ title, timeDuration, description },
			{ new: true }
		);

		if (!updatedSubSection) {
			return res.status(404).json({
				success: false,
				message: "Sub-section not found",
			});
		}

		// Return the updated sub-section in the response
		return res.status(200).json({ success: true, data: updatedSubSection });
	} catch (error) {
		// Handle any errors that may occur during the process
		console.error("Error updating sub-section:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message,
		});
	}
};

//deleteSubSection
exports.deleteSubSection = async (req, res) => {
	try {
		// Extract necessary information from the request body
		const { subSectionId, sectionId } = req.body;

		// Check if all necessary fields are provided
		if (!subSectionId || !sectionId) {
			return res
				.status(404)
				.json({ success: false, message: "All Fields are Required" });
		}

		// Find and delete the sub-section
		const deletedSubSection = await SubSection.findByIdAndDelete(subSectionId);

		if (!deletedSubSection) {
			return res.status(404).json({
				success: false,
				message: "Sub-section not found",
			});
		}

		// Update the corresponding section to remove the deleted sub-section
		const updatedSection = await Section.findByIdAndUpdate(
			{ _id: sectionId },
			{ $pull: { subSection: subSectionId } },
			{ new: true }
		).populate("subSection");

		// Return the updated section in the response
		return res.status(200).json({ success: true, data: updatedSection });
	} catch (error) {
		// Handle any errors that may occur during the process
		console.error("Error deleting sub-section:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message,
		});
	}
};