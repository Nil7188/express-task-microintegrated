const db = require("../config/db");

exports.validateUser = async (req, res) => {
  try {
    const { full_name, email, mobile, status } = req.body;

    // Mandatory Fields
    if (!full_name || !email || !mobile || !status) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    // Mobile Validation
    const mobileRegex = /^[0-9]{10}$/;

    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must be exactly 10 digits"
      });
    }

    // Status Validation
    if (status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "User status must be Active"
      });
    }

    // Duplicate Email Check
    const [emailExists] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (emailExists.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already exists"
      });
    }

    // Duplicate Mobile Check
    const [mobileExists] = await db.query(
      "SELECT * FROM users WHERE mobile = ?",
      [mobile]
    );

    if (mobileExists.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Mobile already exists"
      });
    }

    return res.status(200).json({
      success: true,
      message: "User validation successful"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};