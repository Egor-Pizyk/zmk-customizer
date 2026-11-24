# Publish and build on GitHub

In **Export → GitHub firmware**, sign in, grant the app access to a repository and choose its branch. You can also create a repository under your GitHub account. A new repository is private by default and is initialized with a README.

**Review commit** shows every file that will be added or replaced. Confirm to publish the configuration and the editable project in one commit. New build repositories receive the pinned ZMK v0.3 workflow. Existing workflows are preserved by default. If a branch moves before confirmation, review the files again.

GitHub Actions builds the published commit. Use **Refresh builds** to check progress and open the firmware artifact after success. GitHub may require you to sign in to download private artifacts. An existing workflow must be enabled and configured to build pushes to the chosen branch.

**Open project from GitHub** loads the project snapshot previously published by ZMK Customizer. Opening is undoable. Repositories containing only handwritten ZMK source can be publication destinations. Opening a schematic requires the published `.zmk-customizer/project.json` snapshot.

## Configure a deployment

1. [Register a GitHub App](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app) with the ZMK Customizer site as its homepage and callback. Use the actual URL, including its base path and trailing slash if applicable. Disable webhooks. In the app’s repository permissions, grant **Contents** and **Workflows** write, **Actions** read and **Repository creation** write. Metadata read is automatic. Make the app installable by the intended GitHub accounts.
2. Run `node infra/github-auth/server.mjs` with Node 24 and the environment variables below. Serve it over HTTPS through your existing service host or reverse proxy. Its routes are `GET /config` and `POST /token`.
3. Build the frontend with `VITE_GITHUB_AUTH_URL` pointing to the auth service base URL without a trailing slash, and `VITE_GITHUB_APP_SLUG` set to the registered app's URL slug. Both values are public build configuration. If the frontend sends a Content Security Policy, allow connections to the auth origin and `https://api.github.com`. The bundled production Docker image takes the two Vite values as build arguments and the two allowed origins as its runtime `ZMK_CONNECT_SOURCES` value, for example `https://api.github.com https://auth.example.com`.

| Service variable | Value |
| --- | --- |
| `GITHUB_CLIENT_ID` | The GitHub App client ID |
| `GITHUB_CLIENT_SECRET` | The GitHub App client secret. Set it only on the server. |
| `GITHUB_CALLBACK_URL` | The registered full frontend URL |
| `HOST` | Bind address. Defaults to `127.0.0.1`. |
| `PORT` | Bind port. Defaults to `8787`. |

For local development, register the local frontend URL as the callback and use `http://127.0.0.1:8787` as the auth service base URL. Use the same frontend hostname in the browser and in the callback. Sign-in lasts for the current page session. The GitHub token is cleared when you sign out or reload.
