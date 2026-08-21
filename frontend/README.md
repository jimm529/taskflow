# TaskFlow Frontend

React + Vite frontend for the TaskFlow dashboard.

## Setup

```bash
npm install
npm run dev
```

By default the app connects to:

```text
http://localhost:5000
```

To use another backend URL, create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

If your backend runs on another machine or IP, point `VITE_API_URL` to that address.

## Scripts

- `npm run dev` starts the local Vite server
- `npm run build` creates a production build
- `npm run preview` previews the production build
