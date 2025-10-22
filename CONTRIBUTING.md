# Contributing to Squoosh Kit

First off, thank you for considering contributing to Squoosh Kit! It's people like you that make open source such a great community. We welcome any and all contributions, from bug reports to feature requests and code patches.

## How Can I Contribute?

### Reporting Bugs

If you find a bug, please open an issue on our GitHub repository. When you are creating a bug report, please include as many details as possible. Fill out the required template, the information it asks for helps us resolve issues faster.

### Suggesting Enhancements

If you have an idea for a new feature or an improvement to an existing one, please open an issue on our GitHub repository. This allows us to discuss the idea and its potential implementation.

### Pull Requests

We love pull requests! If you're planning to contribute code, here's how to get started:

1.  **Fork the repository** and create your branch from `main`.
2.  **Set up your development environment**:
    ```bash
    bun install
    ```
3.  **Make your changes**. Please follow the existing code style.
4.  **Run the validation script** to ensure your changes pass all checks:
    ```bash
    bun run validate
    ```
    This will run TypeScript checks, linting, formatting, tests, and a security audit.
5.  **Commit your changes** using a descriptive commit message that follows the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. This is important because our release process is automated based on these commit messages.
6.  **Open a pull request**. Please provide a clear description of the changes you've made.

## Development Workflow

- **Building the packages**: To build all the packages, run the `build` script from the root of the repository:
  ```bash
  bun run build
  ```
- **Running tests**: To run the test suite, run the `test` script from the root:
  ```bash
  bun run test
  ```

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior.

We are excited to see your contributions!
