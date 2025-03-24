## Contributing

[fork]: https://github.com/github/go-dependency-submission/fork
[pr]: https://github.com/github/go-dependency-submission/compare
[style]: https://github.com/styleguide/ruby
[code-of-conduct]: CODE_OF_CONDUCT.md

Hi there! We're thrilled that you'd like to contribute to this project. Your help is essential for keeping it great.

Contributions to this project are [released](https://help.github.com/articles/github-terms-of-service/#6-contributions-under-repository-license) to the public under the [project's open source license](LICENSE.md).

Please note that this project is released with a [Contributor Code of Conduct][code-of-conduct]. By participating in this project you agree to abide by its terms.

## Submitting a pull request

0. [Fork][fork] and clone the repository
0. Configure and install the dependencies: `script/bootstrap`
0. Make sure the tests pass on your machine: `rake`
0. Create a new branch: `git checkout -b my-branch-name`
0. Make your change, add tests, and make sure the tests still pass
0. Push to your fork and [submit a pull request][pr]
0. Pat your self on the back and wait for your pull request to be reviewed and merged.

Here are a few things you can do that will increase the likelihood of your pull request being accepted:

- Follow the [style guide][style].
- Write tests.
- Keep your change as focused as possible. If there are multiple changes you would like to make that are not dependent upon each other, consider submitting them as separate pull requests.
- Write a [good commit message](http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html).

## Cutting a new release

<details>

_Note: these instructions are for maintainers_

1. Update the version number in [package.json](https://github.com/actions/go-dependency-submission/blob/main/package.json) and run `npm i` to update the lockfile.
1. Go to [Draft a new
   release](https://github.com/actions/go-dependency-submission/releases/new)
   in the Releases page.
1. Make sure that the `Publish this Action to the GitHub Marketplace`
   checkbox is enabled

<img width="481" alt="Screenshot 2022-06-15 at 12 08 19" src="https://user-images.githubusercontent.com/2161/173822484-4b60d8b4-c674-4bff-b5ff-b0c4a3650ab7.png">

3. Click "Choose a tag" and then "Create new tag", where the tag name
   will be your version prefixed by a `v` (e.g. `v1.2.3`).
4. Use a version number for the release title (e.g. "1.2.3").

<img width="700" alt="Screenshot 2022-06-15 at 12 08 36" src="https://user-images.githubusercontent.com/2161/173822548-33ab3432-d679-4dc1-adf8-b50fdaf47de3.png">

5. Add your release notes. If this is a major version make sure to
   include a small description of the biggest changes in the new version.
6. Click "Publish Release".

You now have a tag and release using the semver version you used
above. The last remaining thing to do is to move the dynamic version
identifier to match the current SHA. This allows users to adopt a
major version number (e.g. `v1`) in their workflows while
automatically getting all the
minor/patch updates.

To do this just checkout `main`, force-create a new annotated tag, and push it:

```
git tag -fa v2 -m "Updating v2 to 2.0.1"
git push origin v2 --force
```
</details>

## Resources

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [Using Pull Requests](https://help.github.com/articles/about-pull-requests/)
- [GitHub Help](https://help.github.com)
