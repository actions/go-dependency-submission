import { parseGoPackage, parseGoList, parseGoModGraph } from './parse'

const GO_DEPENDENCIES = `go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp@v1.7.0
golang.org/x/sys@v0.0.0-20220317061510-51cd9980dadf
golang.org/x/text@v0.3.7
golang.org/x/text@v0.3.7
golang.org/x/text@v0.3.7`

describe('parseGoPackage', () => {
  it('parses a package with a namespace', () => {
    expect(parseGoPackage('foo/bar@0.1.2').toString()).toEqual(
      'pkg:golang/foo/bar@0.1.2'
    )
  })
  // this test should pass, but packageurl-js is double URL-safe encoding the
  // '%' to %25. It won't, however, URL-encode the  '/' that is represented by
  // %2F.
  it.skip('parses a package with a namespace with slashes', () => {
    expect(parseGoPackage('foo/boo/bar@0.1.2').toString()).toEqual(
      'pkg:golang/foo%2Fboo/bar@0.1.2'
    )
  })
  it('parses a package without a namespace', () => {
    expect(parseGoPackage('foo.io@0.1.2').toString()).toEqual(
      'pkg:golang/foo.io@0.1.2'
    )
  })
})

describe('parseGoList', () => {
  test('parses output of go list command into dependencies', () => {
    const dependencies = parseGoList(GO_DEPENDENCIES)

    expect(Object.values(dependencies).length).toEqual(3)
    expect(dependencies).toEqual([
      {
        type: 'golang',
        name: 'otlptracehttp',
        namespace: 'go.opentelemetry.io%2Fotel%2Fexporters%2Fotlp%2Fotlptrace',
        version: 'v1.7.0',
        qualifiers: null,
        subpath: null
      },
      {
        type: 'golang',
        name: 'sys',
        namespace: 'golang.org%2Fx',
        version: 'v0.0.0-20220317061510-51cd9980dadf',
        qualifiers: null,
        subpath: null
      },
      {
        type: 'golang',
        name: 'text',
        namespace: 'golang.org%2Fx',
        version: 'v0.3.7',
        qualifiers: null,
        subpath: null
      }
    ])
  })
})

describe('parseGoModGraph', () => {
  test('parses root module and dependency', () => {
    const assocList = parseGoModGraph(
      'go-example github.com/fatih/color@v1.13.0'
    )
    expect(assocList).toHaveLength(1)
    expect(assocList[0][0]).toEqual({
      type: 'golang',
      name: 'go-example',
      namespace: null,
      version: null,
      qualifiers: null,
      subpath: null
    })
  })

  test('parses dependencies dependency', () => {
    const assocList =
      parseGoModGraph(`github.com/fatih/color@v1.13.0 github.com/mattn/go-isatty@v0.0.14
github.com/mattn/go-colorable@v1.1.9 github.com/mattn/go-isatty@v0.0.12`)
    expect(assocList).toHaveLength(2)

    expect(assocList).toEqual([
      [
        {
          type: 'golang',
          name: 'color',
          namespace: 'github.com%2Ffatih',
          version: 'v1.13.0',
          qualifiers: null,
          subpath: null
        },
        {
          type: 'golang',
          name: 'go-isatty',
          namespace: 'github.com%2Fmattn',
          version: 'v0.0.14',
          qualifiers: null,
          subpath: null
        }
      ],
      [
        {
          type: 'golang',
          name: 'go-colorable',
          namespace: 'github.com%2Fmattn',
          version: 'v1.1.9',
          qualifiers: null,
          subpath: null
        },
        {
          type: 'golang',
          name: 'go-isatty',
          namespace: 'github.com%2Fmattn',
          version: 'v0.0.12',
          qualifiers: null,
          subpath: null
        }
      ]
    ])
  })
})
