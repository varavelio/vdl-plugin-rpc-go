package main

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"sync/atomic"

	rpcclient "fixture/internal/client"
	rpcserver "fixture/internal/server"
	vdltypes "fixture/internal/types"
)

type appProps struct {
	Count string
}

func main() {
	server := rpcserver.NewServer[appProps]()
	server.RPCs.Service().Procs.Get().Handle(func(c *rpcserver.ServiceGetHandlerContext[appProps]) (vdltypes.ServiceGetOutput, error) {
		return vdltypes.ServiceGetOutput{Val: c.Props.Count}, nil
	})

	mux := http.NewServeMux()
	mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		_ = server.HandleRequest(r.Context(), appProps{Count: r.Header.Get("X-Count")}, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	defer ts.Close()

	var count atomic.Int32
	client := rpcclient.NewClient(ts.URL + "/rpc").WithHeaderProvider(func(ctx context.Context, h http.Header) error {
		h.Set("X-Count", fmt.Sprintf("%d", count.Add(1)))
		return nil
	}).Build()

	for expected := 1; expected <= 3; expected++ {
		result, err := client.RPCs.Service().Procs.Get().Execute(context.Background(), vdltypes.ServiceGetInput{})
		if err != nil {
			panic(err)
		}
		if result.Val != fmt.Sprintf("%d", expected) {
			panic(fmt.Sprintf("expected %d, got %s", expected, result.Val))
		}
	}

	fmt.Println("dynamic headers ok")
}
