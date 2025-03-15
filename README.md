# TypeScript React Starter [Redux / Tanstack Query / Mock Service Worker]

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Overview

A modern React starter kit with TypeScript, Redux, Tanstack Query, and Mock Service Worker, optimized for fast
development with Vite.

![React](https://user-images.githubusercontent.com/74038190/212257467-871d32b7-e401-42e8-a166-fcfd7baa4c6b.gif)

## Requirements

- **Node.js** ~^v23.x.x
  - If you are using `nvm`, the project includes an `.nvmrc` file, so you can run:
  ```bash
    nvm use
  ```
- **NPM** ~^v10.x.x

## Features

- **Vite** for blazing-fast development and build optimizations.
- **React & Redux** for state management and UI rendering.
- **React Router DOM** for routing.
- **Axios** for HTTP requests.
- **React Query** integration for server state management.
  - Integration with **React Query Devtools** for debugging server state.
  - Scalable architecture with Redux.
- **ESLint** and **Prettier** for maintaining code quality and style consistency.
- **SASS Embedded** for advanced styling capabilities.
- **Husky** for Git hook management.
- **Knip** for dependency analysis and dead code detection.
- **Vitest** for testing and test-driven development.
- **Plop.js** for component and file scaffolding.
- Mocking with **MSW** (Mock Service Worker).
  - Built-in testing & API mocking with MSW.

## Installation

To set up the project locally, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/dsvjetl/react-redux-tanstack-msw-ts-starter <new_project_name>
   cd <new_project_name>
   ```

   - Or `Use this template` on the GitHub repository page.

2. (Optional If you are using `nvm`) Switch to the project Node.js version:

   ```bash
   nvm use
   ```

3. Install dependencies using `npm`:

   ```bash
   npm install
   ```

4. Set up Husky hooks:

   ```bash
   npm run prepare
   ```

5. Copy the environment variables file:

   ```bash
   cp .env.example .env.local
   cp .env.example .env.production
   ```

6. Start the development server:

   ```bash
   npm run dev
   ```

7. Open the project in your browser at `http://localhost:5173` (default port for Vite).

## .env files

`.env.example` includes `VITE_API_BASE_URL=https://jsonplaceholder.typicode.com`, which is a dummy endpoint for
showcasing.

`VITE_API_BASE_URL` should be updated with the desired endpoint URL, and you can add more `.env` variables as long as
they start with `VITE_API`.

**`VITE_API_MOCK=false` should be present in the `.env` files** so the MSW script
`"dev:mock": "VITE_API_MOCK=true vite"`
can work properly.

## Example files - how to handle

**The project uses examples** to showcase to developers how to use them:

- `src/views/HomeExample`
- `src/shared/components/HeaderExample`

These examples are connected to:

- `src/store/todoSlice.ts`
- `src/routing/Routes.tsx`

**Delete or refactor example files to start the project from scratch.**

## Project Structure

```plaintext
.
├── src/
│   ├── shared/          # Reusable React components, services, utils, etc.
│   ├── views/           # Page-level React components (Check HomeExample component for more info)
│   ├── store/           # Redux store
│   ├── routing/         # React Router configuration and route definitions
│   ├── assets/          # Multimedia files and styling assets (e.g., images, fonts)
│   ├── mocks/           # Mock Service Worker configuration and mock data
│   ├── hooks/           # Custom React hooks
│   ├── queries/         # React Query client and query definitions
│   └── App.tsx          # Main application entry point
├── public/              # Static assets (e.g., index.html, images) & mockServiceWorker.js
├── plop-templates/      # Templates for Plop.js scaffolding
├── .env.example         # Example environment variables file
├── .gitignore           # Git ignore rules
├── .nvmrc               # Node.js version configuration
├── .prettierignore      # Prettier ignore rules
├── .prettierrc          # Prettier additional configuration
├── eslint.config.js     # ESLint configuration
├── index.html           # Main HTML entry point
├── LICENSE              # Project license
├── plopfile.cjs         # Plop.js configuration for scaffolding
├── README.md            # Documentation
├── tsconfig.json        # TypeScript configuration file
├── vite.config.ts       # Vite configuration
└── vitest.setup.ts      # Vitest configuration
```

Folder structure example:
![Imgur](https://i.imgur.com/MYJpgKa.png)

## Scripts

Below are the standard scripts defined in the `package.json`:

- **Switch to the project Node.js version:**

  ```bash
  nvm use
  ```

- **Start the development server:**

  ```bash
  npm run dev
  ```

- **Start the mock (MSW) server:**

  ```bash
  npm run dev:mock
  ```

- **Create a production build:**

  ```bash
  npm run build
  ```

- **Preview the production build locally:**

  ```bash
  npm run preview
  ```

- **Run unit and integration tests:**

  ```bash
  npm run test
  ```

- **Run tests in watch mode:**

  ```bash
  npm run test:watch
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

## Husky commit checks

Husky is configured so you can commit only if ESLint and Prettier checks pass.

**Unit tests are not required for Husky checks** because of:

- Faster development cycle
- Testing can be postponed
- Encouraging developer autonomy
- Overhead in small projects

## Libraries and Tools

| Library/Tool             | Version | Use Case                                  |
| ------------------------ | ------- | ----------------------------------------- |
| **React**                | 19.0.0  | UI rendering                              |
| **React Redux**          | 9.2.0   | State management                          |
| **React Router DOM**     | 7.0.2   | Client-side routing                       |
| **Axios**                | 1.7.9   | HTTP requests                             |
| **React Query**          | 5.62.8  | Server state management                   |
| **React Query Devtools** | 5.62.8  | Debugging server state in React Query     |
| **ESLint**               | 8.57.1  | Error prevention and code standardization |
| **Prettier**             | 3.4.2   | Code formatting                           |
| **SASS Embedded**        | 1.83.0  | Advanced CSS styling                      |
| **Mock Service Worker**  | 2.7.0   | API data mocking for testing              |
| **Husky**                | 9.1.7   | Git hook management                       |
| **Knip**                 | 5.41.1  | Dependency analysis and dead code check   |
| **Vite**                 | 6.0.3   | Lightning-fast development build tool     |
| **Vitest**               | 2.1.8   | Unit testing                              |
| **Plop.js**              | 4.0.1   | Scaffolding tool for React components     |
| **TypeScript**           | 5.7.3   | Static type checking and JS enhancement   |

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

   - **Component Name**: Enter the name of your new React component, for example: `Header`

4. Once the inputs are provided, Plop will generate the boilerplate files for your component in the appropriate
   directory under `components/ComponentName/`.

5. Review the generated files and customize them as needed.

This ensures the quick creation of React components that follow the project's coding standards and directory structure.

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
controlled responses and eliminates dependency on actual backend services.
See `src/views/HomeExample/mocks/postsMock.ts` and `src/mocks/handlers.ts` for examples.

```bash
npm run dev:mock
```

## Who is this Starter Kit for?

- Developers who want to build fast and stable React SPA applications with modern tools and features (no SSR).
  - SSR (Server-Side Rendering) can be implemented manually if needed.

## Contribution Guidelines

1. Fork the repository and create a new branch for your feature or bug fix.
2. Ensure all changes are tested, formatted, and do not introduce linting errors.
3. Submit a pull request with a clear description of the changes.

## License

This project is licensed under the [MIT License](./LICENSE).

---

**🎯 Want to get started quickly? Fork the repo and launch your project in under 2 minutes! 🚀**

---

Happy Coding! 🎉
