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

	server.RPCs.Jobs().Procs.Create().Handle(func(c *rpcserver.JobsCreateHandlerContext[struct{}]) (vdltypes.JobsCreateOutput, error) {
		return vdltypes.JobsCreateOutput{Attempts: 2}, nil
	})

	server.RPCs.Jobs().Streams.Updates().Handle(func(c *rpcserver.JobsUpdatesHandlerContext[struct{}], emit rpcserver.JobsUpdatesEmitFunc[struct{}]) error {
		return emit(c, vdltypes.JobsUpdatesOutput{Seq: 1})
	})

	var procAttempts atomic.Int32
	var streamAttempts atomic.Int32
	var reconnectCallbacks atomic.Int32

	mux := http.NewServeMux()
	mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		switch r.PathValue("operation") {
		case "create":
			if procAttempts.Add(1) == 1 {
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
		case "updates":
			if streamAttempts.Add(1) == 1 {
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
		}

		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		_ = server.HandleRequest(r.Context(), struct{}{}, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL + "/rpc").Build()

	var sawRetryAnnotation atomic.Bool
	retryConf := rpcclient.RetryConfig{
		MaxAttempts:     2,
		InitialDelay:    10 * time.Millisecond,
		MaxDelay:        10 * time.Millisecond,
		DelayMultiplier: 1,
		Jitter:          0,
		ShouldRetry: func(_ context.Context, info rpcclient.RetryDecisionContext) bool {
			sawRetryAnnotation.Store(matchAnnotation(info.Request.Annotations, "retryable", "level", "high"))
			return sawRetryAnnotation.Load() && info.ResponseStatus == http.StatusInternalServerError
		},
	}

	procResult, err := client.RPCs.Jobs().Procs.Create().WithRetryConfig(retryConf).Execute(context.Background(), vdltypes.JobsCreateInput{Name: "demo"})
	if err != nil {
		panic(err)
	}
	if procResult.Attempts != 2 {
		panic(fmt.Sprintf("expected 2 attempts in proc output, got %d", procResult.Attempts))
	}
	if !sawRetryAnnotation.Load() {
		panic("retry decider did not observe the retryable annotation")
	}

	var sawReconnectAnnotation atomic.Bool
	reconnectConf := rpcclient.ReconnectConfig{
		MaxAttempts:     1,
		InitialDelay:    10 * time.Millisecond,
		MaxDelay:        10 * time.Millisecond,
		DelayMultiplier: 1,
		Jitter:          0,
		ShouldReconnect: func(_ context.Context, info rpcclient.ReconnectDecisionContext) bool {
			sawReconnectAnnotation.Store(matchAnnotation(info.Request.Annotations, "reconnectable", "channel", "jobs"))
			return sawReconnectAnnotation.Load() && info.ResponseStatus == http.StatusInternalServerError
		},
	}

	stream := client.RPCs.Jobs().Streams.Updates().
		WithReconnectConfig(reconnectConf).
		OnReconnect(func(attempt int, _ time.Duration) {
			if attempt == 1 {
				reconnectCallbacks.Add(1)
			}
		}).
		Execute(context.Background(), vdltypes.JobsUpdatesInput{WorkerId: "worker-1"})

	event := <-stream
	if !event.Ok {
		panic(event.Error)
	}
	if event.Output.Seq != 1 {
		panic(fmt.Sprintf("expected stream seq 1, got %d", event.Output.Seq))
	}
	if reconnectCallbacks.Load() != 1 {
		panic(fmt.Sprintf("expected 1 reconnect callback, got %d", reconnectCallbacks.Load()))
	}
	if !sawReconnectAnnotation.Load() {
		panic("reconnect decider did not observe the reconnectable annotation")
	}

	for range stream {
	}

	fmt.Println("client policies ok")
}

func matchAnnotation(annotations []rpcclient.Annotation, name string, key string, expected string) bool {
	for _, annotation := range annotations {
		if annotation.Name != name {
			continue
		}
		argument, ok := annotation.Argument.(map[string]any)
		if !ok {
			return false
		}
		value, ok := argument[key].(string)
		return ok && value == expected
	}

	return false
}
