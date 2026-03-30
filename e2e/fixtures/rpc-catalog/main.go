package main

import (
	"fmt"
	"os"

	rpcclient "fixture/internal/client"
)

func main() {
	if rpcclient.VDLPaths.MyService.MyProc != "/MyService/myProc" {
		fail("VDLPaths.MyService.MyProc", "/MyService/myProc", rpcclient.VDLPaths.MyService.MyProc)
	}
	if rpcclient.VDLPaths.MyService.MyStream != "/MyService/myStream" {
		fail("VDLPaths.MyService.MyStream", "/MyService/myStream", rpcclient.VDLPaths.MyService.MyStream)
	}

	var foundProc bool
	for _, operation := range rpcclient.VDLProcedures {
		if operation.RPCName == "MyService" && operation.Name == "myProc" {
			foundProc = true
			if operation.Path() != "/MyService/myProc" {
				fail("VDLProcedures Path()", "/MyService/myProc", operation.Path())
			}
		}
	}
	if !foundProc {
		fmt.Fprintln(os.Stderr, "myProc not found in VDLProcedures")
		os.Exit(1)
	}

	var foundStream bool
	for _, operation := range rpcclient.VDLStreams {
		if operation.RPCName == "MyService" && operation.Name == "myStream" {
			foundStream = true
			if operation.Path() != "/MyService/myStream" {
				fail("VDLStreams Path()", "/MyService/myStream", operation.Path())
			}
		}
	}
	if !foundStream {
		fmt.Fprintln(os.Stderr, "myStream not found in VDLStreams")
		os.Exit(1)
	}

	fmt.Println("rpc catalog ok")
}

func fail(name string, expected string, actual string) {
	fmt.Fprintf(os.Stderr, "%s mismatch: expected %q, got %q\n", name, expected, actual)
	os.Exit(1)
}
