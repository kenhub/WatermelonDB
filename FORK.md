# Kenhub fork of WatermelonDB

This is Kenhub's fork of [Nozbe/WatermelonDB](https://github.com/Nozbe/WatermelonDB). Upstream has
been dormant since August 2025, so fixes the quiz companion needs land here first and are offered
upstream as pull requests.

## Branches

- `master` mirrors upstream `master`.
- `kenhub` is the integration branch: upstream `master` plus the fixes merged through pull requests
  against it. Nothing is committed to `kenhub` directly; every change is a pull request so Copilot
  reviews it.
- Fixes that are also upstream pull requests keep their own branch (`fix/...`) as the head of the
  upstream PR; the fork-only copy rebuilt on `kenhub` lives under `fork/...`.

## Releasing

The package is published to npm as the private `@kenhub-gmbh/watermelondb`; the repository keeps
upstream's package name so upstream syncs stay conflict-free, and the built `dist/` is renamed at
publish time by `.github/workflows/publish-fork.yml`. To release:

```
git tag kenhub-v0.28.1-kenhub.1
git push origin kenhub-v0.28.1-kenhub.1
```

The version is the tag without the `kenhub-v` prefix: upstream version, then a `-kenhub.N`
prerelease suffix. The workflow needs an `NPM_TOKEN` repository secret with publish rights for the
`kenhub-gmbh` scope.

Consumers install it under the upstream name so imports stay `@nozbe/watermelondb/...`:

```json
"@nozbe/watermelondb": "npm:@kenhub-gmbh/watermelondb@0.28.1-kenhub.1"
```
