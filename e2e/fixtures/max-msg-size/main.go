package main

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"

	rpcclient "fixture/internal/client"
	rpcserver "fixture/internal/server"
	vdltypes "fixture/internal/types"
)

func main() {
	server := rpcserver.NewServer[struct{}]()
	server.RPCs.Service().Streams.Data().Handle(func(c *rpcserver.ServiceDataHandlerContext[struct{}], emit rpcserver.ServiceDataEmitFunc[struct{}]) error {
		payload := strings.Repeat("a", 2*1024*1024)
		return emit(c, vdltypes.ServiceDataOutput{Payload: payload})
	})

	mux := http.NewServeMux()
	mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		_ = server.HandleRequest(r.Context(), struct{}{}, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL + "/rpc").Build()
	stream := client.RPCs.Service().Streams.Data().WithMaxMessageSize(1*1024*1024).Execute(context.Background(), vdltypes.ServiceDataInput{})
	event := <-stream
	if event.Ok || event.Error.Code != "MESSAGE_TOO_LARGE" {
		panic(fmt.Sprintf("unexpected event: %#v", event))
	}

	fmt.Println("max msg size ok")
}
