# 🏥 QueueManagement - Hospital Appointment Booking System

A modern, real-time hospital appointment booking system built with React, Node.js, and MongoDB.

## 🚀 Features

- **Patient Management**: OTP-based phone verification, appointment booking
- **Doctor Dashboard**: Real-time appointment management and queue updates
- **Real-time Updates**: WebSocket-powered live status tracking
- **Modern UI**: Beautiful dark theme with Azure Depths aesthetic
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Secure Authentication**: JWT-based authentication with OTP verification

## 🛠️ Tech Stack

### Frontend
- **React 19** with Vite
- **Tailwind CSS** for styling
- **shadcn/ui** for components
- **Socket.IO Client** for real-time updates
- **React Router** for navigation
- **React Hook Form** for form handling
- **Axios** for API calls

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **Socket.IO** for WebSocket connections
- **JWT** for authentication
- **Twilio** for SMS OTP (optional)
- **Helmet** for security
- **Rate Limiting** for API protection

## 📁 Project Structure

```
QueueManagemnt/
├── backend/                    # Backend server (Node.js + Express)
│   ├── config/                # Configuration files
│   │   ├── config.js         # Centralized configuration
│   │   └── database.js       # MongoDB connection
│   ├── controllers/          # Route handlers
│   ├── models/               # Mongoose schemas
│   ├── routes/               # API routes
│   ├── services/             # Business logic (OTP, etc.)
│   ├── utils/                # Helper functions
│   ├── app.js                # Express app setup
│   ├── server.js             # Server startup
│   └── .env                  # Environment variables
├── src/                      # Frontend (React + Vite)
│   ├── components/           # Reusable components
│   ├── context/              # React contexts
│   ├── pages/                # Page components
│   ├── services/             # API services
│   └── App.jsx               # Main app component
├── package.json              # Frontend dependencies
└── README.md                 # This file
```

## ⚙️ Configuration

### Backend Environment Variables (.env)
```bash
# Server Configuration
PORT=5001
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Twilio Configuration (Optional)
TWILIO_ACCOUNT_SID=AC... (must start with AC)
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
FRONTEND_API_BASE=http://localhost:5001/api
```

## 🚀 Quick Start

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd QueueManagemnt

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

### 2. Configure Environment
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Development Servers
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001/api
- **Health Check**: http://localhost:5001/health

## 📱 Usage Flow

### Patient Flow
1. **Landing Page**: Enter name and phone number
2. **OTP Verification**: Receive and verify SMS OTP
3. **Profile Completion**: Enter age and gender
4. **Appointment Booking**: Select doctor, date, and time slot
5. **Live Tracking**: Monitor appointment status in real-time

### Doctor Flow
1. **Dashboard Access**: View all appointments
2. **Queue Management**: Update patient statuses
3. **Real-time Updates**: See live queue changes
4. **Statistics**: View daily appointment metrics

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone number
- `POST /api/auth/verify-otp` - Verify OTP and complete registration
- `GET /api/auth/profile` - Get patient profile

### Appointments
- `POST /api/appointments/book` - Book new appointment
- `GET /api/appointments/my-appointments` - Get patient appointments
- `PATCH /api/appointments/:id/cancel` - Cancel appointment

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get specific doctor

### Time Slots
- `GET /api/slots/available` - Get available time slots

## 🎨 Design System

### Color Palette
- **Primary**: Azure Depths (dark blue gradient)
- **Background**: Deep black to navy blue
- **Accents**: Blue-400, Red-400
- **Text**: White, Blue-200, Gray-400

### Components
- **Cards**: Glass-morphism with backdrop blur
- **Buttons**: Gradient backgrounds with hover effects
- **Forms**: Dark inputs with blue focus states
- **Animations**: Smooth transitions and loading states

## 🔒 Security Features

- **CORS Protection**: Configurable origin restrictions
- **Rate Limiting**: API request throttling
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Server-side data validation
- **Helmet Security**: HTTP security headers

## 🌐 Real-time Features

- **WebSocket Connections**: Live status updates
- **Room-based Communication**: Patient and doctor specific updates
- **Queue Management**: Real-time queue position updates
- **Status Broadcasting**: Instant appointment status changes

## 🚀 Deployment

### Backend Deployment
```bash
cd backend
npm run build
npm start
```

### Frontend Deployment
```bash
npm run build
# Deploy dist/ folder to your hosting service
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

---

**Built with ❤️ for modern healthcare management**
