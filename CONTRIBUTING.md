# Contributing

Thanks for your interest in **ts-scope-trimmer-plugin**! We'd love your help to make it better. Here's how you can get involved:

- **Create an Issue**: spot a bug? Have an idea for a new feature? Let us know by creating an issue.
- **Submit a Pull Request**: found something to fix or improve? Jump in and submit a PR!
- **Spread the word**: share your experience with our TS plugin on social media, blogs, or with your tech community.

## Development

1. Create a fork of the repository.
2. Create a new branch for your changes.
3. Run `nvm use` to use the correct Node.js version.
4. Run `npm ci` to install dependencies.
5. Run `npm run dev` to build the plugin and run the watcher.
6. Make your changes.
7. Test your changes by [linking](https://docs.npmjs.com/cli/v11/commands/npm-link) the local plugin to any TS project ([monorepo example](https://github.com/voronin-ivan/large-monorepo)). Adding `debug: true` to plugin config extends tsserver logs (example on how to get them in [VSCode](https://github.com/microsoft/TypeScript/wiki/Getting-logs-from-TS-Server-in-VS-Code)).
8. Run `npm run format:check` to check formatting of the code. In case of errors, run `npm run format:write` to fix them.
9. Push your changes and create a PR to this repository.
10. Wait for the feedback.

## Releasing

Releasing new versions is automated by [changesets](https://github.com/changesets/changesets). To create a new version, add and push a changeset file by running `npx @changesets/cli`. After merging it to the main branch, the new version will be automatically published to npm, along with updating the changelog.

Maintainers will also [create a new release on GitHub](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository#creating-a-release).

---

### Thank you for contributing ❤️
