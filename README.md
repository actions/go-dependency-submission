# Go Dependency Submission

This GitHub Action calculates dependencies for a Go build-target (a Go file with a
`main` function) and submits the list to the [Dependency submission API](https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/using-the-dependency-submission-api). Dependencies then appear in your repository's dependency graph, and you'll receive Dependabot alerts and updates for vulnerable or out-of-date dependencies.

### Running locally

Because we are checking in the Typescript output, you may see check failures if you don't generate the contents of `dist/` in a similar manner to our CI check. You can easily rectify this by regenerating in a codespace and using what we use in our workflow YAML:

```
npm ci --ignore-scripts
npm rebuild && npm run all
```

### Example
```yaml
name: Go Dependency Submission
on:
  push:
    branches:
      - main

# The API requires write permission on the repository to submit dependencies
permissions:
  contents: write

# Environment variables to configure Go and Go modules. Customize as necessary
env:
  GOPROXY: '' # A Go Proxy server to be used
  GOPRIVATE: '' # A list of modules are considered private and not requested from GOPROXY

jobs:
  go-action-detection:
    runs-on: ubuntu-latest
    steps:
      - name: 'Checkout Repository'
        uses: actions/checkout@v3

      - uses: actions/setup-go@v3
        with:
          go-version: ">=1.18.0"

      - name: Run snapshot action
        uses: actions/go-dependency-submission@v2
        with:
            # Required: Define the repo path to the go.mod file used by the
            # build target
            go-mod-path: go-example/go.mod
            #
            # Optional: Define the path of a build target (a file with a
            # `main()` function) If not defined, this Action will collect all
            # dependencies used by all build targets for the module, which may
            # include Go dependencies used by tests and tooling.
            go-build-target: go-example/cmd/octocat.go
```

### Accessing Private Go Modules

This action will fail if your `go.mod` contains private Go modules.
To access private Go modules the action requires an extra step to access your
private module registry.

See official Go documentation for more information at https://go.dev/doc/faq#git_https

#### Accessing Private Go Modules Hosted on GitHub

If your private Go modules are hosted on GitHub, there are various ways for the action to
access them. You can use either HTTPS authentication with a Personal Access Token (PAT) or SSH authentication with deploy keys or SSH keys.

#### Authentication Methods

**HTTPS with Personal Access Token**: Uses a GitHub Personal Access Token to authenticate with private repositories. This method requires storing the token as a repository secret. See [Creating a personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic) for setup instructions.

**SSH Authentication**: Uses SSH keys or deploy keys for authentication. This method doesn't require storing tokens and can be more secure for some use cases. See the [GitHub documentation on SSH authentication](https://docs.github.com/en/authentication/connecting-to-github-with-ssh) for setup instructions.

#### Additional Environment Variables

- **`GONOPROXY`**: Set this to bypass the module proxy entirely for specific modules
- **`GOSUMDB`**: Set to `off` or configure to skip checksum verification for private modules
- **`GOPROXY`**: Can be set to `direct` to bypass proxies completely

#### Example: HTTPS Authentication with Personal Access Token

This example adds a step to the workflow which uses a GitHub
[Personal Access Token (PAT)](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
which has repo permissions. The PAT is saved as a repo [actions secret](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions) `GH_ACCESS_TOKEN`.

The env variable `GOPRIVATE` has also been set so that the GitHub org `foo` is considered private.

```yaml
name: Go Dependency Submission
on:
  push:
    branches:
      - main

# The API requires write permission on the repository to submit dependencies
permissions:
  contents: write

# Environment variables to configure Go and Go modules. Customize as necessary
env:
  GOPROXY: 'https://proxy.golang.org,direct' # To add a private proxy, place it between the public golang proxy and direct
  GOPRIVATE: 'github.com/foo/*' # repositories in organization foo are considered private

jobs:
  go-action-detection:
    runs-on: ubuntu-latest
    steps:
      - name: 'Checkout Repository'
        uses: actions/checkout@v3

      - uses: actions/setup-go@v3
        with:
          go-version: ">=1.18.0"

      # Authentication step
      - name: Authenticate with GitHub
        run: git config --global url.https://${{ secrets.GH_ACCESS_TOKEN }}@github.com/.insteadOf https://github.com/

      - name: Run snapshot action
        uses: actions/go-dependency-submission@v2
        with:
            # Required: Define the repo path to the go.mod file used by the
            # build target
            go-mod-path: go-example/go.mod
            #
            # Optional: Define the path of a build target (a file with a
            # `main()` function) If not defined, this Action will collect all
            # dependencies used by all build targets for the module, which may
            # include Go dependencies used by tests and tooling.
            go-build-target: go-example/cmd/octocat.go
```
