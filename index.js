const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors'); 

const app = express();

mongoose.connect('mongodb+srv://natson:DyUioVaQYpFaFZnE@cluster0.ulmty.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('Database is Running.....!'))
  .catch((err) => console.error('Database is not Running.....!', err));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors());

// Serve static files from the React app's build folder

// app.use(express.static(path.join(__dirname, '')));

const workerRoutes = require('./routers/workerRoutes');
const attendanceRoutes = require('./routers/attendanceRoutes');

app.use('/workers', workerRoutes);
app.use('/attendance', attendanceRoutes);

app.get('/', (req, res)=>{
  res.send('Server is Up and Running.....!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server is Running.....!');
});
