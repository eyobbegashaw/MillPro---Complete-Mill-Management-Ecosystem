const express = require('express');
const multer = require('multer');
const { auth, authorize } = require('../middleware/auth');
const driverController = require('../controllers/driverController');
const deliveryController = require('../controllers/deliveryController');

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

// Driver management routes (admin only)
router.post(
  '/',
  auth,
  authorize('admin'),
  upload.fields([
    { name: 'licenseImage', maxCount: 1 },
    { name: 'vehicleImage', maxCount: 1 },
    { name: 'profilePhoto', maxCount: 1 }
  ]),
  driverController.createDriver
);

router.get('/', auth, authorize('admin', 'operator'), driverController.getDrivers);
router.get('/available', auth, driverController.getAvailableDrivers);
router.get('/stats/:id', auth, driverController.getDriverStats);
router.get('/:id', auth, driverController.getDriverById);

router.put(
  '/:id',
  auth,
  authorize('admin'),
  upload.fields([
    { name: 'licenseImage', maxCount: 1 },
    { name: 'profilePhoto', maxCount: 1 }
  ]),
  driverController.updateDriver
);

// Driver self-service routes
router.put('/location', auth, authorize('driver'), driverController.updateLocation);
router.put('/status', auth, authorize('driver'), driverController.updateStatus);
router.get('/me/deliveries/current', auth, authorize('driver'), driverController.getCurrentDelivery);
router.get('/me/deliveries/history', auth, authorize('driver'), driverController.getDeliveryHistory);
router.post('/toggle-availability', auth, authorize('driver'), driverController.toggleAvailability);

// Delivery assignment
router.post(
  '/:id/assign-delivery',
  auth,
  authorize('admin', 'operator'),
  driverController.assignDelivery
);

// Rating
router.post('/:id/rate', auth, authorize('customer'), driverController.rateDriver);

module.exports = router;