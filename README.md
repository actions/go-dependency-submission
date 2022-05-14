# Go Snapshot Action

An Action that creates a dependency submission using `go mod graph`.

Optional inputs for the Action include: `detector-name`, `detector-url`, `detector-version`, and `metadata` - a JSON of max eight keys to provide with the snapshot.

### Example
```
name: Go Action detection of dependencies
on:
  push:
    branches:
      - main
# Envionment variables to configure Go and Go modules. Customize as necessary
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
        uses: @dsp-testing/go-snapshot-action
        with:
            # All of the below have defaults, but can be overriden manually
            detector-name: go snapshot action
            detector-url: ${{ github.server_url }}/${{ github.repository }}
            detector-version: 1.0.0
            metadata: '{"lastModified": "22-04-2022"}'
```
