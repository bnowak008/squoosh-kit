# @squoosh-kit/runtime

This package contains the core runtime logic for `squoosh-kit`, including the worker bridge, environment utilities, and worker communication helpers. It is an internal package and not intended for direct use by end-users.

## Features

- **Worker Bridge**: An abstraction layer that allows image processing to be offloaded to a separate worker thread, preventing the main thread from being blocked.
- **Environment Utilities**: Functions to detect the current execution environment (e.g., worker vs. client).
- **Worker Communication**: A standardized request/response mechanism for communicating between the main thread and worker threads.

## API

This package provides low-level APIs that are consumed by the feature packages (e.g., `@squoosh-kit/webp`). Refer to the source code for detailed API information.

## License

MIT
