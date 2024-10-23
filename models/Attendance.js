const mongoose = require('mongoose');
const { Schema } = mongoose;

const attendanceSchema = new mongoose.Schema({
  workerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Worker', 
    required: true 
  },
  
  date: {
    type: Date,
    required: true,
    default: Date.now
},

  status: { 
    type: String, 
    enum: ['Present', 'Absent', 'Leave'], 
    required: true 
  },
  
  wages: { 
    type: Number, 
    required: true 
  },

  workDone: { 
    type: String 
  },

  location: { 
    type: String 
  }
});

exports.Attendance = mongoose.model('Attendance', attendanceSchema);

