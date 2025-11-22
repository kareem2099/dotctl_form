# Contributing to DotCtl Form

Thank you for your interest in contributing to the DotCtl Form project! We welcome contributions from the community to help improve and grow this referral management application.

## How to Contribute

### 1. Local Development Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/dotctl_form.git
   cd dotctl_form
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up your environment:
   ```bash
   cp .env.example .env.local
   ```
   Configure the environment variables as described in the README.

5. Set up the database and run initial setup:
   ```bash
   # Ensure MongoDB and Redis are running
   npm run setup-admin
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

### 2. Development Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes with clear, descriptive commits:
   ```bash
   git commit -m "Add: descriptive commit message"
   ```

   Commit message format:
   - `Add:` for new features
   - `Fix:` for bug fixes
   - `Update:` for improvements or refactoring
   - `Remove:` for removed features

3. Write tests if applicable (API routes, utility functions)
4. Ensure all tests pass: `npm run lint`

### 3. Code Style and Standards

- Follow TypeScript best practices
- Use ESLint configuration for code formatting
- Maintain consistent naming conventions (camelCase for variables, PascalCase for components)
- Add JSDoc comments for complex functions
- Keep functions small and focused on single responsibilities

### 4. Pull Request Process

1. Ensure your branch is up-to-date with the latest `main`
2. Push your changes to your fork
3. Create a Pull Request (PR) on GitHub with:
   - Clear title describing the change
   - Detailed description of what was changed and why
   - Screenshots if the changes affect UI
   - Reference any related issues

4. Wait for code review and address any feedback
5. Once approved, your PR will be merged

### 5. Reporting Issues

If you find bugs or have feature requests:

1. Check existing issues to avoid duplicates
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)
   - Screenshots if applicable

### 6. Code of Conduct

Please maintain a respectful and inclusive environment. Harassment or discriminatory behavior will not be tolerated.

## Areas for Contribution

- Bug fixes and performance improvements
- New features for the referral system
- UI/UX enhancements
- Additional language translations
- Documentation improvements
- Tests and testing infrastructure

## Need Help?

- Join our discussions on GitHub Issues
- Check the README.md for setup and usage instructions
- Browse existing code and tests for examples

