# Go Snapshot Action

An Action that creates a dependency submission using `go mod graph`.

Optional inputs for the Action include: `detector-name`, `detector-url`, `detector-version`, and `metadata` - a JSON of max eight keys to provide with the snapshot.

```
name: Run snapshot action
uses: @dsp-testing/go-snapshot-action
with:
    # All of the below have defaults, but can be overriden manually
    detector-name: go snapshot action
    detector-url: ${{ github.server_url }}/${{ github.repository }}
    detector-version: 1.0.0
    metadata: '{"lastModified": "22-04-2022"}'
```
