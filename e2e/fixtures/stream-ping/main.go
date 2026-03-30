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
	server := rpcserver.NewServer[struct{}]()
	server.SetStreamConfig(rpcserver.StreamConfig{PingInterval: 50 * time.Millisecond})
	server.RPCs.Clock().Streams.Ticks().Handle(func(c *rpcserver.ClockTicksHandlerContext[struct{}], emit rpcserver.ClockTicksEmitFunc[struct{}]) error {
		time.Sleep(200 * time.Millisecond)
		if err := emit(c, vdltypes.ClockTicksOutput{Iso: "event1"}); err != nil {
			return err
		}
		time.Sleep(200 * time.Millisecond)
		return emit(c, vdltypes.ClockTicksOutput{Iso: "event2"})
	})

	mux := http.NewServeMux()
	mux.HandleFunc("POST /rpc/{rpc}/{operation}", func(w http.ResponseWriter, r *http.Request) {
		adapter := rpcserver.NewNetHTTPAdapter(w, r)
		_ = server.HandleRequest(r.Context(), struct{}{}, r.PathValue("rpc"), r.PathValue("operation"), adapter)
	})

	ts := httptest.NewServer(mux)
	defer ts.Close()

	req, err := http.NewRequestWithContext(context.Background(), http.MethodPost, ts.URL+"/rpc/Clock/ticks", strings.NewReader("{}"))
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
	if pingCount < 3 || eventCount != 2 {
		panic(fmt.Sprintf("unexpected ping results: pings=%d events=%d", pingCount, eventCount))
	}

	client := rpcclient.NewClient(ts.URL + "/rpc").Build()
	stream := client.RPCs.Clock().Streams.Ticks().Execute(context.Background(), vdltypes.ClockTicksInput{})
	received := make([]string, 0, 2)
	for event := range stream {
		if !event.Ok {
			panic(event.Error)
		}
		received = append(received, event.Output.Iso)
	}
	if len(received) != 2 || received[0] != "event1" || received[1] != "event2" {
		panic(fmt.Sprintf("unexpected tick results: %v", received))
	}

	fmt.Println("stream ping ok")
}
