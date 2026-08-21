# Contributing

Thanks for helping improve TaskFlow. Keep changes focused, readable, and easy to review.

## Local Workflow

1. Create a branch for your work.
2. Install dependencies in both `backend` and `frontend`.
3. Add environment variables from `backend/.env.example`.
4. Run the backend tests.
5. Run the frontend build before opening a pull request.

## Commands

Backend:

```bash
cd backend
npm test
```

Frontend:

```bash
cd frontend
npm run build
```

## Code Style

- Keep backend logic separated by route, controller, service, model, and validator.
- Keep React state and API logic readable and avoid debug logs in committed code.
- Use clear names and small functions.
- Do not commit secrets, `.env` files, `node_modules`, or build output.

## Pull Requests

Include:

- A short summary of the change
- Testing steps
- Screenshots for visible UI changes
