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
	testConnectDisconnect()
	testDisconnectOnCancel()
	testReconnect()
	fmt.Println("stream lifecycle ok")
}

func testConnectDisconnect() {
	server := rpcserver.NewServer[struct{}]()
	server.RPCs.Service().Streams.Events().Handle(func(c *rpcserver.ServiceEventsHandlerContext[struct{}], emit rpcserver.ServiceEventsEmitFunc[struct{}]) error {
		for range 3 {
			if err := emit(c, vdltypes.ServiceEventsOutput{}); err != nil {
				return err
			}
		}
		return nil
	})

	mux := http.NewServeMux()
	mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		_ = server.HandleRequest(r.Context(), struct{}{}, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL + "/rpc").Build()
	var connectCalled atomic.Bool
	var disconnectCalled atomic.Bool
	var disconnectHadError atomic.Bool

	stream := client.RPCs.Service().Streams.Events().
		OnConnect(func() { connectCalled.Store(true) }).
		OnDisconnect(func(err error) {
			disconnectCalled.Store(true)
			disconnectHadError.Store(err != nil)
		}).
		Execute(context.Background(), vdltypes.ServiceEventsInput{})

	count := 0
	for range stream {
		count++
	}
	time.Sleep(20 * time.Millisecond)
	if !connectCalled.Load() || !disconnectCalled.Load() || disconnectHadError.Load() || count != 3 {
		panic(fmt.Sprintf("unexpected lifecycle result: connect=%v disconnect=%v err=%v count=%d", connectCalled.Load(), disconnectCalled.Load(), disconnectHadError.Load(), count))
	}
}

func testDisconnectOnCancel() {
	server := rpcserver.NewServer[struct{}]()
	server.RPCs.Service().Streams.Events().Handle(func(c *rpcserver.ServiceEventsHandlerContext[struct{}], emit rpcserver.ServiceEventsEmitFunc[struct{}]) error {
		for range 100 {
			if err := emit(c, vdltypes.ServiceEventsOutput{}); err != nil {
				return err
			}
			time.Sleep(10 * time.Millisecond)
		}
		return nil
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
	defer cancel()
	var disconnectCalled atomic.Bool
	stream := client.RPCs.Service().Streams.Events().
		OnDisconnect(func(err error) { disconnectCalled.Store(true) }).
		Execute(ctx, vdltypes.ServiceEventsInput{})

	count := 0
	for range stream {
		count++
		if count >= 2 {
			cancel()
			for range stream {
			}
			break
		}
	}
	time.Sleep(100 * time.Millisecond)
	if !disconnectCalled.Load() {
		panic("expected disconnect callback after cancellation")
	}
}

func testReconnect() {
	server := rpcserver.NewServer[struct{}]()
	server.RPCs.Service().Streams.Events().Handle(func(c *rpcserver.ServiceEventsHandlerContext[struct{}], emit rpcserver.ServiceEventsEmitFunc[struct{}]) error {
		for range 2 {
			if err := emit(c, vdltypes.ServiceEventsOutput{}); err != nil {
				return err
			}
		}
		return nil
	})

	var requestCount atomic.Int32
	mux := http.NewServeMux()
	mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		if requestCount.Add(1) == 1 {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		_ = server.HandleRequest(r.Context(), struct{}{}, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL + "/rpc").Build()
	var connectCount atomic.Int32
	var reconnectCount atomic.Int32
	stream := client.RPCs.Service().Streams.Events().
		WithReconnectConfig(rpcclient.ReconnectConfig{MaxAttempts: 5, InitialDelay: 20 * time.Millisecond, MaxDelay: 50 * time.Millisecond, DelayMultiplier: 1, Jitter: 0}).
		OnConnect(func() { connectCount.Add(1) }).
		OnReconnect(func(_ int, _ time.Duration) { reconnectCount.Add(1) }).
		Execute(context.Background(), vdltypes.ServiceEventsInput{})

	count := 0
	for range stream {
		count++
	}
	if reconnectCount.Load() < 1 || connectCount.Load() != 1 || count != 2 {
		panic(fmt.Sprintf("unexpected reconnect results: reconnects=%d connects=%d count=%d", reconnectCount.Load(), connectCount.Load(), count))
	}
}
