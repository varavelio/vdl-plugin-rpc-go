package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"

	rpcclient "fixture/internal/client"
	rpcserver "fixture/internal/server"
	vdltypes "fixture/internal/types"
)

func main() {
	server := rpcserver.NewServer[struct{}]()
	server.SetErrorHandler(func(c *rpcserver.HandlerContext[struct{}, any], err error) rpcserver.Error {
		return rpcserver.Error{Message: "Global: " + err.Error()}
	})
	server.RPCs.Auth().SetErrorHandler(func(c *rpcserver.HandlerContext[struct{}, any], err error) rpcserver.Error {
		return rpcserver.Error{Message: "Auth: " + err.Error()}
	})
	server.RPCs.Users().Procs.Get().Handle(func(c *rpcserver.UsersGetHandlerContext[struct{}]) (vdltypes.UsersGetOutput, error) {
		return vdltypes.UsersGetOutput{}, errors.New("fail")
	})
	server.RPCs.Auth().Procs.Login().Handle(func(c *rpcserver.AuthLoginHandlerContext[struct{}]) (vdltypes.AuthLoginOutput, error) {
		return vdltypes.AuthLoginOutput{}, errors.New("fail")
	})

	mux := http.NewServeMux()
	mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		_ = server.HandleRequest(r.Context(), struct{}{}, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL + "/rpc").Build()
	_, err := client.RPCs.Users().Procs.Get().Execute(context.Background(), vdltypes.UsersGetInput{})
	assertError(err, "Global: fail")
	_, err = client.RPCs.Auth().Procs.Login().Execute(context.Background(), vdltypes.AuthLoginInput{})
	assertError(err, "Auth: fail")

	fmt.Println("error handling ok")
}

func assertError(err error, expected string) {
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
