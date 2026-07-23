const express = require('express');
const {
  createSubBranch,
  closeBranch,
  createNode,
  updateNodeStatus,
  getNodes
} = require('../controllers/branchController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router({ mergeParams: true });

router.post('/:branchId/sub-branches', protect, createSubBranch);
router.patch('/:branchId/close', protect, closeBranch);
router.post('/:branchId/nodes', protect, createNode);
router.patch('/:branchId/nodes/:nodeId/status', protect, updateNodeStatus);
router.get('/:branchId/nodes', protect, getNodes);

module.exports = router;