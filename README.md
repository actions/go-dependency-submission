# Go Snapshot Action

An action that creates a dependency submission using `go mod graph`.

To configure, you'll need to provide a GitHub token. Additional optional inputs include: `detector-name`, `detector-url`, `detector-version`, and `metadata` - a JSON of max eight keys to provide with the snapshot. 

```
name: Run snapshot action
uses: ./go-snapshot-action
with:
    token: ${{ secrets.GITHUB_TOKEN }}
    detector-name: go snapshot action
    detector-url: ${{ github.server_url }}/${{ github.repository }}
    detector-version: 1.0.0
    metadata: '{"lastModified": "22-04-2022"}'
```