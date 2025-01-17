# React [Redux / Tanstack Query / Mock Service Worker] JavaScript Starter/Boilerplate

## Overview

This project is built using **React 18.3.1** and leverages several popular JavaScript libraries and tools to create a
modern, fast, and scalable front-end application. The project uses **Vite** as its build tool for optimized development
and production builds.

## Requirements

- **Node.js** ~ v23.x.x
- **NPM** ~ v10.x.x

## Features

- **React & Redux** for state management and UI rendering.
- **React Router DOM** for routing.
- **Axios** for HTTP requests.
- **React Query** integration for server state management.
- **Eslint** and **Prettier** for maintaining code quality and style consistency.
- **SASS Embedded** for advanced styling capabilities.
- Mocking with **MSW** (Mock Service Worker).
- **Husky** for Git hook management.
- **Knip** for dependency analysis and dead code detection.
- **Vitest** for testing and test-driven development.
- **Plop.js** for component and file scaffolding.

## Installation

To set up the project locally, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/dsvjetl/react-redux-tanstack-msw-js-starter <new_project_name>
   cd <new_project_name>
   ```

2. Install dependencies using `npm`:

   ```bash
   npm install
   ```

3. Set up Husky hooks:

   ```bash
   npm run prepare
   ```

4. Copy the environment variables file:

   ```bash
   cp .env.example .env.local
   cp .env.example .env.production
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open the project in your browser at `http://localhost:5173` (default port for Vite).

## Project Structure

```plaintext
.
├── src
│   ├── shared          # Reusable React components, services, utils, etc.
│   ├── views           # Page-level React components (Check HomeExample component for more info)
│   ├── store           # Redux store
│   ├── routing         # React Router
│   ├── assets          # Multimedia files
│   ├── mocks           # Mock Service Worker config
│   └── App.jsx         # Main application entry point
├── public              # Static assets (e.g., index.html, images) & mockServiceWorker.js
├── package.json        # Project dependencies and scripts
├── .eslintrc.json      # ESLint configuration
├── prettier.config.js  # Prettier configuration
├── README.md           # Documentation
├── vite.config.js      # Vite configuration
└── vitest.config.ts    # Vitest configuration
...
```

## Scripts

Below are the standard scripts defined in the `package.json`:

- **Start the development server:**

  ```bash
  npm run dev
  ```

- **Start the mock (MSW) server:**

  ```bash
  npm run dev:mock
  ```

- **Create production build:**

  ```bash
  npm run build
  ```

- **Preview production build locally:**

  ```bash
  npm run preview
  ```

- **Run unit and integration tests:**

  ```bash
  npm run test
  ```

- **Run tests with the Vitest UI:**

  ```bash
  npm run test:ui
  ```

- **Run linting checks:**

  ```bash
  npm run lint
  ```

- **Format the project:**

  ```bash
  npm run format
  ```

- **Analyze dependencies and dead code with Knip.js:**

  ```bash
  npm run scan:deadcode
  ```

## Libraries and Tools

| Library/Tool            | Version | Use Case                                  |
| ----------------------- | ------- | ----------------------------------------- |
| **React**               | 18.3.1  | UI Rendering                              |
| **React Redux**         | 9.2.0   | State management                          |
| **React Router DOM**    | 7.0.2   | Client-side routing                       |
| **Axios**               | 1.7.9   | HTTP requests                             |
| **React Query**         | 5.62.8  | Server state management                   |
| **Eslint**              | 8.57.1  | Error prevention and code standardization |
| **Prettier**            | 3.4.2   | Code formatting                           |
| **SASS Embedded**       | 1.83.0  | Advanced CSS styling                      |
| **Mock Service Worker** | 2.7.0   | API data mocking for testing              |
| **Husky**               | 9.1.7   | Git hook management                       |
| **Knip**                | 5.41.1  | Dependency analysis and dead code check   |
| **Vite**                | 6.0.3   | Lightning-fast development build tool     |
| **Vitest**              | 2.1.8   | Unit testing                              |
| **Plop.js**             | 4.0.1   | Scaffolding tool for React components     |

For a complete list of dependencies, check the `package.json` file.

## Development Guidelines

### Adding New Features

This project utilizes **Plop.js** to scaffold components. To create a new component, run:

```bash
npm run generate
```

Follow the prompts to auto-generate boilerplate files for the React components:

1. Navigate to the desired directory using the terminal.

2. Run the following command:

   ```bash
   npm run generate
   ```

3. You will be prompted to provide the following inputs:

   - **Component Name**: Enter the name of your new React component, for example.: `Header`

4. Once the inputs are provided, Plop will generate the boilerplate files for your component in the appropriate
   directory under `components/ComponentName/`.

5. Review the generated files and customize them as needed.

This ensures quick creation of React components that follow the project's coding standards and directory structure.

### Linting and Formatting

Run the linting script to check for code issues:

```bash
npm run lint
```

Prettier is configured to auto-format code on save using your IDE. Ensure that your development setup supports Prettier
auto-formatting.

### Running Tests

Use **Vitest** to run tests for your components or business logic:

- Run all tests:

  ```bash
  npm run test
  ```

- Run the Vitest UI for an interactive testing experience:

  ```bash
  npm run test:ui
  ```

### Dependency Analysis with Knip.js

Run Knip.js to check for unused dependencies or dead code in the project. This helps to keep the codebase lean and
clean:

```bash
npm run scan:deadcode
```

### Mocking Data with MSW

This project uses **Mock Service Worker (MSW)** to mock API endpoints during development and testing. MSW ensures
controlled responses and prevents dependency on actual backend services.
See the `src/views/HomeExample/mocks/postsMock.js` as an example.

```bash
npm run dev:mock
```

## Contribution Guidelines

1. Fork the repository and create a new branch for your feature or bugfix.
2. Ensure all changes are tested, formatted, and do not introduce linting errors.
3. Submit a pull request with a clear description of the changes.

## License

This project is licensed under the [MIT License](./LICENSE).

---

Happy Coding! 🎉
