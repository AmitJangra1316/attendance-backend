const modal = require('../models/Attendance');
const Attendance = modal.Attendance;

const model = require('../models/Worker');
const Worker = model.Worker;

const moment = require('moment');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;

exports.fillAttendance = async (req, res) => {
    try {
        const workers = await Worker.find().lean();
        res.json(workers);  // Send workers data as JSON response
    } catch (err) {
        console.error('Error fetching workers:', err);
        res.status(500).json({ error: 'Failed to fetch workers' });
    }
};

exports.submitAttendance = async (req, res) => {
    try {
        const { workerId, date, status, wages, workDone, location } = req.body;
        const attendanceRecord = new Attendance({
            workerId, date, status, wages, workDone, location
        });
        await attendanceRecord.save();
        res.json({ message: 'Attendance record saved successfully' }); // Respond with success
    } catch (err) {
        console.error('Error submitting attendance:', err);
        res.status(500).json({ error: 'Failed to submit attendance' });
    }
};

exports.viewAttendance = async (req, res) => {
    try {
        const attendances = await Attendance.find().populate('workerId').lean();
        res.json(attendances);  // Return attendance data as JSON
    } catch (err) {
        console.error('Error fetching attendance records:', err);
        res.status(500).json({ error: 'Failed to fetch attendance records' });
    }
};

exports.filterAttendance = async (req, res) => {
    const { date, location } = req.query;

    let query = {};
    if (date) {
        const selectedDate = new Date(date);
        query.date = {
            $gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
            $lt: new Date(selectedDate.setHours(23, 59, 59, 999))
        };
    }

    if (location && location !== '') {
        query.location = location;
    }

    try {
        const attendances = await Attendance.find(query).populate('workerId').lean();
        res.json(attendances);  // Send filtered attendance as JSON
    } catch (err) {
        console.error('Error filtering attendance:', err);
        res.status(500).json({ error: 'Failed to filter attendance' });
    }
};

exports.workerAttendanceForMonth = async (req, res) => {
    const { month, year } = req.query;
    const { workerId } = req.params;

    const selectedMonth = parseInt(month) - 1;  
    const selectedYear = parseInt(year);

    try {
        const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
        const attendances = await Attendance.find({
            workerId: workerId,
            date: {
                $gte: new Date(selectedYear, selectedMonth, 1),
                $lte: new Date(selectedYear, selectedMonth + 1, 0),
            }
        }).lean();

        const attendanceMap = {};
        attendances.forEach(attendance => {
            const day = moment(attendance.date).format('DD-MM-YYYY');
            attendanceMap[day] = attendance;
        });

        const attendanceRecords = daysInMonth.map(day => {
            const dayStr = moment(day).format('DD-MM-YYYY');
            const attendanceForDay = attendanceMap[dayStr];

            return attendanceForDay ? {
                workerId: attendanceForDay.workerId,
                date: attendanceForDay.date,
                status: attendanceForDay.status,
                wages: attendanceForDay.wages,
                location: attendanceForDay.location,
                workDone: attendanceForDay.workDone,
            } : {
                workerId,
                date: day,
                status: 'Absent',
                wages: 0,
                location: 'N/A',
                workDone: 'N/A'
            };
        });

        res.json({ attendanceRecords, workerId, month: moment().month(selectedMonth).format('MMMM'), year: selectedYear });
    } catch (err) {
        console.error('Error fetching worker attendance for month:', err);
        res.status(500).json({ error: 'Failed to fetch attendance records' });
    }
};

function getDaysInMonth(year, month) {
    const date = new Date(year, month, 1); 
    const days = [];
    
    while (date.getMonth() === month) {
        days.push(new Date(date)); 
        date.setDate(date.getDate() + 1);
    }

    return days; 
}

exports.downloadAttendanceCsv = async (req, res) => {
    const { workerId } = req.params;
    const { month, year } = req.query;

    try {
        const selectedMonth = parseInt(month) - 1;  
        const selectedYear = parseInt(year);

        const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
        const attendances = await Attendance.find({
            workerId,
            date: {
                $gte: new Date(selectedYear, selectedMonth, 1),
                $lte: new Date(selectedYear, selectedMonth + 1, 0),
            }
        }).lean();

        if (!attendances || attendances.length === 0) {
            return res.status(404).json({ error: 'No attendance records found.' });
        }

        const worker = await Worker.findById(workerId).lean();
        if (!worker) {
            throw new Error('Worker not found');
        }

        const csvData = [];
        let totalWages = 0;
        let totalPresent = 0;
        let totalAbsent = 0;

        daysInMonth.forEach(day => {
            const attendanceRecord = attendances.find(a => moment(a.date).isSame(day, 'day'));

            let status, wages, workDone, location;
            if (attendanceRecord) {
                status = attendanceRecord.status;
                wages = attendanceRecord.wages;
                workDone = attendanceRecord.workDone;
                location = attendanceRecord.location;
                if (status === 'Present') {
                    totalPresent++;
                    totalWages += wages;
                } else if (status === 'Absent') {
                    totalAbsent++;
                }
            } else {
                status = 'Absent';
                wages = 0;
                workDone = 'N/A';
                location = 'N/A';
                totalAbsent++;
            }

            csvData.push({
                Date: moment(day).format('DD-MM-YYYY'),
                Status: status,
                Wages: wages,
                'Work Done': workDone,
                Location: location
            });
        });

        // Include summary row
        csvData.push({
            Date: 'Total',
            Status: `Present: ${totalPresent}, Absent: ${totalAbsent}`,
            Wages: totalWages,
            'Work Done': '',
            Location: ''
        });

        const csvStringifier = createCsvStringifier({
            header: [
                { id: 'Date', title: 'Date' },
                { id: 'Status', title: 'Status' },
                { id: 'Wages', title: 'Wages' },
                { id: 'Work Done', title: 'Work Done' },
                { id: 'Location', title: 'Location' },
            ]
        });

        res.setHeader('Content-Disposition', `attachment; filename=attendance_${worker.name}_${month}_${year}.csv`);
        res.setHeader('Content-Type', 'text/csv');
        
        res.send(csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(csvData));
    } catch (err) {
        console.error('Error generating CSV:', err);
        res.status(500).json({ error: 'Failed to generate CSV' });
    }
};
