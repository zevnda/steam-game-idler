# Contribution Guidelines

## Commit Message Format

```
<type>(<scope>): <short summary>
  │       │             │
  │       │             └─⫸ Summary in present tense, not capitalized, no period at the end
  │       │
  │       └─⫸ Commit Scope: tauri|states|games-list|card-farming|achievement-unlocker|achievement-manager|
  │                          auto-idle|settings|components|hooks|ui|utils|types|cache|config|i18n|
  │                          deps|readme|changelog                         
  │
  └─⫸ Commit Type: fix|feat|chore|refactor|libs|docs|ci|config|build|perf
```
The `type` and `summary` fields are mandatory, the `scope` field is optional

### Type
Must be one of the following:

| Type         | Description                                                                                |
| ------------ | ------------------------------------------------------------------------------------------ |
| **fix**      | A bug fix                                                                                  |
| **feat**     | A new feature                                                                              |
| **chore**    | Grunt tasks, no production code change (e.g.: formatting fixes, commenting code)           |
| **refactor** | A code change that neither fixes a bug nor adds a feature                                  |
| **libs**     | Changes to /libs files                                                                     |
| **docs**     | Documentation only changes (e.g.: changes to /docs .mdx files, README.md, CONTRIBUTING.md) |
| **ci**       | Changes to our CI configuration files and scripts such as GitHub Actions                   |
| **config**   | Changes to configuration files (e.g.: tauri.config.json, next.config.json, tsconfig.json)  |
| **build**    | Changes that affect the build system or external dependencies                              |
| **perf**     | A code change that improves performance                                                    |

### Scope
Common scopes for this project include:

| Scope                    | Description                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| **tauri**                | Changes to Tauri's backend with reference to files changed (e.g.: tauri-utils, tauri-idling) |
| **games-list**           | Changes to the games list components and hooks                                               |
| **card-farming**         | Changes to the card farming components and hooks                                             |
| **achievement-unlocker** | Changes to the achievement unlocker components and hooks                                     |
| **achievement-manager**  | Changes to the achievement manager components and hooks                                      |
| **trading-card-manager** | Changes to the trading card manager components and hooks                                     |
| **auto-idle**            | Changes to the auto-idle components and hooks                                                |
| **chat**                 | Changes to the chat components and hooks                                                     |
| **automation**           | Changes that affect multiple automation features (e.g.: card farming, achievement unlocker)  |
| **settings**             | Changes to the settings components and hooks                                                 |
| **states**               | Changes to nextjs frontend global contexts                                                   |
| **components**           | Changes to other components that are not already listed                                      |
| **hooks**                | Changes to other component hooks that are not already listed                                 |
| **ui**                   | Non-specific user interface changes (e.g.: themes, tailwind classes, button labels)          |
| **utils**                | Utility functions and helper methods                                                         |
| **types**                | TypeScript type definitions and interfaces                                                   |
| **cache**                | Application data storage                                                                     |
| **i18n**                 | Internationalization and localization changes                                                |
| **deps**                 | Updates to dependencies (Rust, Tauri, pnpm, .NET)                                            |
| **readme**               | Updates to the README file                                                                   |
| **changelog**            | Updates to the CHANGELOG file                                                                |

### Examples
```
fix(tauri-process-handler): resolve issue with game process detection

fix(games-list): resolve issue with game thumbnails not loading

feat(ui): implement dark mode support

perf(achievement-manager): optimize loading of achievement data

docs: update installation instructions

build(deps): update tauri shell plugin to latest
```

## Versioning
When to bump version numbers:

| Type  | Description                                                                                      |
| ----- | ------------------------------------------------------------------------------------------------ |
| Major | Breaking changes (steam API changes, UI overhauls, removed functionality)                        |
| Minor | New major features or functionality added or removed in a backwards compatible manner            |
| Patch | Backwards compatible bug fixes, performance improvements, UI adjustments, and new minor features |
