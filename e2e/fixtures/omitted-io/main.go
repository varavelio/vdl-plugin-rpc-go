package main

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"

	rpcclient "fixture/internal/client"
	rpcserver "fixture/internal/server"
)

func main() {
	server := rpcserver.NewServer[struct{}]()
	server.RPCs.Commands().Procs.Ping().Handle(func(c *rpcserver.CommandsPingHandlerContext[struct{}]) (rpcserver.Void, error) {
		return rpcserver.Void{}, nil
	})
	server.RPCs.Commands().Streams.Heartbeat().Handle(func(c *rpcserver.CommandsHeartbeatHandlerContext[struct{}], emit rpcserver.CommandsHeartbeatEmitFunc[struct{}]) error {
		return emit(c, rpcserver.Void{})
	})

	mux := http.NewServeMux()
	mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		_ = server.HandleRequest(r.Context(), struct{}{}, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL + "/rpc").Build()
	if _, err := client.RPCs.Commands().Procs.Ping().Execute(context.Background(), rpcclient.Void{}); err != nil {
		panic(err)
	}

	events := client.RPCs.Commands().Streams.Heartbeat().Execute(context.Background(), rpcclient.Void{})
	event := <-events
	if !event.Ok {
		panic(event.Error)
	}

	for range events {
	}

	fmt.Println("omitted io ok")
}
