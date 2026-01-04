# PulseGen - Video Upload, Sensitivity Processing, and Streaming Application

A comprehensive full-stack application that enables users to upload videos, processes them for content sensitivity analysis, and provides seamless video streaming capabilities with real-time progress tracking.

## 🚀 Features

- **Video Upload**: Drag-and-drop video uploads with progress tracking
- **Sensitivity Analysis**: Automated content screening and classification (safe/flagged)
- **Real-Time Updates**: Live processing progress via Socket.io
- **Video Streaming**: HTTP range request support for seamless playback
- **Multi-Tenant Architecture**: User isolation with role-based access control
- **Neo-Brutalist UI**: Bold, modern design with Tailwind CSS

## 🛠️ Tech Stack

### Backend

- Node.js + Express.js
- MongoDB + Mongoose
- Socket.io (real-time)
- JWT Authentication
- Multer (file uploads)
- FFmpeg (video processing)

### Frontend

- React 19 + Vite
- React Router v6
- Tailwind CSS (neo-brutalist theme)
- Socket.io Client
- Axios
- Lucide React Icons

## 📁 Project Structure

```
Assignment PulseGen/
├── backend/
│   ├── config/           # Database configuration
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Auth & error handling
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── uploads/          # Video storage
│   ├── server.js         # Entry point
│   └── .env              # Environment variables
│
└── clientside/
    ├── src/
    │   ├── components/   # Reusable UI components
    │   ├── context/      # React contexts
    │   ├── pages/        # Page components
    │   ├── services/     # API & socket services
    │   ├── App.jsx       # Main app with routing
    │   └── index.css     # Tailwind + brutal styles
    └── .env              # Environment variables
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- FFmpeg (optional, for metadata extraction)

### Backend Setup

1. Navigate to backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:

   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/pulsegen_videos
   JWT_SECRET=your_secret_key_here
   JWT_EXPIRE=7d
   MAX_FILE_SIZE=524288000
   CLIENT_URL=http://localhost:5173
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to frontend directory:

   ```bash
   cd clientside
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open http://localhost:5173 in your browser

## 📡 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Videos

- `POST /api/videos/upload` - Upload video (multipart/form-data)
- `GET /api/videos` - List videos with filters
- `GET /api/videos/:id` - Get video details
- `GET /api/videos/stream/:id` - Stream video (supports range requests)
- `PUT /api/videos/:id` - Update video metadata
- `DELETE /api/videos/:id` - Delete video
- `POST /api/videos/:id/reprocess` - Retry sensitivity analysis

### Admin

- `GET /api/admin/stats` - System statistics
- `GET /api/admin/users` - List users
- `PATCH /api/admin/users/:id/role` - Update user role
- `PATCH /api/admin/users/:id/status` - Toggle user status

## 👥 User Roles

| Role       | Permissions                     |
| ---------- | ------------------------------- |
| **Viewer** | View assigned videos only       |
| **Editor** | Upload, edit, delete own videos |
| **Admin**  | Full access + user management   |


## 🔍 Sensitivity Analysis

The simulated analysis pipeline:

1. **File Validation** (0-20%) - Check file integrity
2. **Metadata Extraction** (20-40%) - Extract duration, resolution
3. **Content Analysis** (40-80%) - Simulated frame analysis
4. **Report Generation** (80-100%) - Classification result

**Flagging Logic** (demo-friendly):

- Filename contains keywords: violence, explicit, nsfw, etc.
- Random 10% flagging for variety
- Large files (>100MB) have higher flag chance

## 📝 License

MIT License
