# TaskFlow

TaskFlow is a MERN task management application with user authentication, private task lists, task filtering, priorities, due dates, and a responsive dashboard UI.

## Features

- Register and sign in with JWT authentication
- Create, edit, delete, filter, and search tasks
- Track task status, priority, and due dates
- User-specific task ownership
- Health-check endpoint for backend verification
- Responsive React dashboard with production-ready styling

## Tech Stack

Frontend:
- React
- Vite
- CSS

Backend:
- Node.js
- Express
- MongoDB
- Mongoose
- JSON Web Tokens
- bcryptjs

## Project Structure

```text
TaskFlow/
|-- backend/
|   |-- src/
|   |   |-- controllers/
|   |   |-- database/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- services/
|   |   `-- validators/
|   |-- tests/
|   |-- .env.example
|   `-- package.json
|-- frontend/
|   |-- src/
|   |-- public/
|   `-- package.json
|-- CONTRIBUTING.md
|-- LICENSE
`-- README.md
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- MongoDB Atlas connection string or local MongoDB URI

### Backend Setup

```bash
cd backend
npm install
copy .env.example .env
npm start
```

On Windows PowerShell, if `npm run dev` is blocked by script policy, run the root launcher instead:

```bash
.\start-backend.cmd
```

Update `backend/.env` with your own values:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
```

The backend runs at:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/v1/health
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

## Scripts

Backend:

```bash
npm start
npm run dev
npm test
```

Frontend:

```bash
npm run dev
npm run build
npm run preview
```

## API Routes

Auth:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Tasks:
- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/:id`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`

Health:
- `GET /api/v1/health`

## Notes

- Do not commit `.env` files or secret files.
- The frontend uses `VITE_API_URL` when provided, otherwise it defaults to `http://localhost:5000`.
- The backend allows origins from `CLIENT_URL`; separate multiple origins with commas.
- For Windows PowerShell, prefer `start-backend.cmd` if `npm run dev` is blocked by execution policy.
