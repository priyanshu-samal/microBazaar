# 🚀 microBazaar: Your Next-Gen Microservices E-commerce Platform 🚀

Welcome to **microBazaar**! This project is an ambitious journey into building a scalable, resilient, and feature-rich e-commerce platform using a microservices architecture. We're crafting a digital marketplace where every component works harmoniously yet independently, ensuring a robust and dynamic user experience.

## ✨ The MicroBazaar Vision: Why Microservices?

Imagine an e-commerce platform that can grow limitlessly, where new features can be added without disrupting existing ones, and where a hiccup in one area doesn't bring down the entire store. That's the power of microservices, and that's the vision for microBazaar!

We're breaking down the traditional monolithic application into smaller, manageable, and independently deployable services. This approach brings a plethora of benefits:

-   **Scalability:** Each service can be scaled independently based on its demand.
-   **Resilience:** A failure in one service won't cascade and affect the entire application.
-   **Agility:** Faster development cycles and easier deployment of new features.
-   **Technology Diversity:** Freedom to choose the best technology stack for each service.

## 🗺️ Architectural Blueprint: How It All Connects

microBazaar is designed as a constellation of specialized services, each handling a distinct domain of the e-commerce ecosystem. Think of it as a bustling marketplace where different shops (microservices) specialize in their craft, yet work together to serve the customer.

Initially, services communicate directly via RESTful APIs. However, our roadmap includes a powerful upgrade:

-   **RabbitMQ for Asynchronous Communication:** To ensure seamless, decoupled, and fault-tolerant communication, we'll be integrating **RabbitMQ**. This message broker will act as the central nervous system, allowing services to communicate asynchronously through events and messages. For example, when a user places an order, the `Order Service` can publish an event to RabbitMQ, and the `Inventory Service` (future) can subscribe to it to update stock, without direct dependencies.

-   **AWS Cloud Hosting:** Each microservice will find its home on **Amazon Web Services (AWS)**. We envision deploying these services independently across various AWS compute options (e.g., EC2, ECS, Lambda), leveraging AWS's robust infrastructure for high availability, scalability, and global reach. Each service will be a separate entity in the cloud, connecting securely to form the complete microBazaar platform.

## 📊 Architecture and Flow Diagrams

### High-Level Architecture

```mermaid
graph TD
    subgraph "User"
        A[Client Browser/App]
    end

    subgraph "API Gateway (Future)"
        B[API Gateway]
    end

    subgraph "Microservices"
        C[Auth Service]
        D[Product Service]
        E[Cart Service (Future)]
        F[Order Service (Future)]
        G[AI Bot (Future)]
    end

    subgraph "Message Broker"
        H[RabbitMQ (Future)]
    end

    subgraph "Databases"
        I[Auth DB (MongoDB)]
        J[Product DB (MongoDB)]
    end

    A --> B
    B --> C
    B --> D
    B --> E
    B --> F
    B --> G

    C -- REST API --> B
    D -- REST API --> B
    E -- REST API --> B
    F -- REST API --> B
    G -- REST API --> B

    C --- I
    D --- J

    C -.-> H
    D -.-> H
    E -.-> H
    F -.-> H
    G -.-> H

    H -.-> C
    H -.-> D
    H -.-> E
    H -.-> F
    H -.-> G
```

### User Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant Auth_Service
    participant Auth_DB

    Client->>Auth_Service: POST /api/auth/register (email, password)
    Auth_Service->>Auth_DB: Check if user exists
    alt User does not exist
        Auth_Service->>Auth_DB: Save new user with hashed password
        Auth_Service-->>Client: 201 Created {user, token}
    else User exists
        Auth_Service-->>Client: 400 Bad Request (User already exists)
    end

    Client->>Auth_Service: POST /api/auth/login (email, password)
    Auth_Service->>Auth_DB: Find user by email
    alt User found
        Auth_Service->>Auth_Service: Compare password with hashed password
        alt Password matches
            Auth_Service->>Auth_Service: Generate JWT Token
            Auth_Service-->>Client: 200 OK {token}
        else Password does not match
            Auth_Service-->>Client: 401 Unauthorized (Invalid credentials)
        end
    else User not found
        Auth_Service-->>Client: 401 Unauthorized (Invalid credentials)
    end
```

### New Product Flow

```mermaid
sequenceDiagram
    participant Client
    participant Product_Service
    participant Auth_Middleware
    participant ImageKit_Service
    participant Product_DB

    Client->>Product_Service: POST /api/products (product data, image file) with Auth Token
    Product_Service->>Auth_Middleware: Verify Token
    Auth_Middleware-->>Product_Service: Token Valid (user info)

    Product_Service->>ImageKit_Service: Upload image
    ImageKit_Service-->>Product_Service: Image URL and ID

    Product_Service->>Product_DB: Create new product with image URL
    Product_DB-->>Product_Service: Saved Product

    Product_Service-->>Client: 201 Created {product}
```

### Asynchronous Communication with RabbitMQ (Example: Order Creation)

```mermaid
graph TD
    subgraph "Order Service (Future)"
        A[1. Create Order] --> B{Publish 'order.created' event};
    end

    subgraph "RabbitMQ"
        C(Exchange: 'orders_exchange')
    end

    subgraph "Notification Service (Future)"
        D[Queue: 'notifications_queue'] --> E[2. Consume event & Send Email/SMS];
    end

    subgraph "Inventory Service (Future)"
        F[Queue: 'inventory_queue'] --> G[3. Consume event & Update Stock];
    end

    B -- 'order.created' --> C;
    C -- Routing Key: 'order.created' --> D;
    C -- Routing Key: 'order.created' --> F;
```

## 🌟 Current Services Spotlight

Here are the foundational services currently powering microBazaar:

### 🔐 Auth Service

-   **Port:** `3000`
-   **Description:** The gatekeeper of microBazaar! This service is responsible for all things user authentication – from secure registration and login to generating and validating access tokens. It ensures that only legitimate users can access protected resources.
-   **Key Technologies:** `Node.js`, `Express`, `MongoDB`, `JWT`, `bcryptjs`, `ioredis` (for session/token management).

### 🛍️ Product Service

-   **Port:** `3001`
-   **Description:** The heart of our catalog! This service meticulously manages all product-related operations. It handles creating new products, retrieving product details, updating inventory information, and even managing product images with `ImageKit`.
-   **Key Technologies:** `Node.js`, `Express`, `MongoDB`, `ImageKit`, `Multer` (for file uploads).

## 🚧 Roadmap to Awesomeness: What's Next for microBazaar?

Our journey has just begun! Here's a sneak peek at the exciting features and architectural enhancements we're planning:

-   [ ] **Cart Service:** A dedicated service to manage user shopping carts, allowing seamless adding, removing, and updating of items.
-   [ ] **Order Service:** The brain behind transactions, handling order creation, processing, status updates, and history.
-   [ ] **Payment Service:** Securely integrate with various payment gateways to facilitate smooth and reliable transactions.
-   [ ] **AI Bot Service:** An intelligent companion for our users, offering personalized recommendations, customer support, and more.
-   [ ] **Notification Service:** Keep users informed with real-time updates via email, SMS, or push notifications.
-   [ ] **RabbitMQ Integration:** Implement robust asynchronous communication patterns across all microservices.
-   [ ] **AWS Deployment:** Strategically deploy each microservice to AWS, optimizing for performance, cost, and reliability.
-   [ ] **Frontend Application:** Develop a captivating user interface to bring microBazaar to life!

## 🚀 Getting Started: Join the microBazaar Journey!

Ready to dive into the code? Follow these simple steps to get microBazaar up and running on your local machine:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/microBazaar.git
    ```
2.  **Navigate to a service directory:**
    ```bash
    cd microBazaar/auth  # or microBazaar/product
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Start the development server:**
    ```bash
    npm run dev
    ```
    *(Repeat steps 2-4 for each service you wish to run.)*

## 🛠️ Core Technologies Powering microBazaar

-   **Node.js:** The asynchronous, event-driven JavaScript runtime.
-   **Express.js:** Our flexible and minimalist web application framework.
-   **MongoDB:** A powerful NoSQL database for flexible data storage.
-   **Redis:** An in-memory data structure store, used for caching and session management.
-   **JSON Web Tokens (JWT):** For secure and stateless authentication.
-   **ImageKit:** For efficient image management, optimization, and delivery.
-   **Jest:** Our go-to testing framework for robust and reliable code.
-   **RabbitMQ (Planned):** For inter-service communication and message queuing.
-   **AWS (Planned):** Our cloud platform for scalable and resilient deployments.

## 👋 Contributing: Be a Part of microBazaar!

We welcome contributions from everyone! Whether it's a bug fix, a new feature, or an improvement to the documentation, your input is invaluable. Please feel free to open an issue or submit a pull request. Let's build something amazing together!
