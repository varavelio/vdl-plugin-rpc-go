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
	var emitCount atomic.Int32
	var cleanedUp atomic.Bool

	server := rpcserver.NewServer[struct{}]()
	server.SetStreamConfig(rpcserver.StreamConfig{PingInterval: 10 * time.Second})
	server.RPCs.Service().Streams.Counter().Handle(func(c *rpcserver.ServiceCounterHandlerContext[struct{}], emit rpcserver.ServiceCounterEmitFunc[struct{}]) error {
		defer cleanedUp.Store(true)
		for index := 0; ; index++ {
			select {
			case <-c.Context.Done():
				return c.Context.Err()
			default:
				if err := emit(c, vdltypes.ServiceCounterOutput{Count: int64(index)}); err != nil {
					return err
				}
				emitCount.Add(1)
				time.Sleep(50 * time.Millisecond)
			}
		}
	})

	mux := http.NewServeMux()
	mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		_ = server.HandleRequest(r.Context(), struct{}{}, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL + "/rpc").Build()
	ctx, cancel := context.WithCancel(context.Background())
	stream := client.RPCs.Service().Streams.Counter().Execute(ctx, vdltypes.ServiceCounterInput{})

	received := 0
	for event := range stream {
		if !event.Ok {
			break
		}
		received++
		if received >= 3 {
			cancel()
		}
	}

	time.Sleep(200 * time.Millisecond)
	if received < 3 {
		panic(fmt.Sprintf("expected at least 3 events, got %d", received))
	}
	if !cleanedUp.Load() {
		panic("expected server cleanup after cancellation")
	}
	before := emitCount.Load()
	time.Sleep(200 * time.Millisecond)
	after := emitCount.Load()
	if after > before+2 {
		panic(fmt.Sprintf("server kept emitting after cancellation: before=%d after=%d", before, after))
	}

	fmt.Println("context cancellation ok")
}
