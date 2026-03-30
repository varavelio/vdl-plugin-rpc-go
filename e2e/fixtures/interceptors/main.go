package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"

	rpcclient "fixture/internal/client"
	rpcserver "fixture/internal/server"
	vdltypes "fixture/internal/types"
)

type appProps struct {
	Intercepted bool
}

type interceptKey struct{}

func main() {
	server := rpcserver.NewServer[appProps]()
	server.RPCs.Service().Procs.Test().Handle(func(c *rpcserver.ServiceTestHandlerContext[appProps]) (vdltypes.ServiceTestOutput, error) {
		return vdltypes.ServiceTestOutput{Intercepted: c.Props.Intercepted}, nil
	})

	mux := http.NewServeMux()
	mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		_ = server.HandleRequest(r.Context(), appProps{Intercepted: r.Header.Get("X-Intercepted") == "true"}, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL + "/rpc").
		WithInterceptor(func(ctx context.Context, req rpcclient.RequestInfo, next rpcclient.Invoker) (rpcclient.Response[json.RawMessage], error) {
			return next(context.WithValue(ctx, interceptKey{}, "true"), req)
		}).
		WithHeaderProvider(func(ctx context.Context, h http.Header) error {
			if value, ok := ctx.Value(interceptKey{}).(string); ok && value == "true" {
				h.Set("X-Intercepted", "true")
			}
			return nil
		}).
		Build()

	result, err := client.RPCs.Service().Procs.Test().Execute(context.Background(), vdltypes.ServiceTestInput{})
	if err != nil {
		panic(err)
	}
	if !result.Intercepted {
		panic("interceptor did not work")
	}

	fmt.Println("interceptors ok")
}
