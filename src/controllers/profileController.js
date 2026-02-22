const prisma = require("../config/prisma");

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bio, status } = req.body;

    const updateData = {};
    
    if (bio !== undefined) updateData.bio = bio;
    if (status !== undefined) updateData.status = status;
    
    // Handle avatar upload - Cloudinary returns secure_url
    if (req.files?.avatar) {
      updateData.avatar = req.files.avatar[0].path; // Cloudinary URL
    }
    
    // Handle banner upload - Cloudinary returns secure_url
    if (req.files?.banner) {
      updateData.banner = req.files.banner[0].path; // Cloudinary URL
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        banner: true,
        bio: true,
        status: true,
        createdAt: true,
      },
    });

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        banner: true,
        bio: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};
