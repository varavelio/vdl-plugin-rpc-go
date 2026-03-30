package main

import (
	"fmt"
	"os"

	vdltypes "fixture/internal/types"
)

func main() {
	value := vdltypes.Something{Field: "value"}
	if value.Field != "value" {
		panic("field mismatch")
	}

	assertNoGoFiles("internal/client")
	assertNoGoFiles("internal/server")

	fmt.Println("no rpc ok")
}

func assertNoGoFiles(path string) {
	entries, err := os.ReadDir(path)
	if os.IsNotExist(err) {
		return
	}
	if err != nil {
		panic(err)
	}
	for _, entry := range entries {
		panic(fmt.Sprintf("%s should not contain generated files, found %s", path, entry.Name()))
	}
}
