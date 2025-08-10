require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const cron = require('node-cron');

const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const ReminderService = require('./services/reminderService');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// attach io to app for controllers to use
app.set('io', io);

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
  // join role-specific rooms (client should emit joinRole with role)
  socket.on('joinRole', (role) => {
    socket.join(role + '-room');
  });
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Mongo connected');
    server.listen(PORT, () => console.log(`Server running on ${PORT}`));

    // Start reminder cron job that runs each minute
    cron.schedule('* * * * *', async () => {
      try {
        await ReminderService.processReminders(io);
      } catch (err) {
        console.error('Reminder job error', err);
      }
    });
  })
  .catch(err => console.error(err));
