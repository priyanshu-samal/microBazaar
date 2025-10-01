# 🚀 microBazaar: Your Next-Gen Microservices E-commerce Platform 🚀

Welcome to **microBazaar**! This project is an ambitious journey into building a scalable, resilient, and feature-rich e-commerce platform using a microservices architecture. We're crafting a digital marketplace where every component works harmoniously yet independently, ensuring a robust and dynamic user experience.

## ✨ The microBazaar Vision: Why Microservices?

Imagine an e-commerce platform that can grow limitlessly, where new features can be added without disrupting existing ones, and where a hiccup in one area doesn't bring down the entire store. That's the power of microservices, and that's the vision for microBazaar!

We're breaking down the traditional monolithic application into smaller, manageable, and independently deployable services. This approach brings a plethora of benefits:

-   **Scalability:** Each service can be scaled independently based on its demand.
-   **Resilience:** A failure in one service won't cascade and affect the entire application.
-   **Agility:** Faster development cycles and easier deployment of new features.
-   **Technology Diversity:** Freedom to choose the best technology stack for each service.

## 🗺️ Architectural Blueprint: How It All Connects

microBazaar is designed as a constellation of specialized services, each handling a distinct domain of the e-commerce ecosystem. Think of it as a bustling marketplace where different shops (microservices) specialize in their craft, yet work together to serve the customer.

Initially, services communicate directly via RESTful APIs. However, the architecture is evolving to an event-driven model for more robust, scalable, and decoupled communication.

-   **Asynchronous Communication with CloudAMQP:** To ensure seamless and fault-tolerant communication, we use **CloudAMQP**, a managed RabbitMQ message broker. This acts as the central nervous system, allowing services to communicate asynchronously. For example, when a user registers, the `Auth Service` publishes a `USER_CREATED` event, and the `Notification Service` consumes this event to send a welcome email, all without the services being directly dependent on each other. The connection is configured via a `RABBIT_URL` environment variable.

-   **AWS Cloud Hosting:** Each microservice will find its home on **Amazon Web Services (AWS)**. We envision deploying these services independently across various AWS compute options (e.g., EC2, ECS, Lambda), leveraging AWS's robust infrastructure for high availability, scalability, and global reach. Each service will be a separate entity in the cloud, connecting securely to form the complete microBazaar platform.

## 📊 Architecture and Flow Diagrams

### High-Level Architecture

```mermaid
graph TD
    subgraph "User Interaction"
        A[Client Browser/App] --> B(API Gateway);
    end

    subgraph "Core Services"
        B --> C[Auth Service];
        B --> D[Product Service];
        B --> E[Cart Service];
        B --> F[Order Service];
        B --> G[Payment Service];
    end

    subgraph "Supporting Services"
        B --> H[AI Buddy Service];
        B --> S[Seller Dashboard Service];
        O[Notification Service];
        IS[Inventory Service];
    end

    subgraph "Data & Events"
        subgraph Databases
            DB1[(Auth DB)]
            DB2[(Product DB)]
            DB3[(Cart DB)]
            DB4[(Order DB)]
            DB5[(Payment DB)]
            DB6[(Seller DB)]
        end
        
        subgraph "Message Broker"
            N[RabbitMQ];
        end

        subgraph "External"
            IK[ImageKit];
            RP[Razorpay];
        end
    end

    %% Service to DB Connections
    C --- DB1;
    D --- DB2;
    E --- DB3;
    F --- DB4;
    G --- DB5;
    S --- DB6;

    %% HTTP Communications
    E --> D;
    F --> D;
    F --> E;
    G --> F;
    F --> IS;
    H --> D;
    H --> E;

    %% External Service Communications
    D --> IK;
    G --> RP;

    %% Event Publishing
    C -- "USER_CREATED" --> N;
    D -- "PRODUCT_CREATED" --> N;
    F -- "ORDER_CREATED" --> N;
    G -- "PAYMENT_COMPLETED" --> N;

    %% Event Consumption
    N -- "USER_CREATED" --> O;
    N -- "PRODUCT_CREATED" --> O;
    N -- "PAYMENT_COMPLETED" --> O;
    N -- "PAYMENT_INITIATED" --> O;
    N -- "PAYMENT_FAILED" --> O;
    
    N -- "USER_CREATED" --> S;
    N -- "PRODUCT_CREATED" --> S;
    N -- "ORDER_CREATED" --> S;
    N -- "PAYMENT_UPDATED" --> S;

```

### User Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant Auth_Service
    participant Auth_DB
    participant RabbitMQ
    participant Notification_Service
    participant Seller_Dashboard_Service

    Client->>Auth_Service: POST /api/auth/register (email, password)
    Auth_Service->>Auth_DB: Check if user exists
    alt User does not exist
        Auth_Service->>Auth_DB: Save new user with hashed password
        Auth_Service->>RabbitMQ: Publish 'AUTH_NOTIFICATION.USER_CREATED'
        Auth_Service->>RabbitMQ: Publish 'AUTH_SELLER_DASHBOARD.USER_CREATED'
        RabbitMQ-->>Notification_Service: Consume 'AUTH_NOTIFICATION.USER_CREATED'
        Notification_Service-->>Notification_Service: Send Welcome Email
        RabbitMQ-->>Seller_Dashboard_Service: Consume 'AUTH_SELLER_DASHBOARD.USER_CREATED'
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
    
    Client->>Auth_Service: GET /api/auth/me (with token)
    Auth_Service-->>Client: 200 OK {user}

    Client->>Auth_Service: GET /api/auth/logout
    Auth_Service-->>Client: 200 OK {message}
```

### New Product Flow

```mermaid
sequenceDiagram
    participant Client
    participant Product_Service
    participant Auth_Middleware
    participant ImageKit_Service
    participant Product_DB
    participant RabbitMQ
    participant Notification_Service
    participant Seller_Dashboard_Service

    Client->>Product_Service: POST /api/products (product data, image file) with Auth Token
    Product_Service->>Auth_Middleware: Verify Token
    Auth_Middleware-->>Product_Service: Token Valid (user info)

    Product_Service->>ImageKit_Service: Upload image
    ImageKit_Service-->>Product_Service: Image URL and ID

    Product_Service->>Product_DB: Create new product with image URL
    Product_DB-->>Product_Service: Saved Product

    Product_Service->>RabbitMQ: Publish 'PRODUCT_NOTIFICATION.PRODUCT_CREATED'
    Product_Service->>RabbitMQ: Publish 'PRODUCT_SELLER_DASHBOARD.PRODUCT_CREATED'
    
    RabbitMQ-->>Notification_Service: Consume 'PRODUCT_NOTIFICATION.PRODUCT_CREATED'
    Notification_Service-->>Notification_Service: Send New Product Email

    RabbitMQ-->>Seller_Dashboard_Service: Consume 'PRODUCT_SELLER_DASHBOARD.PRODUCT_CREATED'

    Product_Service-->>Client: 201 Created {product}
```

### Cart Management Flow

```mermaid
sequenceDiagram
    participant Client
    participant Cart_Service
    participant Auth_Middleware
    participant Product_Service
    participant Cart_DB

    Client->>Cart_Service: POST /api/cart/items (productId, quantity) with Auth Token
    Cart_Service->>Auth_Middleware: Verify Token
    Auth_Middleware-->>Cart_Service: Token Valid (user info)
    Cart_Service->>Product_Service: GET /api/products/:productId
    Product_Service-->>Cart_Service: Product details (stock)
    Cart_Service->>Cart_DB: Add/Update item in user's cart
    Cart_DB-->>Cart_Service: Updated Cart
    Cart_Service-->>Client: 200 OK {cart}

    Client->>Cart_Service: GET /api/cart with Auth Token
    Cart_Service->>Auth_Middleware: Verify Token
    Auth_Middleware-->>Cart_Service: Token Valid (user info)
    Cart_Service->>Cart_DB: Get user's cart
    Cart_DB-->>Cart_Service: Cart
    Cart_Service-->>Client: 200 OK {cart}
```

### Order Creation Flow

```mermaid
sequenceDiagram
    participant Client
    participant Order_Service
    participant Cart_Service
    participant Product_Service
    participant Inventory_Service
    participant Order_DB
    participant RabbitMQ
    participant Seller_Dashboard_Service

    Client->>Order_Service: POST /api/orders
    Order_Service->>Cart_Service: GET /api/cart
    Cart_Service-->>Order_Service: Cart items
    loop for each cart item
        Order_Service->>Product_Service: GET /api/products/:productId
        Product_Service-->>Order_Service: Product details (price, stock)
    end
    Order_Service->>Order_Service: Calculate total price
    Order_Service->>Inventory_Service: POST /api/inventory/reserve
    Inventory_Service-->>Order_Service: Reservation successful
    Order_Service->>Order_DB: Create new order
    Order_DB-->>Order_Service: Saved Order
    
    Order_Service->>RabbitMQ: Publish 'ORDER_SELLER_DASHBOARD.ORDER_CREATED'
    RabbitMQ-->>Seller_Dashboard_Service: Consume 'ORDER_SELLER_DASHBOARD.ORDER_CREATED'
    
    Order_Service-->>Client: 201 Created {order}
```

### Payment Flow

```mermaid
sequenceDiagram
    participant Client
    participant Payment_Service
    participant Order_Service
    participant Razorpay
    participant Payment_DB
    participant RabbitMQ
    participant Notification_Service
    participant Seller_Dashboard_Service

    Client->>Payment_Service: POST /api/payment/create/:orderId
    Payment_Service->>Order_Service: GET /api/orders/:orderId
    Order_Service-->>Payment_Service: Order details (totalPrice)
    Payment_Service->>Razorpay: Create Order
    Razorpay-->>Payment_Service: Razorpay Order ID
    Payment_Service->>Payment_DB: Create payment (status: PENDING)
    Payment_Service-->>Client: { razorpayOrderId }

    Client->>Razorpay: User completes payment
    Razorpay-->>Client: { razorpay_payment_id, razorpay_order_id, razorpay_signature }

    Client->>Payment_Service: POST /api/payment/verify
    Payment_Service->>Payment_Service: Verify signature
    alt Signature is valid
        Payment_Service->>Payment_DB: Update payment (status: SUCCESSFUL)
        Payment_Service->>RabbitMQ: Publish "PAYMENT_NOTIFICATION.PAYMENT_COMPLETED"
        Payment_Service->>RabbitMQ: Publish "PAYMENT_SELLER_DASHBOARD.PAYMENT_UPDATED"
        RabbitMQ-->>Notification_Service: Consume 'PAYMENT_NOTIFICATION.PAYMENT_COMPLETED'
        Notification_Service-->>Notification_Service: Send Payment Confirmation Email
        RabbitMQ-->>Seller_Dashboard_Service: Consume 'PAYMENT_SELLER_DASHBOARD.PAYMENT_UPDATED'
        Payment_Service-->>Client: 200 OK {message: "Payment verified"}
    else Signature is invalid
        Payment_Service-->>Client: 400 Bad Request (Invalid signature)
    end
```

### AI Buddy Socket Connection Flow

```mermaid
sequenceDiagram
    participant Client
    participant AI_Buddy_Service
    
    Client->>AI_Buddy_Service: Connect with JWT in cookie
    AI_Buddy_Service->>AI_Buddy_Service: Verify JWT
    alt JWT is valid
        AI_Buddy_Service-->>Client: Connection successful
    else JWT is invalid
        AI_Buddy_Service-->>Client: Authentication error
    end
    
    Client->>AI_Buddy_Service: on('message', 'find product X')
    AI_Buddy_Service->>AI_Buddy_Service: agent.invoke('find product X')
    AI_Buddy_Service->>Product_Service: GET /api/products?q=X
    Product_Service-->>AI_Buddy_Service: Product details
    AI_Buddy_Service->>Cart_Service: POST /api/cart/items
    Cart_Service-->>AI_Buddy_Service: Cart updated
    AI_Buddy_Service-->>Client: emit('message', 'I have added product X to your cart')
```

## 🌟 Current Services Spotlight

Here are the foundational services currently powering microBazaar:

### 🔐 Auth Service

-   **Port:** `3000`
-   **Description:** The gatekeeper of microBazaar! This service is responsible for all things user authentication – from secure registration and login to generating and validating access tokens. It ensures that only legitimate users can access protected resources. It communicates with the Notification and Seller Dashboard services via RabbitMQ. It also manages user addresses.
-   **Key Technologies:** `Node.js`, `Express`, `MongoDB`, `JWT`, `bcryptjs`, `ioredis` (for session/token management), `amqplib`.

#### API Endpoints

| Method | Endpoint                       | Description                      | Auth Required |
| :----- | :----------------------------- | :------------------------------- | :------------ |
| POST   | `/api/auth/register`           | Register a new user              | No            |
| POST   | `/api/auth/login`              | Login a user                     | No            |
| GET    | `/api/auth/me`                 | Get current user details         | Yes           |
| GET    | `/api/auth/logout`             | Logout the current user          | No            |
| POST   | `/api/auth/users/me/addresses` | Add a new address for the user   | Yes           |
| GET    | `/api/auth/users/me/addresses` | Get all addresses for the user   | Yes           |
| DELETE | `/api/auth/users/me/addresses/:addressId` | Delete a user's address | Yes           |

### 🛍️ Product Service

-   **Port:** `3001`
-   **Description:** The heart of our catalog! This service meticulously manages all product-related operations. It handles creating new products, retrieving product details, updating inventory information, and even managing product images with `ImageKit`. It publishes events to the Notification and Seller Dashboard services when a new product is created.
-   **Key Technologies:** `Node.js`, `Express`, `MongoDB`, `ImageKit`, `Multer` (for file uploads), `amqplib`.

#### API Endpoints

| Method | Endpoint                | Description                      | Auth Required (Role) |
| :----- | :---------------------- | :------------------------------- | :------------------- |
| POST   | `/api/products`         | Create a new product             | Yes (Admin, Seller)  |
| GET    | `/api/products`         | Get a list of all products       | No                   |
| GET    | `/api/products/:id`     | Get a single product by ID       | No                   |
| PATCH  | `/api/products/:id`     | Update a product                 | Yes (Seller)         |
| DELETE | `/api/products/:id`     | Delete a product                 | Yes (Seller)         |
| GET    | `/api/products/seller`  | Get all products for a seller    | Yes (Seller)         |

### 🛒 Cart Service

-   **Port:** `3002`
-   **Description:** Your shopping companion! This service manages user shopping carts, allowing for items to be added, updated, and removed seamlessly. It communicates with the Product service to check for stock availability.
-   **Key Technologies:** `Node.js`, `Express`, `MongoDB`, `axios`.

#### API Endpoints

| Method | Endpoint                  | Description                | Auth Required (Role) |
| :----- | :------------------------ | :------------------------- | :------------------- |
| GET    | `/api/cart`               | Get the user's cart        | Yes (User)           |
| POST   | `/api/cart/items`         | Add an item to the cart    | Yes (User)           |
| PATCH  | `/api/cart/items/:productId` | Update a cart item's quantity | Yes (User)           |
| DELETE | `/api/cart/items/:productId` | Remove an item from the cart | Yes (User)           |

### 📦 Order Service

-   **Port:** `3003`
-   **Description:** This service is responsible for managing orders. It orchestrates the order creation process by communicating with the Cart and Product services to build a new order. It also communicates with an Inventory service to reserve stock and publishes an event to the Seller Dashboard service when an order is created.
-   **Key Technologies:** `Node.js`, `Express`, `MongoDB`, `axios`, `amqplib`.

#### API Endpoints

| Method | Endpoint | Description | Auth Required (Role) |
| :--- | :--- | :--- | :--- |
| POST | `/api/orders` | Create a new order from the user's cart | Yes (User) |
| GET | `/api/orders/me` | Get all orders for the current user | Yes (User) |
| GET | `/api/orders/:id` | Get a specific order by ID | Yes (User, Admin) |
| POST | `/api/orders/:id/cancel` | Cancel an order | Yes (User) |
| PATCH | `/api/orders/:id/address` | Update the shipping address for an order | Yes (User) |

### 💳 Payment Service

-   **Port:** `3004`
-   **Description:** This service handles the payment process. It integrates with Razorpay to create and verify payments for orders. It communicates with the Notification and Seller Dashboard services via RabbitMQ.
-   **Key Technologies:** `Node.js`, `Express`, `MongoDB`, `Razorpay`, `axios`, `amqplib`.

#### API Endpoints

| Method | Endpoint | Description | Auth Required (Role) |
| :--- | :--- | :--- | :--- |
| POST | `/api/payments/create/:orderId` | Create a new payment for an order | Yes (User) |
| POST | `/api/payments/verify` | Verify a payment | Yes (User) |

### 🤖 AI Buddy Service

-   **Port:** `3005`
-   **Description:** Your intelligent shopping assistant! This service provides real-time support and recommendations to users via a WebSocket connection. It uses `socket.io` for fast, bidirectional communication and leverages a **LangChain** agent with **Google's Generative AI** to understand user queries and perform actions like searching for products and adding them to the cart.
-   **Key Technologies:** `Node.js`, `Express`, `socket.io`, `JWT`, `@langchain/langgraph`, `@langchain/google-genai`.

### 🔔 Notification Service

-   **Port:** `3006`
-   **Description:** This service works behind the scenes to keep users informed. It listens for events from other services via RabbitMQ and sends out notifications, such as emails, to the user.
-   **Key Technologies:** `Node.js`, `Express`, `amqplib` (for RabbitMQ), `nodemailer`.
-   **Consumed Events:**
    -   `AUTH_NOTIFICATION.USER_CREATED`
    -   `PAYMENT_NOTIFICATION.PAYMENT_INITIATED`
    -   `PAYMENT_NOTIFICATION.PAYMENT_COMPLETED`
    -   `PAYMENT_NOTIFICATION.PAYMENT_FAILED`
    -   `PRODUCT_NOTIFICATION.PRODUCT_CREATED`

### 📈 Seller Dashboard Service

-   **Port:** `3007`
-   **Description:** This service provides a dashboard for sellers to manage their products, view sales data, and track their performance. It listens for events from the Auth, Product, Order, and Payment services via RabbitMQ to keep its data up-to-date.
-   **Key Technologies:** `Node.js`, `Express`, `MongoDB`, `amqplib`.
-   **Consumed Events:**
    -   `AUTH_SELLER_DASHBOARD.USER_CREATED`
    -   `PRODUCT_SELLER_DASHBOARD.PRODUCT_CREATED`
    -   `ORDER_SELLER_DASHBOARD.ORDER_CREATED`
    -   `PAYMENT_SELLER_DASHBOARD.PAYMENT_CREATED`
    -   `PAYMENT_SELLER_DASHBOARD.PAYMENT_UPDATE`

#### API Endpoints

| Method | Endpoint      | Description                  | Auth Required (Role) |
| :----- | :------------ | :--------------------------- | :------------------- |
| GET    | `/api/seller/dashboard/metrics` | Get seller metrics           | Yes (Seller)         |
| GET    | `/api/seller/dashboard/orders`  | Get orders for the seller    | Yes (Seller)         |
| GET    | `/api/seller/dashboard/products`| Get products for the seller  | Yes (Seller)         |

## 🚧 Roadmap to Awesomeness: What's Next for microBazaar?

Our journey has just begun! Here's a sneak peek at the exciting features and architectural enhancements we're planning:

-   [x] **Cart Service:** A dedicated service to manage user shopping carts, allowing seamless adding, removing, and updating of items.
-   [x] **Order Service:** The brain behind transactions, handling order creation, processing, status updates, and history.
-   [x] **Payment Service:** Securely integrate with various payment gateways to facilitate smooth and reliable transactions.
-   [x] **AI Bot Service:** An intelligent companion for our users, offering personalized recommendations, customer support, and more.
-   [x] **Notification Service:** Keep users informed with real-time updates via email, SMS, or push notifications.
-   [x] **RabbitMQ Integration:** Implement robust asynchronous communication patterns across all microservices.
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
    cd microBazaar/auth  # or any other service
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
-   **Razorpay:** Our payment processing partner.
-   **socket.io:** For real-time, bidirectional and event-based communication.
-   **LangChain:** For building applications with large language models.
-   **Jest:** Our go-to testing framework for robust and reliable code.
-   **RabbitMQ:** For inter-service communication and message queuing.
-   **amqplib:** A comprehensive, fully-featured RabbitMQ client for Node.js.
-   **nodemailer:** A module for Node.js applications to allow easy as cake email sending.
-   **AWS (Planned):** Our cloud platform for scalable and resilient deployments.

## 👋 Contributing: Be a Part of microBazaar!

We welcome contributions from everyone! Whether it's a bug fix, a new feature, or an improvement to the documentation, your input is invaluable. Please feel free to open an issue or submit a pull request. Let's build something amazing together!
