package main

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"time"

	rpcclient "fixture/internal/client"
	rpcserver "fixture/internal/server"
	vdltypes "fixture/internal/types"
)

func main() {
	server := rpcserver.NewServer[struct{}]()
	var attempts atomic.Int32

	server.RPCs.Service().Procs.Flaky().Handle(func(c *rpcserver.ServiceFlakyHandlerContext[struct{}]) (vdltypes.ServiceFlakyOutput, error) {
		if attempts.Add(1) < 3 {
			panic("simulated server error")
		}
		return vdltypes.ServiceFlakyOutput{}, nil
	})

	mux := http.NewServeMux()
	mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if recover() != nil {
				w.WriteHeader(http.StatusInternalServerError)
			}
		}()
		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		_ = server.HandleRequest(r.Context(), struct{}{}, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL + "/rpc").Build()
	retryConf := rpcclient.RetryConfig{
		MaxAttempts:     3,
		InitialDelay:    10 * time.Millisecond,
		MaxDelay:        100 * time.Millisecond,
		DelayMultiplier: 1,
		Jitter:          0,
	}

	if _, err := client.RPCs.Service().Procs.Flaky().WithRetryConfig(retryConf).Execute(context.Background(), vdltypes.ServiceFlakyInput{}); err != nil {
		panic(err)
	}
	if attempts.Load() != 3 {
		panic(fmt.Sprintf("expected 3 attempts, got %d", attempts.Load()))
	}

	fmt.Println("client retries ok")
}
