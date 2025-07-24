# Project Shooting Star Backend

This is the backend server for the Project Shooting Star application, a math education platform.

## Table of Contents

- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Server](#running-the-server)
- [Configuration](#configuration)
- [API Routes](#api-routes)
- [Database](#database)
- [Scripts and Utilities](#scripts-and-utilities)
  - [Project Manager](#project-manager)
  - [Configuration Helper](#configuration-helper)
  - [API Generator](#api-generator) 
  - [Test Setup](#test-setup)
  - [Documentation Generator](#documentation-generator)
- [Testing](#testing)
- [Documentation](#documentation)
- [Deployment](#deployment)

## Project Structure

```
backend/
├── config/             # Configuration files
├── docs/               # Generated documentation
├── scripts/            # Utility scripts
├── src/
│   ├── config/         # Application configuration
│   ├── controllers/    # Route controllers
│   ├── docs/           # Documentation examples
│   ├── middleware/     # Express middleware
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   ├── utils/          # Utility functions
│   └── server.js       # Server entry point
├── tests/              # Tests
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── e2e/            # End-to-end tests
├── .env                # Environment variables (dev)
├── .env.production     # Production environment variables
├── .env.test           # Test environment variables
└── package.json        # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB (v4+)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/project-shooting-star.git
   ```

2. Navigate to the backend directory:
   ```
   cd project-shooting-star/backend
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Set up your environment variables:
   ```
   cp .env.example .env
   ```

5. Edit the `.env` file with your configuration values

### Running the Server

Development mode with auto-restart:
```
npm run dev
```

Production mode:
```
npm start
```

## Configuration

Project Shooting Star uses a hierarchical configuration system:

1. Base configuration (default values)
2. Environment-specific configuration (development, production, test)
3. .env file variables
4. Command-line arguments (highest priority)

You can use the configuration helper to manage your environment variables:

```
npm run config list      # List all environment variables with current values
npm run config check     # Check if all required environment variables are set
npm run config create    # Create a .env file template for specified environment
```

## API Routes

- **Authentication**: `/api/auth` - Login, register, logout
- **Users**: `/api/users` - User management
- **Profile**: `/api/profile` - User profile data
- **Games**: `/api/games` - Math game information
- **Progress**: `/api/progress` - Learning progress tracking

## Database

The application uses MongoDB for data storage:

- Connection is managed by Mongoose
- Models are defined in `src/models/`
- Database configuration is in `src/config/`

## Scripts and Utilities

### Project Manager

The most powerful tool in the toolkit is the Project Manager, a comprehensive interactive CLI tool that provides a unified interface for all project operations:

```
npm run project
```

This launches an interactive menu with the following features:

- **Project Status**: Quick overview of your project state
- **Configuration Management**: Environment variable management
- **API Development**: Generate API endpoints and documentation
- **Testing**: Run and manage tests
- **Development**: Start servers and perform development tasks
- **Database**: Seed and manage database operations
- **Deployment**: Build and deploy your application

The Project Manager combines all other utilities into a single, easy-to-use interface.

### Configuration Helper

The Configuration Helper allows you to manage environment variables easily.

```
npm run config help      # Show help message
npm run config list      # List all environment variables
npm run config check     # Check required environment variables
npm run config create    # Create a .env file template
```

Advanced usage:
```
npm run config check production  # Check production environment
npm run config create test       # Create .env.test template
```

### API Generator

The API Generator automates the creation of RESTful API endpoints.

```
npm run generate-api
```

This interactive tool will:
1. Ask for a resource name (e.g., "bet")
2. Prompt you to define fields for the model
3. Ask if authentication is required
4. Generate model, controller, and route files
5. Update the main routes index

### Test Setup

The Test Setup utility helps with testing configuration and execution.

```
npm run test-setup help      # Show help message
npm run test-setup setup     # Set up test environment
npm run test-setup run       # Run tests
npm run test-setup watch     # Run tests in watch mode
npm run test-setup coverage  # Generate test coverage report
```

### Documentation Generator

The Documentation Generator creates API documentation in different formats.

```
npm run docs help       # Show help message
npm run docs swagger    # Generate OpenAPI/Swagger documentation
npm run docs markdown   # Generate Markdown documentation
npm run docs postman    # Generate Postman collection
```

After generating Swagger documentation, it can be accessed at:
http://localhost:3000/api/docs

## Testing

The project uses Jest for testing:

```
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate test coverage report
```

## Documentation

API documentation is available in multiple formats:

- **Swagger/OpenAPI**: `/api/docs`
- **Markdown**: `docs/markdown/api.md`
- **Postman Collection**: `docs/postman_collection.json`

To generate documentation:
```
npm run docs swagger    # Generate Swagger docs
npm run docs markdown   # Generate Markdown docs
npm run docs postman    # Generate Postman collection
```

## Deployment

### Deployment to Production

1. Set up production environment variables:
   ```
   npm run config create production
   ```

2. Build the application (if applicable):
   ```
   npm run build
   ```

3. Start the server in production mode:
   ```
   NODE_ENV=production npm start
   ```

### Docker Deployment

A Dockerfile is included for containerized deployment:

1. Build the Docker image:
   ```
   docker build -t project-shooting-star-backend .
   ```

2. Run the container:
   ```
   docker run -p 3000:3000 -d project-shooting-star-backend
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details. 