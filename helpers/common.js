import { Dimensions } from "react-native";

const { width: deviceWidth, height: deviceHeight } = Dimensions.get("window")

export const hp = percentage => {
    return (percentage * deviceHeight) / 100
}
export const wp = percentage => {
    return (percentage * deviceWidth) / 100
}

/**
 * Navigate to profile preview page
 * @param {Object} router - Expo Router instance
 * @param {string} authId - User's auth ID
 * @param {string} userRole - User's role (principal, teacher, student)
 */
export const navigateToProfilePreview = (router, authId, userRole) => {
  router.push({
    pathname: '/profile-preview',
    params: { authId, userRole }
  });
};