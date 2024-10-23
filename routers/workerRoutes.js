const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');
const attendanceController = require('../controllers/attendanceController');

router.get('/', workerController.getWorkers);

router.post('/add', workerController.addWorker);

router.get('/:workerId/details', workerController.getWorkerDetails);

router.get('/:workerId/monthly-attendance', attendanceController.workerAttendanceForMonth);

router.get('/:workerId/download-csv', attendanceController.downloadAttendanceCsv);

module.exports = router;
