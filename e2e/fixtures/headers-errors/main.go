package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"

	rpcclient "fixture/internal/client"
	rpcserver "fixture/internal/server"
	vdltypes "fixture/internal/types"
)

type traceKey struct{}

type AppProps struct {
	Authorization string
	Trace         string
	RequestID     string
}

func main() {
	server := rpcserver.NewServer[AppProps]()

	server.SetErrorHandler(func(_ *rpcserver.HandlerContext[AppProps, any], err error) rpcserver.Error {
		return rpcserver.Error{Message: "global:" + err.Error()}
	})

	server.RPCs.Auth().SetErrorHandler(func(_ *rpcserver.HandlerContext[AppProps, any], err error) rpcserver.Error {
		return rpcserver.Error{Message: "auth:" + err.Error()}
	})

	server.RPCs.Users().Procs.Get().Handle(func(c *rpcserver.UsersGetHandlerContext[AppProps]) (vdltypes.UsersGetOutput, error) {
		return vdltypes.UsersGetOutput{
			Authorization: c.Props.Authorization,
			Trace:         c.Props.Trace,
			RequestId:     c.Props.RequestID,
		}, nil
	})

	server.RPCs.Profile().Procs.Fail().Handle(func(c *rpcserver.ProfileFailHandlerContext[AppProps]) (vdltypes.ProfileFailOutput, error) {
		return vdltypes.ProfileFailOutput{}, errors.New("boom")
	})

	server.RPCs.Auth().Procs.Login().Handle(func(c *rpcserver.AuthLoginHandlerContext[AppProps]) (vdltypes.AuthLoginOutput, error) {
		return vdltypes.AuthLoginOutput{}, errors.New("boom")
	})

	mux := http.NewServeMux()
	mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		props := AppProps{
			Authorization: r.Header.Get("Authorization"),
			Trace:         r.Header.Get("X-Trace"),
			RequestID:     r.Header.Get("X-Request"),
		}
		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		_ = server.HandleRequest(r.Context(), props, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL+"/rpc").
		WithHeader("Authorization", "Bearer secret").
		WithInterceptor(func(ctx context.Context, req rpcclient.RequestInfo, next rpcclient.Invoker) (rpcclient.Response[json.RawMessage], error) {
			return next(context.WithValue(ctx, traceKey{}, "trace-1"), req)
		}).
		WithHeaderProvider(func(ctx context.Context, h http.Header) error {
			if value, ok := ctx.Value(traceKey{}).(string); ok {
				h.Set("X-Trace", value)
			}
			return nil
		}).
		Build()

	echo, err := client.RPCs.Users().Procs.Get().
		WithHeader("X-Request", "req-9").
		Execute(context.Background(), vdltypes.UsersGetInput{})
	if err != nil {
		panic(err)
	}
	if echo.Authorization != "Bearer secret" || echo.Trace != "trace-1" || echo.RequestId != "req-9" {
		panic(fmt.Sprintf("unexpected echoed headers: %#v", echo))
	}

	_, err = client.RPCs.Profile().Procs.Fail().Execute(context.Background(), vdltypes.ProfileFailInput{})
	assertClientError(err, "global:boom")

	_, err = client.RPCs.Auth().Procs.Login().Execute(context.Background(), vdltypes.AuthLoginInput{})
	assertClientError(err, "auth:boom")

	fmt.Println("headers and errors ok")
}

func assertClientError(err error, expected string) {
	if err == nil {
		panic("expected error, got nil")
	}
	vdlErr, ok := err.(rpcclient.Error)
	if !ok {
		panic(fmt.Sprintf("expected rpcclient.Error, got %T", err))
	}
	if vdlErr.Message != expected {
		panic(fmt.Sprintf("expected %q, got %q", expected, vdlErr.Message))
	}
}
