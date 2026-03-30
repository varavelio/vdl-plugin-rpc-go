package main

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"time"

	rpcclient "fixture/internal/client"
	rpcserver "fixture/internal/server"
	vdltypes "fixture/internal/types"
)

func main() {
	server := rpcserver.NewServer[struct{}]()
	server.RPCs.Service().Procs.Slow().Handle(func(c *rpcserver.ServiceSlowHandlerContext[struct{}]) (vdltypes.ServiceSlowOutput, error) {
		time.Sleep(500 * time.Millisecond)
		return vdltypes.ServiceSlowOutput{}, nil
	})

	mux := http.NewServeMux()
	mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		_ = server.HandleRequest(r.Context(), struct{}{}, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL + "/rpc").Build()
	start := time.Now()
	_, err := client.RPCs.Service().Procs.Slow().WithTimeoutConfig(rpcclient.TimeoutConfig{Timeout: 100 * time.Millisecond}).Execute(context.Background(), vdltypes.ServiceSlowInput{})
	duration := time.Since(start)
	if err == nil {
		panic("expected timeout error")
	}
	vdlErr, ok := err.(rpcclient.Error)
	if !ok {
		panic(fmt.Sprintf("expected rpcclient.Error, got %T", err))
	}
	if vdlErr.Code != "REQUEST_TIMEOUT" {
		panic(fmt.Sprintf("expected REQUEST_TIMEOUT, got %s", vdlErr.Code))
	}
	if duration > 300*time.Millisecond {
		panic(fmt.Sprintf("client waited too long: %v", duration))
	}

	fmt.Println("client timeout ok")
}
