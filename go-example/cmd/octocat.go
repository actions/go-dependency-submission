package main

import (
	"github.com/fatih/color"
)

func main() {
	c := color.New(color.FgCyan).Add(color.Underline).Add(color.BgHiMagenta)
	c.Println("Octocats forever!")
}
