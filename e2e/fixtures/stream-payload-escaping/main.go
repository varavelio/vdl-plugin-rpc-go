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
	messages := []string{
		"simple message",
		"message with\nnewline",
		"message with\r\nCRLF",
		"message with\ttab",
		"unicode: 你好世界 🎉 émojis",
		"message with \"quotes\" and 'apostrophes'",
		"message with backslash: \\path\\to\\file",
		"message with special chars: <>&",
		"multi\nline\nmessage\nwith\nmany\nbreaks",
		"",
	}

	server := rpcserver.NewServer[struct{}]()
	server.SetStreamConfig(rpcserver.StreamConfig{PingInterval: 10 * time.Second})
	server.RPCs.Service().Streams.Events().Handle(func(c *rpcserver.ServiceEventsHandlerContext[struct{}], emit rpcserver.ServiceEventsEmitFunc[struct{}]) error {
		for _, message := range messages {
			if err := emit(c, vdltypes.ServiceEventsOutput{Message: message}); err != nil {
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
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	stream := client.RPCs.Service().Streams.Events().Execute(ctx, vdltypes.ServiceEventsInput{})

	var received []string
	for event := range stream {
		if !event.Ok {
			panic(event.Error)
		}
		received = append(received, event.Output.Message)
	}
	if len(received) != len(messages) {
		panic(fmt.Sprintf("expected %d messages, got %d", len(messages), len(received)))
	}
	for index, expected := range messages {
		if received[index] != expected {
			panic(fmt.Sprintf("message %d mismatch: expected %q got %q", index, expected, received[index]))
		}
	}

	fmt.Println("stream payload escaping ok")
}
