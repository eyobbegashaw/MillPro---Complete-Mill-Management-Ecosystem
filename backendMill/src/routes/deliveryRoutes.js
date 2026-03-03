const express = require('express');
const multer = require('multer');
const { protect, authorize } = require('../middleware/auth');
const deliveryController = require('../controllers/deliveryController');

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

// Delivery management
router.post('/', protect, authorize('admin', 'operator'), deliveryController.createDelivery);
router.get('/', protect, authorize('admin', 'operator'), deliveryController.getDeliveries);
router.get('/stats', protect, authorize('admin'), deliveryController.getDeliveryStats);
router.get('/track/:trackingNumber', deliveryController.trackDelivery); // Public
router.get('/:id', protect, deliveryController.getDeliveryById);

// Status updates
router.patch(
  '/:id/status',
  protect,
  authorize('admin', 'operator', 'driver'),
  deliveryController.updateDeliveryStatus
);

// Driver assignment
router.patch(
  '/:id/assign-driver',
  protect,
  authorize('admin', 'operator'),
  deliveryController.assignDriver
);

// Proof of delivery
router.post(
  '/:id/proof',
  protect,
  authorize('driver'),
  upload.single('proof'),
  deliveryController.uploadProof
);

// Issues
router.post('/:id/issues', protect, deliveryController.reportIssue);

module.exports = router;