const express = require('express');
const groceryController = require('../modules/grocery/grocery.controller');
const groceryValidator = require('../modules/grocery/grocery.validator');
const { authenticate } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  groceryValidator.createRules(),
  groceryValidator.validate,
  asyncHandler(groceryController.create)
);
router.get('/', asyncHandler(groceryController.listMine));
router.get(
  '/:id',
  groceryValidator.idParam('id'),
  groceryValidator.validate,
  asyncHandler(groceryController.getById)
);
router.patch(
  '/:id',
  groceryValidator.updateRules(),
  groceryValidator.validate,
  asyncHandler(groceryController.update)
);
router.patch(
  '/:id/toggle',
  groceryValidator.toggleRules(),
  groceryValidator.validate,
  asyncHandler(groceryController.toggleChecked)
);
router.delete(
  '/:id',
  groceryValidator.idParam('id'),
  groceryValidator.validate,
  asyncHandler(groceryController.remove)
);

module.exports = router;
