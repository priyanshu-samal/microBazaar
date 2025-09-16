# microBazaar: A Microservices E-commerce Platform

Welcome to **microBazaar**, a modern e-commerce platform built with a microservices architecture. This project is designed to be a scalable and resilient system, with each core functionality isolated in its own service.

## About The Project

microBazaar is an ambitious e-commerce platform that aims to provide a seamless shopping experience. The project is built using a microservices architecture, which allows for independent development, deployment, and scaling of each service. This approach also makes the system more resilient to failures and easier to maintain.

## Project Architecture

The project is divided into several microservices, each responsible for a specific business capability. The services communicate with each other through a well-defined API.

### Services

| Service   | Description                                      | Status      |
| --------- | ------------------------------------------------ | ----------- |
| **Auth**  | Handles user authentication and authorization.   | Implemented |
| **Product** | Manages the product catalog and inventory.       | In Progress |
| **Cart**    | Manages the user's shopping cart.                | Planned     |
| **Store**   | Handles the checkout process and order management. | Planned     |
| **AI Bot**  | A chatbot to assist users with their queries.    | Planned     |

## Tech Stack

This project utilizes a wide range of modern technologies to build a robust and scalable platform.

- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Redis
- **Authentication:** JWT (JSON Web Tokens)
- **Testing:** Jest
- **Containerization:** Docker (Planned)
- **Deployment:** AWS (Planned)

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js
- npm
- MongoDB
- Redis

### Installation

1.  **Clone the repo**
    ```sh
    git clone https://github.com/your_username/microBazaar.git
    ```
2.  **Navigate to the service directory** (e.g., `auth`)
    ```sh
    cd auth
    ```
3.  **Install NPM packages**
    ```sh
    npm install
    ```
4.  **Set up environment variables**
    Create a `.env` file and add the required environment variables.
5.  **Start the service**
    ```sh
    npm run dev
    ```

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## Future Scope

-   **Implement the remaining microservices:** Cart, Store, and AI Bot.
-   **Containerize the services using Docker:** This will make the services easier to deploy and manage.
-   **Set up a CI/CD pipeline:** To automate the build, test, and deployment process.
-   **Deploy the services to AWS:** Using services like EKS, ECS, or Lambda.

---

Built with ❤️ by the microBazaar team.