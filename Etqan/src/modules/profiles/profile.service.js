const profileRepository = require('./profile.repository');
const enums = require('../../config/profileEnums');
const { normalizeStoredAssetUrl } = require('../../utils/publicAssetUrl');

const getByUserId = async (userId) => {
  const profile = await profileRepository.findByUserId(userId);
  if (!profile) {
    const err = new Error('Profile not found');
    err.statusCode = 404;
    throw err;
  }
  return profile;
};

const ensureArrayOfStrings = (val) => {
  if (val == null) return null;
  const arr = Array.isArray(val) ? val : [val];
  return arr.every((x) => typeof x === 'string') ? arr : null;
};

const createOrUpdate = async (userId, data, req) => {
  const payload = {};

  if (data.imageUrl !== undefined) {
    const url = data.imageUrl === null || data.imageUrl === '' ? null : String(data.imageUrl).trim();
    payload.imageUrl = url ? normalizeStoredAssetUrl(url, { req }) : null;
  }
  if (data.measurementSystem != null) {
    if (!enums.measurementSystem.includes(data.measurementSystem)) {
      const err = new Error('Invalid measurement system');
      err.statusCode = 400;
      throw err;
    }
    payload.measurementSystem = data.measurementSystem;
  }
  if (data.gender != null) {
    if (!enums.gender.includes(data.gender)) {
      const err = new Error('Invalid gender');
      err.statusCode = 400;
      throw err;
    }
    payload.gender = data.gender;
  }
  if (data.age != null) {
    const age = parseInt(data.age, 10);
    if (isNaN(age) || age < 1 || age > 150) {
      const err = new Error('Invalid age');
      err.statusCode = 400;
      throw err;
    }
    payload.age = age;
  }
  if (data.height != null) {
    const height = parseFloat(data.height);
    if (isNaN(height) || height <= 0) {
      const err = new Error('Invalid height');
      err.statusCode = 400;
      throw err;
    }
    payload.height = height;
  }
  if (data.weight != null) {
    const weight = parseFloat(data.weight);
    if (isNaN(weight) || weight <= 0) {
      const err = new Error('Invalid weight');
      err.statusCode = 400;
      throw err;
    }
    payload.weight = weight;
  }
  if (data.activityLevel != null) {
    if (!enums.activityLevel.includes(data.activityLevel)) {
      const err = new Error('Invalid activity level');
      err.statusCode = 400;
      throw err;
    }
    payload.activityLevel = data.activityLevel;
  }
  if (data.goal != null) {
    if (!enums.goal.includes(data.goal)) {
      const err = new Error('Invalid goal');
      err.statusCode = 400;
      throw err;
    }
    payload.goal = data.goal;
  }
  if (data.targetWeight != null) {
    const targetWeight = parseFloat(data.targetWeight);
    if (isNaN(targetWeight) || targetWeight <= 0) {
      const err = new Error('Invalid target weight');
      err.statusCode = 400;
      throw err;
    }
    payload.targetWeight = targetWeight;
  }
  if (data.dietaryPreferences !== undefined) {
    const arr = ensureArrayOfStrings(data.dietaryPreferences);
    if (arr && arr.every((x) => enums.dietaryPreferences.includes(x))) {
      payload.dietaryPreferences = arr;
    } else if (arr === null || (Array.isArray(data.dietaryPreferences) && data.dietaryPreferences.length === 0)) {
      payload.dietaryPreferences = [];
    } else {
      const err = new Error('Invalid dietary preferences; allowed: ' + enums.dietaryPreferences.join(', '));
      err.statusCode = 400;
      throw err;
    }
  }
  if (data.allergies !== undefined) {
    const arr = ensureArrayOfStrings(data.allergies);
    if (arr === null) {
      const err = new Error('Allergies must be an array of strings');
      err.statusCode = 400;
      throw err;
    }
    const validPresets = new Set(enums.allergyPresets);
    const valid = arr.every((x) => validPresets.has(x) || (typeof x === 'string' && x.startsWith('CUSTOM:')));
    if (!valid) {
      const err = new Error('Invalid allergies; use presets or "CUSTOM: your allergy"');
      err.statusCode = 400;
      throw err;
    }
    payload.allergies = arr;
  }
  if (data.healthConditions !== undefined) {
    const arr = ensureArrayOfStrings(data.healthConditions);
    if (arr && arr.every((x) => enums.healthConditions.includes(x))) {
      payload.healthConditions = arr;
    } else if (arr === null || (Array.isArray(data.healthConditions) && data.healthConditions.length === 0)) {
      payload.healthConditions = [];
    } else {
      const err = new Error('Invalid health conditions; allowed: ' + enums.healthConditions.join(', '));
      err.statusCode = 400;
      throw err;
    }
  }
  if (data.notificationsEnabled !== undefined) payload.notificationsEnabled = !!data.notificationsEnabled;
  if (data.darkMode !== undefined) payload.darkMode = !!data.darkMode;
  if (data.language !== undefined) payload.language = String(data.language).trim().slice(0, 10) || null;
  return profileRepository.update(userId, payload);
};

module.exports = { getByUserId, createOrUpdate };
