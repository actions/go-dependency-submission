import { describe, expect, test } from '@jest/globals'
import { parseDependents } from '../src/parse-go-package'

const GO_DEPENDENCIES = `go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp@v1.7.0
golang.org/x/sys@v0.0.0-20220317061510-51cd9980dadf
golang.org/x/text@v0.3.7
golang.org/x/text@v0.3.7
golang.org/x/text@v0.3.7`

describe('test dependenciesProcessorFunc', () => {
  test('parses output of go list command into dependencies', () => {
    const dependencies = parseDependents(GO_DEPENDENCIES)

    expect(Object.values(dependencies).length).toEqual(3)
    expect(dependencies).toEqual(
      {
        'pkg:golang/go.opentelemetry.io%2Fotel%2Fexporters%2Fotlp%2Fotlptrace/otlptracehttp@v1.7.0': {
          package_url: 'pkg:golang/go.opentelemetry.io%2Fotel%2Fexporters%2Fotlp%2Fotlptrace/otlptracehttp@v1.7.0',
          name: 'pkg:golang/go.opentelemetry.io%2Fotel%2Fexporters%2Fotlp%2Fotlptrace/otlptracehttp',
          version: 'v1.7.0',
          dependencies: []
        },
        'pkg:golang/golang.org%2Fx/sys@v0.0.0-20220317061510-51cd9980dadf': {
          package_url: 'pkg:golang/golang.org%2Fx/sys@v0.0.0-20220317061510-51cd9980dadf',
          name: 'pkg:golang/golang.org%2Fx/sys',
          version: 'v0.0.0-20220317061510-51cd9980dadf',
          dependencies: []
        },
        'pkg:golang/golang.org%2Fx/text@v0.3.7': {
          package_url: 'pkg:golang/golang.org%2Fx/text@v0.3.7',
          name: 'pkg:golang/golang.org%2Fx/text',
          version: 'v0.3.7',
          dependencies: []
        }
      }
    )
  })
})
