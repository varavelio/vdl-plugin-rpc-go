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

type appProps struct {
	TraceID string
}

func main() {
	server := rpcserver.NewServer[appProps]()
	server.RPCs.Service().Procs.Echo().Handle(func(c *rpcserver.ServiceEchoHandlerContext[appProps]) (vdltypes.ServiceEchoOutput, error) {
		return vdltypes.ServiceEchoOutput{Data: c.Input.Data, ReceivedTraceId: c.Props.TraceID}, nil
	})

	mux := http.NewServeMux()
	mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		_ = server.HandleRequest(r.Context(), appProps{TraceID: r.Header.Get("X-Trace-ID")}, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL+"/rpc").WithHeader("X-Trace-ID", "trace-123-abc").Build()
	result, err := client.RPCs.Service().Procs.Echo().Execute(context.Background(), vdltypes.ServiceEchoInput{Data: "hello"})
	if err != nil {
		panic(err)
	}
	if result.ReceivedTraceId != "trace-123-abc" {
		panic(fmt.Sprintf("expected propagated trace id, got %q", result.ReceivedTraceId))
	}

	fmt.Println("headers propagation ok")
}
