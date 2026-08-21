## Backend

TaskFlow backend for auth, tasks, validation, and MongoDB persistence.

### Run locally

```bash
cd backend
npm install
npm run dev
```

If PowerShell blocks `npm.ps1`, use the repo launcher from the root:

```bash
.\start-backend.cmd
```

### Environment

Copy `backend/.env.example` to `backend/.env` and set:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=your_mongo_connection_string
JWT_SECRET=your_long_random_secret
```

### Test

```bash
npm test
```
