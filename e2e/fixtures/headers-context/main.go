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
	Headers map[string]string
}

func main() {
	server := rpcserver.NewServer[appProps]()
	server.RPCs.Service().Procs.GetHeaders().Handle(func(c *rpcserver.ServiceGetHeadersHandlerContext[appProps]) (vdltypes.ServiceGetHeadersOutput, error) {
		return vdltypes.ServiceGetHeadersOutput{Values: c.Props.Headers}, nil
	})

	mux := http.NewServeMux()
	mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		props := appProps{Headers: map[string]string{
			"Authorization": r.Header.Get("Authorization"),
			"X-Custom":      r.Header.Get("X-Custom"),
		}}
		_ = server.HandleRequest(r.Context(), props, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL+"/rpc").WithHeader("Authorization", "Bearer secret").Build()
	result, err := client.RPCs.Service().Procs.GetHeaders().WithHeader("X-Custom", "123").Execute(context.Background(), vdltypes.ServiceGetHeadersInput{})
	if err != nil {
		panic(err)
	}
	if result.Values["Authorization"] != "Bearer secret" || result.Values["X-Custom"] != "123" {
		panic(fmt.Sprintf("unexpected header values: %#v", result.Values))
	}

	fmt.Println("headers context ok")
}
