# DevConnect Lite Backend

A Node.js/Express backend for DevConnect Lite, a platform connecting project owners and developers for project collaboration, bidding, and management.

## Features
- User and Developer authentication (JWT-based)
- Project creation, management, and export
- Bidding system for developers
- Role-based access control
- MongoDB Atlas integration
- RESTful API endpoints

## Bonus Features
- **GET /projects/:id/bids**: Fetch all bids for a given project with RESTful endpoint design
- **Role-based Access Control**: Users can't place bids; developers can't post projects
- **Export Projects to JSON**: Export all projects to a .json file for backup and analysis

## Prerequisites
- [Node.js](https://nodejs.org/) (v18 or v20 recommended)
- [npm](https://www.npmjs.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (or local MongoDB)

## Getting Started

### 1. Clone the repository
```bash
git clone <repo-url>
cd DevConnect-Lite/DevConnect-Lite-Backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create a `.env` file
Create a `.env` file in the root of `DevConnect-Lite-Backend` with the following content:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
MONGODB_URI=your_mongodb_connection_string
```
- Replace `your_jwt_secret_here` and `your_mongodb_connection_string` with your own values.

### 4. Start the server
```bash
node app.js
```

The server will run on `http://localhost:5000` by default.

## API Endpoints

### Authentication
- `POST   /auth/signup/user` — Register as a user
- `POST   /auth/signup/developer` — Register as a developer
- `POST   /auth/login` — Login (returns JWT)
- `GET    /auth/profile` — Get current user profile (requires JWT)

### Projects
- `POST   /projects/create` — Create a new project (User only)
- `GET    /projects/open` — List open projects (Developer only)
- `GET    /projects/:id` — Get project by ID
- `GET    /projects/my-projects` — List your projects
- `PUT    /projects/:id` — Update a project
- `DELETE /projects/:id` — Delete a project
- `GET    /projects/:id/bids` — List all bids for a project (Project owner only)
- `GET    /projects/export-json` — Export your projects to JSON (User only)

### Bids
- `POST   /bids/place` — Place a bid (Developer only)
- `GET    /bids/project/:projectId` — List bids for a project (Project owner only)
- `GET    /bids/my-bids` — List your bids (Developer only)
- `PUT    /bids/:bidId/accept` — Accept a bid (Project owner only)
- `PUT    /bids/:bidId/reject` — Reject a bid (Project owner only)
- `PUT    /bids/:bidId/withdraw` — Withdraw a bid (Developer only)

### Health Check
- `GET    /health` — API health status

## Environment Variables
- `PORT` — Port to run the server (default: 5000)
- `NODE_ENV` — Environment (development/production)
- `JWT_SECRET` — Secret for JWT signing
- `MONGODB_URI` — MongoDB connection string

## Project Structure
- `app.js` — Main server file
- `config/` — Database config
- `controllers/` — Route logic
- `middleware/` — Auth and role middleware
- `models/` — Mongoose models
- `routes/` — API route definitions

## Notes
- All protected routes require a valid JWT in the `Authorization: Bearer <token>` header.
- Use tools like [Postman](https://www.postman.com/) to test endpoints.
- For developer registration, provide additional fields like `skills`.
- For project creation, see the Project model for required fields.
