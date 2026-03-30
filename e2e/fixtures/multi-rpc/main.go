package main

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"

	rpcclient "fixture/internal/client"
	rpcserver "fixture/internal/server"
	vdltypes "fixture/internal/types"
)

func main() {
	calledA := false
	calledB := false

	server := rpcserver.NewServer[struct{}]()
	server.RPCs.A().Procs.X().Handle(func(c *rpcserver.AXHandlerContext[struct{}]) (vdltypes.AXOutput, error) {
		if calledA {
			panic("rpc a called multiple times")
		}
		calledA = true
		return vdltypes.AXOutput{}, nil
	})
	server.RPCs.B().Procs.Y().Handle(func(c *rpcserver.BYHandlerContext[struct{}]) (vdltypes.BYOutput, error) {
		if calledB {
			panic("rpc b called multiple times")
		}
		calledB = true
		return vdltypes.BYOutput{}, nil
	})

	mux := http.NewServeMux()
	mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		_ = server.HandleRequest(r.Context(), struct{}{}, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL + "/rpc").Build()
	if _, err := client.RPCs.A().Procs.X().Execute(context.Background(), vdltypes.AXInput{}); err != nil {
		panic(err)
	}
	if _, err := client.RPCs.B().Procs.Y().Execute(context.Background(), vdltypes.BYInput{}); err != nil {
		panic(err)
	}

	if !calledA {
		panic("rpc a not called")
	}
	if !calledB {
		panic("rpc b not called")
	}

	fmt.Println("multi rpc ok")
}
