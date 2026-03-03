const express = require('express');
const multer = require('multer');
const { protect, authorize } = require('../middleware/auth');
const driverController = require('../controllers/driverController');
const deliveryController = require('../controllers/deliveryController');

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

// Driver management routes (admin only)
router.post(
  '/',
  protect,
  authorize('admin'),
  upload.fields([
    { name: 'licenseImage', maxCount: 1 },
    { name: 'vehicleImage', maxCount: 1 },
    { name: 'profilePhoto', maxCount: 1 }
  ]),
  driverController.createDriver
);

router.get('/', protect, authorize('admin', 'operator'), driverController.getDrivers);
router.get('/available', protect, driverController.getAvailableDrivers);
router.get('/stats/:id', protect, driverController.getDriverStats);
router.get('/:id', protect, driverController.getDriverById);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  upload.fields([
    { name: 'licenseImage', maxCount: 1 },
    { name: 'profilePhoto', maxCount: 1 }
  ]),
  driverController.updateDriver
);

// Driver self-service routes
router.put('/location', protect, authorize('driver'), driverController.updateLocation);
router.put('/status', protect, authorize('driver'), driverController.updateStatus);
router.get('/me/deliveries/current', protect, authorize('driver'), driverController.getCurrentDelivery);
router.get('/me/deliveries/history', protect, authorize('driver'), driverController.getDeliveryHistory);
router.post('/toggle-availability', protect, authorize('driver'), driverController.toggleAvailability);

// Delivery assignment
router.post(
  '/:id/assign-delivery',
  protect,
  authorize('admin', 'operator'),
  driverController.assignDelivery
);

// Rating
router.post('/:id/rate', protect, authorize('customer'), driverController.rateDriver);

module.exports = router;