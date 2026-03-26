# Pipeline Template Notes

## Suggested Jobs
1. `quality`: lint + typecheck
2. `test`: unit + integration tests
3. `build`: production build for web/api
4. `docker-smoke`: boot compose and hit health endpoint

## Caching
- Cache package manager directories.
- Cache build outputs if framework supports reliable restore keys.

## Fail Fast
- Run lightweight checks first, then heavier integration jobs.
