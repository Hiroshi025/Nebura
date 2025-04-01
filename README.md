# NEBURA AI - API Documentation

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Version](https://img.shields.io/badge/Version-0.1.1--alpha-orange)

## Overview

NEBURA AI is a comprehensive API system providing AI processing capabilities, IP management, license management, and authentication services.

## Features

### ✨ Core Functionalities

- **AI Processing** with Google Gemini models
- **IP Address Management** (block/unblock/list)
- **License Management System** (create/validate/update)
- **JWT Authentication** (register/login/user data)
- **System Monitoring** endpoints

### 🔧 Technical Specifications

- RESTful API design
- JWT authentication
- Paginated responses
- Detailed error handling
- Comprehensive Swagger documentation

## API Documentation

[![Swagger](https://img.shields.io/badge/Swagger-Documentation-green)](https://docs.hiroshi-dev.me)

Full interactive documentation available at:  
https://docs.hiroshi-dev.me

### Key Endpoints

| Category       | Endpoints                                                                     |
| -------------- | ----------------------------------------------------------------------------- |
| AI Processing  | `/google/model-ai/text`, `/google/model-ai/file`, `/google/model-ai/combined` |
| IP Management  | `/block-ip`, `/unblock-ip/{ipAddress}`, `/blocked-ips`                        |
| Licenses       | `/licenses`, `/licenses/{id}`, `/licenses/validate/{key}`                     |
| Authentication | `/auth/register`, `/auth/login`, `/auth/{id}`                                 |
| System Status  | `/public/status`                                                              |

## Installation

### Prerequisites

- Node.js v20.18.0+
- TypeScript
- MongoDB (or other preferred database)

### Setup

1. Clone the repository

   ```bash
   git clone https://github.com/your-repo/nebura-ai.git
   cd nebura-ai
   ```

2. Install dependencies
   ```bash
   npm install
   ```

## Contributing

We welcome contributions to NEBURA AI! To contribute, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes with clear and concise messages:
   ```bash
   git commit -m "Add detailed description of your changes"
   ```
4. Push your branch to your forked repository:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a pull request to the main repository.

Please ensure your code adheres to the project's coding standards and includes appropriate tests.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Version Control

This project follows [Semantic Versioning](https://semver.org/). The current version is **0.1.1-alpha**.  
For a detailed changelog, please refer to the [CHANGELOG.md](CHANGELOG.md) file.

## Language and Frameworks

NEBURA AI is built using the following technologies:

- **Programming Language**: TypeScript
- **Framework**: Node.js with Express.js
- **Database**: MongoDB (or other compatible databases)
- **Documentation**: Swagger (OpenAPI Specification)
