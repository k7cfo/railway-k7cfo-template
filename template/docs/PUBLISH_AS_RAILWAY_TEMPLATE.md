# Publish as a Railway one-click template

First deploy and stabilize the real product repository. In Railway's template publisher, include the web service built from `Dockerfile` and one PostgreSQL service. Reference PostgreSQL's generated connection URL rather than copying it. Generate the Better Auth secret, make public URL variables clear, and mark provider keys optional.

Add plain descriptions for every template variable: purpose, whether required, safe generation method, and expected URL format. Do not hardcode price IDs, credentials, a fake deployment URL, or a deploy button.

Before publishing, instantiate the template in a completely clean Railway project and verify migrations, seed policy, registration, health/readiness, SPA fallback, restart behavior, and every optional-provider disabled state. Publish only after that clean-room test. Once Railway supplies the real template URL, add the real deploy button to the README.
