# Release workflow

Current version: **1.2.1**.

| Branch | Purpose |
| --- | --- |
| `main` | Main release branch. Changes arrive through pull requests. |
| `release/x.y.z` | Snapshot of the tested code prepared for a specific version, starting with `release/1.0.0`. |
| `dev/golf` | Active development branch. |

Release tags use plain semantic versions such as `1.0.0`, without a `v` prefix, and identify the tested version snapshot.

1. Develop and commit changes on `dev/golf`. Write commit messages and pull requests in English.
2. Update `frontend/package.json`, the root package entries in `frontend/package-lock.json`, and `backend/Directory.Build.props` to the release version.
3. Run backend tests, Gmail setup tests, frontend tests, lint, and a production build.
4. Create `release/x.y.z` and an annotated `x.y.z` tag from the tested release commit, then push both branches and the tag.
5. Open a pull request from `dev/golf` into `main`. Merge after review and CI checks pass. If review changes the release, update its version branch to the final tested commit before merging.
6. Continue development on `dev/golf`.

Do not create a branch named `release`: Git cannot store both `release` and `release/x.y.z`.

This workflow manages Git branches. See [online-deployment.md](online-deployment.md) for the deployed snapshot and hosting configuration.
