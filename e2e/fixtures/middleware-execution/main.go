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

type appProps struct {
	Trace *[]string
}

func main() {
	server := rpcserver.NewServer[appProps]()
	server.Use(func(next rpcserver.GlobalHandlerFunc[appProps]) rpcserver.GlobalHandlerFunc[appProps] {
		return func(c *rpcserver.HandlerContext[appProps, any]) (any, error) {
			*c.Props.Trace = append(*c.Props.Trace, "Global")
			return next(c)
		}
	})
	server.RPCs.ServiceA().Use(func(next rpcserver.GlobalHandlerFunc[appProps]) rpcserver.GlobalHandlerFunc[appProps] {
		return func(c *rpcserver.HandlerContext[appProps, any]) (any, error) {
			*c.Props.Trace = append(*c.Props.Trace, "RpcA")
			return next(c)
		}
	})
	server.RPCs.ServiceB().Use(func(next rpcserver.GlobalHandlerFunc[appProps]) rpcserver.GlobalHandlerFunc[appProps] {
		return func(c *rpcserver.HandlerContext[appProps, any]) (any, error) {
			*c.Props.Trace = append(*c.Props.Trace, "RpcB")
			return next(c)
		}
	})
	server.RPCs.ServiceA().Procs.Proc1().Use(func(next rpcserver.ServiceAProc1HandlerFunc[appProps]) rpcserver.ServiceAProc1HandlerFunc[appProps] {
		return func(c *rpcserver.ServiceAProc1HandlerContext[appProps]) (vdltypes.ServiceAProc1Output, error) {
			*c.Props.Trace = append(*c.Props.Trace, "ProcA1")
			return next(c)
		}
	})
	server.RPCs.ServiceA().Procs.Proc1().Handle(func(c *rpcserver.ServiceAProc1HandlerContext[appProps]) (vdltypes.ServiceAProc1Output, error) {
		*c.Props.Trace = append(*c.Props.Trace, "HandlerA1")
		return vdltypes.ServiceAProc1Output{Trace: *c.Props.Trace}, nil
	})
	server.RPCs.ServiceA().Procs.Proc2().Handle(func(c *rpcserver.ServiceAProc2HandlerContext[appProps]) (vdltypes.ServiceAProc2Output, error) {
		*c.Props.Trace = append(*c.Props.Trace, "HandlerA2")
		return vdltypes.ServiceAProc2Output{Trace: *c.Props.Trace}, nil
	})
	server.RPCs.ServiceB().Procs.Proc1().Handle(func(c *rpcserver.ServiceBProc1HandlerContext[appProps]) (vdltypes.ServiceBProc1Output, error) {
		*c.Props.Trace = append(*c.Props.Trace, "HandlerB1")
		return vdltypes.ServiceBProc1Output{Trace: *c.Props.Trace}, nil
	})

	mux := http.NewServeMux()
	mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		trace := make([]string, 0)
		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		_ = server.HandleRequest(r.Context(), appProps{Trace: &trace}, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL + "/rpc").Build()
	ctx := context.Background()

	assertTrace(must(client.RPCs.ServiceA().Procs.Proc1().Execute(ctx, vdltypes.ServiceAProc1Input{})).Trace, []string{"Global", "RpcA", "ProcA1", "HandlerA1"})
	assertTrace(must(client.RPCs.ServiceA().Procs.Proc2().Execute(ctx, vdltypes.ServiceAProc2Input{})).Trace, []string{"Global", "RpcA", "HandlerA2"})
	assertTrace(must(client.RPCs.ServiceB().Procs.Proc1().Execute(ctx, vdltypes.ServiceBProc1Input{})).Trace, []string{"Global", "RpcB", "HandlerB1"})

	fmt.Println("middleware execution ok")
}

func must[T any](value T, err error) T {
	if err != nil {
		panic(err)
	}
	return value
}

func assertTrace(got []string, expected []string) {
	if strings.Join(got, ",") != strings.Join(expected, ",") {
		panic(fmt.Sprintf("expected %v, got %v", expected, got))
	}
}
