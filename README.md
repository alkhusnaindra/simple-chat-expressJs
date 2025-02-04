# Simple Chat Application 💬

A simple **real-time chat application** built with **Express.js** and **Prisma ORM**. Connect with friends, send messages, and view chat history in a sleek, efficient platform. 🌐✨

## Features 🚀

- **User Authentication**: Register and log in with JWT tokens 🔑.
- **Real-time Messaging**: Chat with others in real-time using Supabase Realtime ⚡.
- **Message History**: View and store all your messages 📝.
- **Simple Setup**: Quick and easy to get started with just a few commands ⚙️.

## Tech Stack 🛠️

- **Backend**: Express.js
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT (JSON Web Token) 🔒
- **Real-time Communication**: supabase realtime 🌐
- **Database Management**: Prisma ORM 🗃️

## Requirements ⚙️

Before you run the project, make sure you have the following installed:

- **Node.js** (v16 or higher) 🚀
- **npm** (Node Package Manager) 📦

## Installation 📥

1. **Clone the Repository**:

    ```bash
    git clone git@github.com:alkhusnaindra/simple-chat-expressJs.git
    ```

2. **Navigate to the Project Folder**:

    ```bash
    cd simple-chat
    ```

3. **Install Dependencies**:

    ```bash
    npm install
    ```

4. **Set Up Database** (Prisma Migrations):

    ```bash
    npx prisma migrate dev
    ```

5. **Create a `.env` File** in the root directory of your project with the following configuration:

    ```dotenv
    # Database URL for Prisma (use SQLite for local development)
    DATABASE_URL="file:./dev.db"

    # JWT Secret key for encoding and decoding tokens
    JWT_SECRET="your-secret-key-here"
    ```

    - **`DATABASE_URL`**: The connection string for your database (SQLite in this case).
    - **`JWT_SECRET`**: The secret key used for encoding and decoding JWT tokens. Make sure to set it to a secure, random value.

6. **Start the Server**:

    ```bash
    npm start
    ```

Your server will now be running at `http://localhost:3000` 🎉.

## Usage 📲

For detailed usage and API documentation, please refer to the Postman collection linked below:

[**Postman API Documentation**](https://documenter.getpostman.com/view/31879373/2sAYX5Lhs9) 📑

The Postman collection includes all available API endpoints, request examples, and responses to help you interact with the chat application.

### Example API Endpoints 📡

- `POST /register` - Register a new user ✍️
- `POST /login` - Log in and get a JWT token 🔑
- `POST /messages` - Send a message 💌 (requires JWT token)
- `GET /messages` - Get all messages 📝 (requires JWT token)

## License 📜

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details. ✨

---

✨ **Enjoy chatting with your friends!** ✨
