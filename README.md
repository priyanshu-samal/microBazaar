# microBazaar

A microservices-based e-commerce application.

## Architecture

This project follows a microservices architecture, with different services for different functionalities. Each service is a separate Node.js application.

## Services

### Auth Service

- **Port:** 3000
- **Description:** Handles user authentication, including registration, login, and token generation.
- **Dependencies:**
  - `bcryptjs`: For hashing passwords.
  - `cookie-parser`: For parsing cookies.
  - `dotenv`: For managing environment variables.
  - `express`: Web framework.
  - `express-validator`: for request validation
  - `ioredis`: Redis client for Node.js
  - `jsonwebtoken`: For creating and verifying JSON Web Tokens (JWTs).
  - `mongoose`: For interacting with MongoDB.
- **Dev Dependencies:**
  - `jest`: For testing.
  - `mongodb-memory-server`: In-memory MongoDB server for testing.
  - `nodemon`: For automatic server restarts during development.
  - `supertest`: For testing HTTP assertions.

### Product Service

- **Port:** 3001
- **Description:** Manages products, including creating, reading, updating, and deleting products.
- **Dependencies:**
  - `cookie-parser`: For parsing cookies.
  - `dotenv`: For managing environment variables.
  - `express`: Web framework.
  - `express-validator`: for request validation
  - `imagekit`: For image uploads and transformations.
  - `jsonwebtoken`: For creating and verifying JSON Web Tokens (JWTs).
  - `mongoose`: For interacting with MongoDB.
  - `multer`: For handling multipart/form-data (file uploads).
  - `uuid`: For generating unique IDs.
- **Dev Dependencies:**
  - `@babel/core`, `@babel/preset-env`, `babel-jest`: For using modern JavaScript features in tests.
  - `jest`: For testing.
  - `supertest`: For testing HTTP assertions.

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/microBazaar.git
   ```
2. **Navigate to the service directory:**
   ```bash
   cd microBazaar/auth  # or microBazaar/product
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Start the development server:**
   ```bash
   npm run dev
   ```

## Technologies Used

- **Node.js:** JavaScript runtime environment.
- **Express:** Web framework for Node.js.
- **MongoDB:** NoSQL database.
- **Redis:** In-memory data store.
- **JWT:** For authentication.
- **ImageKit:** For image management.
- **Jest:** For testing.

## Future Enhancements

- [ ] **Cart Service:** Implement a dedicated service for managing user shopping carts.
- [ ] **Order Service:** Develop a service to handle order creation, processing, and tracking.
- [ ] **Payment Service:** Integrate with payment gateways for secure transactions.
- [ ] **AI Bot Service:** Create an AI-powered chatbot for customer support or product recommendations.
- [ ] **Notification Service:** Implement a service for sending notifications (email, SMS, push).
- [ ] **RabbitMQ Integration:** Integrate RabbitMQ for asynchronous communication between microservices.
- [ ] **AWS Deployment:** Plan and implement deployment to Amazon Web Services (AWS).

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.