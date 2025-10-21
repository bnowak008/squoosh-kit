# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do NOT create a public GitHub issue

Security vulnerabilities should be reported privately to avoid exposing users to potential attacks.

### 2. Report via email

Send an email to [bnowak008@gmail.com](mailto:bnowak008@gmail.com) with the following information:

- **Subject**: `[SECURITY] @squoosh-kit/core vulnerability report`
- **Description**: Detailed description of the vulnerability
- **Steps to reproduce**: Clear steps to reproduce the issue
- **Impact**: Potential impact of the vulnerability
- **Suggested fix**: If you have a suggested fix (optional)

### 3. What to expect

- **Acknowledgment**: You will receive an acknowledgment within 48 hours
- **Assessment**: We will assess the vulnerability within 5 business days
- **Fix timeline**: Critical vulnerabilities will be fixed within 7 days
- **Disclosure**: We will coordinate disclosure with you

## Security Considerations

### WebAssembly Security

This package uses WebAssembly (WASM) modules from the Squoosh project. These modules:

- Are compiled from Rust source code
- Run in a sandboxed environment
- Cannot access the file system or network directly
- Are validated against known-good checksums

### Data Handling

- **No data persistence**: The package does not store or transmit user data
- **Local processing**: All image processing happens locally
- **Memory management**: Proper cleanup of WASM instances

### Dependencies

We maintain a strict dependency policy:

- **Minimal dependencies**: Only essential dependencies are included
- **Regular updates**: Dependencies are updated regularly
- **Security audits**: All dependencies are audited for vulnerabilities
- **Lock files**: Exact versions are locked to prevent supply chain attacks

## Security Best Practices

### For Users

1. **Keep updated**: Always use the latest version of the package
2. **Validate inputs**: Validate image data before processing
3. **Resource limits**: Set appropriate memory and CPU limits
4. **Error handling**: Implement proper error handling for WASM operations

### For Contributors

1. **Code review**: All code changes require review
2. **Security testing**: Security tests are included in CI/CD
3. **Dependency updates**: Dependencies are updated regularly
4. **Vulnerability scanning**: Automated vulnerability scanning in CI/CD

## Security Features

### Built-in Protections

- **Type safety**: Full TypeScript support prevents type-related vulnerabilities
- **Input validation**: Built-in validation for image data and options
- **Memory safety**: WASM modules provide memory-safe execution
- **Error boundaries**: Proper error handling prevents crashes

### Runtime Security

- **Worker isolation**: Heavy processing runs in Web Workers
- **Resource limits**: Built-in resource management
- **Abort signals**: Support for canceling long-running operations
- **Memory cleanup**: Automatic cleanup of WASM instances

## Incident Response

### Security Incident Process

1. **Detection**: Automated monitoring and manual reports
2. **Assessment**: Impact and severity evaluation
3. **Containment**: Immediate mitigation if possible
4. **Investigation**: Root cause analysis
5. **Recovery**: Fix deployment and verification
6. **Lessons learned**: Process improvement

### Communication

- **Internal**: Immediate notification to maintainers
- **Users**: Coordinated disclosure timeline
- **Public**: Security advisory when appropriate

## Security Tools

### Automated Scanning

- **Dependency audit**: `bun audit`
- **Code analysis**: ESLint security rules
- **Build validation**: Automated build artifact verification
- **WASM validation**: Checksum verification of WASM files

### Manual Testing

- **Penetration testing**: Regular security assessments
- **Code review**: Security-focused code reviews
- **Threat modeling**: Regular threat model updates

## Contact

For security-related questions or concerns:

- **Email**: [bnowak008@gmail.com](mailto:bnowak008@gmail.com)
- **GitHub**: [@bnowak008](https://github.com/bnowak008)
- **Issues**: Use private security reporting (see above)

## Acknowledgments

We thank the security researchers and community members who help keep this project secure through responsible disclosure and security best practices.
