package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"time"

	rpcclient "fixture/internal/client"
	rpcserver "fixture/internal/server"
	vdltypes "fixture/internal/types"
)

func main() {
	server := rpcserver.NewServer[struct{}]()
	server.RPCs.Service().Streams.Data().Handle(func(c *rpcserver.ServiceDataHandlerContext[struct{}], emit rpcserver.ServiceDataEmitFunc[struct{}]) error {
		time.Sleep(50 * time.Millisecond)
		return errors.New("something went wrong")
	})

	mux := http.NewServeMux()
	mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		_ = server.HandleRequest(r.Context(), struct{}{}, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL + "/rpc").Build()
	stream := client.RPCs.Service().Streams.Data().WithReconnectConfig(rpcclient.ReconnectConfig{MaxAttempts: 0}).Execute(context.Background(), vdltypes.ServiceDataInput{})
	select {
	case event := <-stream:
		if event.Ok || event.Error.Message != "something went wrong" {
			panic(fmt.Sprintf("unexpected event: %#v", event))
		}
	case <-time.After(time.Second):
		panic("timeout waiting for error event")
	}

	fmt.Println("stream error event ok")
}
