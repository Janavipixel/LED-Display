/**
 * SIES GST CSE-IoT LED Display Management System
 * Activity & Audit Routes
 */

const express = require('express');
const { getActivity } = require('../controllers/activityController');

const router = express.Router();

router.get('/', getActivity);

module.exports = router;
