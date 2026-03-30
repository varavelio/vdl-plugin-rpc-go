package main

import (
	"bufio"
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"time"

	rpcclient "fixture/internal/client"
	rpcserver "fixture/internal/server"
	vdltypes "fixture/internal/types"
)

func main() {
	testRawPings()
	testGeneratedClient()
	testMessageTooLarge()
	fmt.Println("stream transport ok")
}

func createServer() (*rpcserver.Server[struct{}], *httptest.Server) {
	server := rpcserver.NewServer[struct{}]()
	server.SetStreamConfig(rpcserver.StreamConfig{PingInterval: 50 * time.Millisecond})

	server.RPCs.Feed().Streams.Ticks().Handle(func(c *rpcserver.FeedTicksHandlerContext[struct{}], emit rpcserver.FeedTicksEmitFunc[struct{}]) error {
		time.Sleep(200 * time.Millisecond)
		if err := emit(c, vdltypes.FeedTicksOutput{Label: "one"}); err != nil {
			return err
		}
		time.Sleep(200 * time.Millisecond)
		return emit(c, vdltypes.FeedTicksOutput{Label: "two"})
	})

	server.RPCs.Feed().Streams.Huge().Handle(func(c *rpcserver.FeedHugeHandlerContext[struct{}], emit rpcserver.FeedHugeEmitFunc[struct{}]) error {
		return emit(c, vdltypes.FeedHugeOutput{Payload: strings.Repeat("a", 2*1024*1024)})
	})

	mux := http.NewServeMux()
	mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		_ = server.HandleRequest(r.Context(), struct{}{}, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	return server, ts
}

func testRawPings() {
	_, ts := createServer()
	defer ts.Close()

	req, err := http.NewRequestWithContext(context.Background(), http.MethodPost, ts.URL+"/rpc/Feed/ticks", strings.NewReader("{}"))
	if err != nil {
		panic(err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "text/event-stream")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	scanner := bufio.NewScanner(resp.Body)
	var pingCount int
	var eventCount int
	for scanner.Scan() {
		line := scanner.Text()
		if line == ": ping" {
			pingCount++
		}
		if strings.HasPrefix(line, "data:") {
			eventCount++
		}
	}

	if pingCount < 3 {
		panic(fmt.Sprintf("expected at least 3 pings, got %d", pingCount))
	}
	if eventCount != 2 {
		panic(fmt.Sprintf("expected 2 data events, got %d", eventCount))
	}
}

func testGeneratedClient() {
	_, ts := createServer()
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL + "/rpc").Build()
	stream := client.RPCs.Feed().Streams.Ticks().Execute(context.Background(), vdltypes.FeedTicksInput{})
	labels := make([]string, 0, 2)
	for event := range stream {
		if !event.Ok {
			panic(event.Error)
		}
		labels = append(labels, event.Output.Label)
	}

	if len(labels) != 2 || labels[0] != "one" || labels[1] != "two" {
		panic(fmt.Sprintf("unexpected labels: %v", labels))
	}
}

func testMessageTooLarge() {
	_, ts := createServer()
	defer ts.Close()

	client := rpcclient.NewClient(ts.URL + "/rpc").Build()
	stream := client.RPCs.Feed().Streams.Huge().
		WithReconnectConfig(rpcclient.ReconnectConfig{MaxAttempts: 0}).
		WithMaxMessageSize(1*1024*1024).
		Execute(context.Background(), vdltypes.FeedHugeInput{})

	event := <-stream
	if event.Ok {
		panic("expected MESSAGE_TOO_LARGE error")
	}
	if event.Error.Code != "MESSAGE_TOO_LARGE" {
		panic(fmt.Sprintf("expected MESSAGE_TOO_LARGE, got %s", event.Error.Code))
	}
}
