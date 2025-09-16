# microBazaar - Authentication Microservice

This is the authentication microservice for the microservices project. It handles user registration, login, and authentication.

## Features

- User registration
- User login with JWT-based authentication
- User logout
- Get current user details
- Input validation

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- Redis for token blacklisting
- JWT for authentication
- bcryptjs for password hashing
- Jest for testing

## Getting Started

### Prerequisites

- Node.js installed
- MongoDB instance running
- Redis instance running

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add the following environment variables:
   ```
   MONGO_URI=<your_mongodb_uri>
   REDIS_URI=<your_redis_uri>
   JWT_SECRET=<your_jwt_secret>
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints

| Method | Endpoint         | Description          |
| ------ | ---------------- | -------------------- |
| POST   | /api/auth/register | Register a new user and returns a JWT token in a cookie. |
| POST   | /api/auth/login    | Login a user and returns a JWT token in a cookie.         |
| POST   | /api/auth/logout   | Logout a user and blacklists the token. |
| GET    | /api/auth/me       | Get current user details |

## Running Tests

To run the tests, use the following command:

```bash
npm test
```

## Future Scope

This is an evolving project. Future updates will include:

- Integration with other microservices like cart, store, and AI bot.
- Deployment to AWS with a proper CI/CD pipeline.
- More features and enhancements.
