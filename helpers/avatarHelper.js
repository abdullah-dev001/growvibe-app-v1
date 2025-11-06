// Helper function to get avatar source based on gender and role
export const getAvatarSource = (userImage, gender, role) => {
  // Remote URL support
  if (typeof userImage === 'string' && (/^https?:\/\//i).test(userImage)) {
    return { uri: userImage };
  }

  // If specific user image is provided, use it
  if (userImage === "admin.jpg") {
    return require("../assets/avatarImages/admin.jpg");
  } else if (userImage === "boyAvatar1.png") {
    return require("../assets/avatarImages/boyAvatar1.png");
  } else if (userImage === "boyAvatar2.png") {
    return require("../assets/avatarImages/boyAvatar2.png");
  } else if (userImage === "boyAvatar3.png") {
    return require("../assets/avatarImages/boyAvatar3.png");
  } else if (userImage === "boyAvatar4.png") {
    return require("../assets/avatarImages/boyAvatar4.png");
  } else if (userImage === "boyAvatar5.png") {
    return require("../assets/avatarImages/boyAvatar5.png");
  } else if (userImage === "boyAvatar6.png") {
    return require("../assets/avatarImages/boyAvatar6.png");
  } else if (userImage === "boyAvatar7.png") {
    return require("../assets/avatarImages/boyAvatar7.png");
  } else if (userImage === "girlAvatar1.png") {
    return require("../assets/avatarImages/girlAvatar1.png");
  } else if (userImage === "girlAvatar2.png") {
    return require("../assets/avatarImages/girlAvatar2.png");
  } else if (userImage === "girlAvatar3.png") {
    return require("../assets/avatarImages/girlAvatar3.png");
  } else if (userImage === "girlAvatar4.png") {
    return require("../assets/avatarImages/girlAvatar4.png");
  } else if (userImage === "girlAvatar5.png") {
    return require("../assets/avatarImages/girlAvatar5.png");
  } else if (userImage === "girlAvatar6.png") {
    return require("../assets/avatarImages/girlAvatar6.png");
  } else if (userImage === "girlAvatar7.png") {
    return require("../assets/avatarImages/girlAvatar7.png");
  }
  
  // Default fallback based on role and gender
  if (role === 'admin') {
    return require("../assets/avatarImages/admin.jpg");
  } else if (gender === 'male') {
    return require("../assets/avatarImages/boyDefaultAvatar.png");
  } else if (gender === 'female') {
    return require("../assets/avatarImages/girlDefaultAvatar.png");
  }
  
  // Ultimate fallback
  return require("../assets/avatarImages/boyDefaultAvatar.png");
};
