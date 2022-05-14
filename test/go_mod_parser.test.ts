import { describe, expect, test } from "@jest/globals";
import { parseDependents } from "../src/go_mod_parser";

/*
Expected dependency tree:

              ---gqt----
             |          |
        commandeer -- cobra
      /     |   \
   viper  pflag  \
     |           inconshreveable
    / \
bbolt  consul-api
*/

const GO_MOD_GRAPH = `github.com/mrysav/gqt github.com/jaffee/commandeer@v0.5.0
github.com/mrysav/gqt github.com/spf13/cobra@v0.0.3
github.com/jaffee/commandeer@v0.5.0 github.com/inconshreveable/mousetrap@v1.0.0
github.com/jaffee/commandeer@v0.5.0 github.com/spf13/cobra@v0.0.3
github.com/jaffee/commandeer@v0.5.0 github.com/spf13/pflag@v1.0.3
github.com/jaffee/commandeer@v0.5.0 github.com/spf13/viper@v1.4.0
github.com/spf13/viper@v1.4.0 github.com/armon/consul-api@v0.0.0-20180202201655-eb2c6b5be1b6
github.com/spf13/viper@v1.4.0 github.com/coreos/bbolt@v1.3.2
`;

describe("test go mod graph dependenciesProcessorFunc", () => {
  test("parses output of go mod graph into dependencies", async () => {
    const dependencies = parseDependents(GO_MOD_GRAPH);

    // Should have 7 total dependencies: 2 direct, 5 indirect
    expect(Object.values(dependencies).length).toEqual(7);

    expect(
      dependencies["pkg:golang/github.com/jaffee/commandeer@v0.5.0"]
        .relationship
    ).toEqual("direct");

    expect(
      dependencies["pkg:golang/github.com/spf13/cobra@v0.0.3"].relationship
    ).toEqual("direct");

    expect(
      dependencies["pkg:golang/github.com/spf13/viper@v1.4.0"].dependencies
    ).toContainEqual(dependencies["pkg:golang/github.com/coreos/bbolt@v1.3.2"]);
  });
});
