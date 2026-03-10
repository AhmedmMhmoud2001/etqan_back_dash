/**
 * Allowed values for profile fields (matches onboarding UI).
 * Use for validation and API docs.
 */
module.exports = {
  measurementSystem: ['METRIC', 'IMPERIAL'],
  gender: ['MALE', 'FEMALE', 'OTHER'],
  activityLevel: ['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE'],
  goal: ['LOSE_WEIGHT', 'MAINTAIN', 'BUILD_MUSCLE'],
  dietaryPreferences: [
    'BALANCED',
    'LOW_CARB',
    'HIGH_PROTEIN',
    'KETO',
    'VEGAN',
    'VEGETARIAN',
    'PALEO',
    'MEDITERRANEAN',
  ],
  allergyPresets: [
    'DAIRY',
    'EGGS',
    'PEANUTS',
    'SOY',
    'WHEAT',
    'TREE_NUTS',
    'FISH',
    'SHELLFISH',
  ],
  healthConditions: [
    'DIABETES',
    'HIGH_BLOOD_PRESSURE',
    'HIGH_CHOLESTEROL',
    'PCOS',
    'THYROID_ISSUES',
    'HEART_DISEASE',
  ],
};
