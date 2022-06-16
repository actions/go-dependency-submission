# Go Dependency Submission

This GitHub Action calculates dependencies for a Go build-target (a Go file with a
`main` function) and submits the list to the [Dependency submission API](https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/using-the-dependency-submission-api). Dependencies then appear in your repository's dependency graph, and you'll receive Dependabot alerts and updates for vulnerable or out-of-date dependencies. 

### Example
```yaml
name: Go Dependency Submission
on:
  push:
    branches:
      - main
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
        uses: actions/go-dependency-submission@main
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
