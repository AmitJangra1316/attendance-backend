const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController'); 

router.get('/fill', attendanceController.fillAttendance);

router.post('/fill', attendanceController.submitAttendance);

router.get('/view', attendanceController.viewAttendance);
 
router.get('/filter', attendanceController.filterAttendance);

module.exports = router;
