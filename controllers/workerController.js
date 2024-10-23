const model = require('../models/Worker');
const Worker = model.Worker;

const modal = require('../models/Attendance');
const Attendance = modal.Attendance;

exports.getWorkers = async (req, res) => {
  try {
    const workers = await Worker.find().lean();
    res.status(200).json({ workers });  
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workers' });
  }
};

exports.addWorker = async (req, res) => {
  const { name, role, wage } = req.body;
  try {
    const newWorker = new Worker({ name, role, wage });
    await newWorker.save();
    res.status(201).json({ message: 'Worker added successfully' }); 
  } catch (error) {
    res.status(500).json({ error: 'Failed to add worker' });
  }
};

exports.getWorkerDetails = async (req, res) => {
  const { workerId } = req.params;

  try {
    const worker = await Worker.findById(workerId).lean();
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    const attendanceRecords = await Attendance.find({ workerId }).lean();
    const totalWages = attendanceRecords.reduce((sum, record) => sum + record.wages, 0);
    const totalPresent = attendanceRecords.filter(record => record.status === 'Present').length;
    const totalAbsent = attendanceRecords.filter(record => record.status === 'Absent').length;

    res.status(200).json({
      worker,
      totalWages,
      totalPresent,
      totalAbsent,
      attendanceRecords
    });  

  } catch (error) {
    res.status(500).json({ error: 'Error fetching worker details: ' + error.message });
  }
};
