const express = require('express');
const multer = require('multer');
const { auth, authorize } = require('../middleware/auth');
const deliveryController = require('../controllers/deliveryController');

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

// Delivery management
router.post('/', auth, authorize('admin', 'operator'), deliveryController.createDelivery);
router.get('/', auth, authorize('admin', 'operator'), deliveryController.getDeliveries);
router.get('/stats', auth, authorize('admin'), deliveryController.getDeliveryStats);
router.get('/track/:trackingNumber', deliveryController.trackDelivery); // Public
router.get('/:id', auth, deliveryController.getDeliveryById);

// Status updates
router.patch(
  '/:id/status',
  auth,
  authorize('admin', 'operator', 'driver'),
  deliveryController.updateDeliveryStatus
);

// Driver assignment
router.patch(
  '/:id/assign-driver',
  auth,
  authorize('admin', 'operator'),
  deliveryController.assignDriver
);

// Proof of delivery
router.post(
  '/:id/proof',
  auth,
  authorize('driver'),
  upload.single('proof'),
  deliveryController.uploadProof
);

// Issues
router.post('/:id/issues', auth, deliveryController.reportIssue);

module.exports = router;