import { dedent } from "@varavel/vdl-plugin-sdk/utils/strings";

export const CLIENT_RUNTIME = dedent(/* go */ `
	// -----------------------------------------------------------------------------
	// Client Types
	// -----------------------------------------------------------------------------

	// RequestInfo contains information about the RPC request currently being executed.
	//
	// It is passed through interceptors and retry/reconnect deciders so callers can
	// inspect the targeted RPC, operation, request payload, transport mode, and the
	// non-marker annotations declared on the VDL operation.
	type RequestInfo struct {
		RPCName string
		OperationName string
		Input any
		Type OperationType
		Annotations []Annotation
	}

	// RetryDecisionContext contains the information passed to a retry decider.
	//
	// The generated client evaluates this context after each failed attempt so
	// callers can decide whether the request should be retried.
	type RetryDecisionContext struct {
		Request RequestInfo
		Attempt int
		ResponseStatus int
		Error error
	}

	// RetryDecider determines whether a failed procedure attempt should be retried.
	type RetryDecider func(ctx context.Context, info RetryDecisionContext) bool

	// RetryConfig defines retry behavior for generated procedure calls.
	//
	// Parameters:
	//   - MaxAttempts: Maximum number of retry attempts (default: 1)
	//   - InitialDelay: Initial delay between retries (default: 0)
	//   - MaxDelay: Maximum delay between retries (default: 0)
	//   - DelayMultiplier: Cumulative multiplier applied to InitialDelay on each retry (default: 1.0)
	//   - Jitter: Randomness factor used to avoid synchronized retries (default: 0.2)
	//   - ShouldRetry: Optional callback that can override the default retry decision function
	type RetryConfig struct {
		MaxAttempts int
		InitialDelay time.Duration
		MaxDelay time.Duration
		DelayMultiplier float64
		Jitter float64
		ShouldRetry RetryDecider
	}

	// TimeoutConfig defines timeout behavior for procedure calls.
	type TimeoutConfig struct {
		// Request Timeout (default: 30 seconds)
		Timeout time.Duration
	}

	// ReconnectDecisionContext contains the information passed to a reconnect decider.
	//
	// The generated client evaluates this context after a stream connection fails or
	// breaks unexpectedly so callers can decide whether the stream should reconnect.
	type ReconnectDecisionContext struct {
		Request RequestInfo
		Attempt int
		ResponseStatus int
		Error error
	}

	// ReconnectDecider determines whether a failed stream connection should reconnect.
	type ReconnectDecider func(ctx context.Context, info ReconnectDecisionContext) bool

	// ReconnectConfig defines reconnection behavior for generated stream calls.
	//
	// Parameters:
	//   - MaxAttempts: Maximum number of reconnection attempts (default: 30)
	//   - InitialDelay: Initial delay between reconnection attempts (default: 1 second)
	//   - MaxDelay: Maximum delay between reconnection attempts (default: 30 seconds)
	//   - DelayMultiplier: Cumulative multiplier applied to InitialDelay on each retry (default: 1.5)
	//   - Jitter: Randomness factor used to avoid synchronized reconnects (default: 0.2)
	//   - ShouldReconnect: Optional callback that can override the default reconnect decision function
	type ReconnectConfig struct {
		MaxAttempts int
		InitialDelay time.Duration
		MaxDelay time.Duration
		DelayMultiplier float64
		Jitter float64
		ShouldReconnect ReconnectDecider
	}

	// HeaderProvider receives the current headers and mutates them in place.
	//
	// It is called before every request, including retries and stream reconnects.
	// If an error is returned, the request is aborted.
	type HeaderProvider func(ctx context.Context, h http.Header) error

	// Invoker is the final step in the interceptor chain that performs the actual request.
	type Invoker func(ctx context.Context, req RequestInfo) (Response[json.RawMessage], error)

	// Interceptor is middleware that wraps request execution.
	type Interceptor func(ctx context.Context, req RequestInfo, next Invoker) (Response[json.RawMessage], error)

  // -----------------------------------------------------------------------------
  // Internal Client Implementation
  // -----------------------------------------------------------------------------

	// internalClient is the core engine used by the generated client abstraction.
	//
	// It is safe for concurrent use and can be reused across procedure calls and
	// stream subscriptions. The zero value is not usable; use newInternalClient.
	//
	// The zero value is not usable – use newInternalClient to construct one.
	type internalClient struct {
		// Immutable after construction.
		baseURL string
		httpClient *http.Client
		operationDefs map[string]map[string]OperationDefinition

		// Dynamic components
		headerProviders []HeaderProvider
		interceptors []Interceptor

		// RPC specific header providers
		rpcHeaderProviders map[string][]HeaderProvider

		// Default Configurations
		globalRetryConf *RetryConfig
		globalTimeoutConf *TimeoutConfig
		globalReconnectConf *ReconnectConfig
		globalMaxMessageSize int64

		// Per-RPC Default Configurations
		rpcRetryConf map[string]*RetryConfig
		rpcTimeoutConf map[string]*TimeoutConfig
		rpcReconnectConf map[string]*ReconnectConfig
		rpcMaxMessageSize map[string]int64

		// mu protects concurrent access to the configuration maps
		mu sync.RWMutex
	}

	// internalClientOption configures an internal client during construction.
	type internalClientOption func(*internalClient)

	// withHTTPClient supplies a custom HTTP client implementation.
	func withHTTPClient(client *http.Client) internalClientOption {
		return func(value *internalClient) {
			if client != nil {
				value.httpClient = client
			}
		}
	}

	// withGlobalHeader registers a static header for every request.
	func withGlobalHeader(key string, value string) internalClientOption {
		return func(client *internalClient) {
			client.headerProviders = append(client.headerProviders, func(_ context.Context, h http.Header) error {
				h.Set(key, value)
				return nil
			})
		}
	}

	// withHeaderProvider registers a dynamic header provider.
	func withHeaderProvider(provider HeaderProvider) internalClientOption {
		return func(client *internalClient) {
			client.headerProviders = append(client.headerProviders, provider)
		}
	}

	// withInterceptor adds a transport interceptor.
	func withInterceptor(interceptor Interceptor) internalClientOption {
		return func(client *internalClient) {
			client.interceptors = append(client.interceptors, interceptor)
		}
	}

	// withGlobalRetryConfig sets the global default retry configuration.
	func withGlobalRetryConfig(conf RetryConfig) internalClientOption {
		return func(client *internalClient) {
			client.globalRetryConf = &conf
		}
	}

	// withGlobalTimeoutConfig sets the global default timeout configuration.
	func withGlobalTimeoutConfig(conf TimeoutConfig) internalClientOption {
		return func(client *internalClient) {
			client.globalTimeoutConf = &conf
		}
	}

	// withGlobalReconnectConfig sets the global default reconnection configuration.
	func withGlobalReconnectConfig(conf ReconnectConfig) internalClientOption {
		return func(client *internalClient) {
			client.globalReconnectConf = &conf
		}
	}

	// withGlobalMaxMessageSize sets the global maximum message size for streams.
	func withGlobalMaxMessageSize(size int64) internalClientOption {
		return func(client *internalClient) {
			client.globalMaxMessageSize = size
		}
	}

	// newInternalClient creates a new internalClient capable of talking to the VDL server.
	//
	// The caller can optionally pass functional options to customize transport
	// behavior, headers, interceptors, and retry/reconnect policies.
	func newInternalClient(baseURL string, procDefs []OperationDefinition, streamDefs []OperationDefinition, opts ...internalClientOption) *internalClient {
		operationDefs := make(map[string]map[string]OperationDefinition)

		ensureRPC := func(rpcName string) {
			if _, ok := operationDefs[rpcName]; !ok {
				operationDefs[rpcName] = make(map[string]OperationDefinition)
			}
		}

		for _, def := range procDefs {
			ensureRPC(def.RPCName)
			operationDefs[def.RPCName][def.Name] = def
		}

		for _, def := range streamDefs {
			ensureRPC(def.RPCName)
			operationDefs[def.RPCName][def.Name] = def
		}

		client := &internalClient{
			baseURL: strings.TrimRight(baseURL, "/"),
			httpClient: http.DefaultClient,
			operationDefs: operationDefs,
			headerProviders: []HeaderProvider{},
			interceptors: []Interceptor{},
			rpcHeaderProviders: make(map[string][]HeaderProvider),
			rpcRetryConf: make(map[string]*RetryConfig),
			rpcTimeoutConf: make(map[string]*TimeoutConfig),
			rpcReconnectConf: make(map[string]*ReconnectConfig),
			rpcMaxMessageSize: make(map[string]int64),
		}

		// Apply functional options.
		for _, opt := range opts {
			opt(client)
		}

		return client
	}

	// setRPCRetryConfig sets the default retry configuration for a specific RPC service.
	func (c *internalClient) setRPCRetryConfig(rpcName string, conf RetryConfig) {
		c.mu.Lock()
		defer c.mu.Unlock()
		c.rpcRetryConf[rpcName] = &conf
	}

	// setRPCTimeoutConfig sets the default timeout configuration for a specific RPC service.
	func (c *internalClient) setRPCTimeoutConfig(rpcName string, conf TimeoutConfig) {
		c.mu.Lock()
		defer c.mu.Unlock()
		c.rpcTimeoutConf[rpcName] = &conf
	}

	// setRPCReconnectConfig sets the default reconnect configuration for a specific RPC service.
	func (c *internalClient) setRPCReconnectConfig(rpcName string, conf ReconnectConfig) {
		c.mu.Lock()
		defer c.mu.Unlock()
		c.rpcReconnectConf[rpcName] = &conf
	}

	// setRPCMaxMessageSize sets the default maximum stream message size for a specific RPC service.
	func (c *internalClient) setRPCMaxMessageSize(rpcName string, size int64) {
		c.mu.Lock()
		defer c.mu.Unlock()
		c.rpcMaxMessageSize[rpcName] = size
	}

	// setRPCHeaderProvider adds a header provider for a specific RPC service.
	func (c *internalClient) setRPCHeaderProvider(rpcName string, provider HeaderProvider) {
		c.mu.Lock()
		defer c.mu.Unlock()
		c.rpcHeaderProviders[rpcName] = append(c.rpcHeaderProviders[rpcName], provider)
	}

	// mergeRetryConfig resolves retry configuration using this precedence:
	// operation override > RPC override > global override > default.
	func (c *internalClient) mergeRetryConfig(rpcName string, opConf *RetryConfig) *RetryConfig {
		if opConf != nil {
			return opConf
		}
		c.mu.RLock()
		defer c.mu.RUnlock()
		if rpcConf, ok := c.rpcRetryConf[rpcName]; ok {
			return rpcConf
		}
		if c.globalRetryConf != nil {
			return c.globalRetryConf
		}
		return &RetryConfig{
			MaxAttempts: 1,
			InitialDelay: 0,
			MaxDelay: 0,
			DelayMultiplier: 1.0,
			Jitter: 0.2,
		}
	}

	// mergeTimeoutConfig resolves timeout configuration using this precedence:
	// operation override > RPC override > global override > default.
	func (c *internalClient) mergeTimeoutConfig(rpcName string, opConf *TimeoutConfig) *TimeoutConfig {
		if opConf != nil {
			return opConf
		}
		c.mu.RLock()
		defer c.mu.RUnlock()

		if rpcConf, ok := c.rpcTimeoutConf[rpcName]; ok {
			return rpcConf
		}
		if c.globalTimeoutConf != nil {
			return c.globalTimeoutConf
		}
		return &TimeoutConfig{Timeout: 30 * time.Second}
	}

	// mergeReconnectConfig resolves reconnect configuration using this precedence:
	// operation override > RPC override > global override > default.
	func (c *internalClient) mergeReconnectConfig(rpcName string, opConf *ReconnectConfig) *ReconnectConfig {
		if opConf != nil {
			return opConf
		}
		c.mu.RLock()
		defer c.mu.RUnlock()
		if rpcConf, ok := c.rpcReconnectConf[rpcName]; ok {
			return rpcConf
		}
		if c.globalReconnectConf != nil {
			return c.globalReconnectConf
		}
		return &ReconnectConfig{
			MaxAttempts: 30,
			InitialDelay: time.Second,
			MaxDelay: 30 * time.Second,
			DelayMultiplier: 1.5,
			Jitter: 0.2,
		}
	}

	// mergeMaxMessageSize resolves the maximum stream message size using this precedence:
	// operation override > RPC override > global override > default.
	func (c *internalClient) mergeMaxMessageSize(rpcName string, opSize int64) int64 {
		if opSize > 0 {
			return opSize
		}
		c.mu.RLock()
		defer c.mu.RUnlock()
		if rpcSize, ok := c.rpcMaxMessageSize[rpcName]; ok && rpcSize > 0 {
			return rpcSize
		}
		if c.globalMaxMessageSize > 0 {
			return c.globalMaxMessageSize
		}
		return 4 * 1024 * 1024
	}

	// executeChain builds the interceptor chain and executes the final invoker.
	func (c *internalClient) executeChain(ctx context.Context, req RequestInfo, final Invoker) (Response[json.RawMessage], error) {
		chain := final
		for index := len(c.interceptors) - 1; index >= 0; index-- {
			middleware := c.interceptors[index]
			next := chain
			chain = func(callCtx context.Context, callReq RequestInfo) (Response[json.RawMessage], error) {
				return middleware(callCtx, callReq, next)
			}
		}
		return chain(ctx, req)
	}

	// lookupOperation returns the generated operation definition for the requested RPC member.
	func (c *internalClient) lookupOperation(rpcName string, operationName string) (OperationDefinition, bool) {
		if operations, ok := c.operationDefs[rpcName]; ok {
			operation, ok := operations[operationName]
			return operation, ok
		}
		return OperationDefinition{}, false
	}

	// proc invokes the given procedure and returns the raw wire envelope.
	func (c *internalClient) proc(
		ctx context.Context, 
		rpcName string, 
		procName string, 
		input any, 
		opHeaderProviders []HeaderProvider, 
		opRetryConf *RetryConfig,
		opTimeoutConf *TimeoutConfig,
	) Response[json.RawMessage] {
		operation, ok := c.lookupOperation(rpcName, procName)
		if !ok {
			return Response[json.RawMessage]{
				Ok: false,
				Error: Error{
					Category: "ClientError",
					Code: "INVALID_PROC",
					Message: fmt.Sprintf("%s.%s procedure not found in schema", rpcName, procName),
					Details: map[string]any{"rpc": rpcName, "procedure": procName},
				},
			}
		}

		reqInfo := RequestInfo{
			RPCName: rpcName,
			OperationName: procName,
			Input: input,
			Type: OperationTypeProc,
			Annotations: cloneAnnotations(operation.Annotations),
		}

		invoker := func(callCtx context.Context, req RequestInfo) (Response[json.RawMessage], error) {
			retryConf := c.mergeRetryConfig(req.RPCName, opRetryConf)
			timeoutConf := c.mergeTimeoutConfig(req.RPCName, opTimeoutConf)
			maxAttempts := retryConf.MaxAttempts
			if maxAttempts < 1 {
				maxAttempts = 1
			}

			payload, err := encodeRequestPayload(req.Input)
			if err != nil {
				return Response[json.RawMessage]{
					Ok: false,
					Error: Error{
						Category: "ClientError",
						Code: "ENCODE_INPUT",
						Message: fmt.Sprintf("failed to marshal input for %s.%s: %v", req.RPCName, req.OperationName, err),
					},
				}, nil
			}

			url := fmt.Sprintf("%s/%s/%s", c.baseURL, req.RPCName, req.OperationName)
			var last Response[json.RawMessage]

			for attempt := 1; attempt <= maxAttempts; attempt++ {
				attemptCtx := callCtx
				var cancel context.CancelFunc
				if timeoutConf.Timeout > 0 {
					attemptCtx, cancel = context.WithTimeout(callCtx, timeoutConf.Timeout)
				}

				res, defaultRetry, statusCode, decisionErr := c.doRequest(attemptCtx, req, url, payload, opHeaderProviders)
				if cancel != nil {
					cancel()
				}

				last = res
				shouldRetry := defaultRetry
				if retryConf.ShouldRetry != nil {
					shouldRetry = retryConf.ShouldRetry(callCtx, RetryDecisionContext{
						Request: req,
						Attempt: attempt,
						ResponseStatus: statusCode,
						Error: decisionErr,
					})
				}

				if !shouldRetry || attempt >= maxAttempts {
					return res, nil
				}

				if err := waitForBackoff(callCtx, calculateBackoff(retryConf, attempt)); err != nil {
					return Response[json.RawMessage]{Ok: false, Error: ToError(err)}, nil
				}
			}

			return last, nil
		}

		res, err := c.executeChain(ctx, reqInfo, invoker)
		if err != nil {
			return Response[json.RawMessage]{Ok: false, Error: ToError(err)}
		}

		return res
	}

	// doRequest performs a single HTTP request attempt.
	func (c *internalClient) doRequest(
		ctx context.Context, 
		req RequestInfo, 
		url string, 
		payload []byte, 
		opHeaderProviders []HeaderProvider,
	) (Response[json.RawMessage], bool, int, error) {
		httpRequest, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(payload))
		if err != nil {
			wrapped := fmt.Errorf("failed to create HTTP request: %w", err)
			return Response[json.RawMessage]{Ok: false, Error: ToError(wrapped)}, false, 0, wrapped
		}

		httpRequest.Header.Set("Content-Type", "application/json")
		httpRequest.Header.Set("Accept", "application/json")

		if err := c.applyHeaderProviders(ctx, req.RPCName, httpRequest.Header, opHeaderProviders); err != nil {
			wrapped := fmt.Errorf("failed to apply headers: %w", err)
			return Response[json.RawMessage]{Ok: false, Error: ToError(wrapped)}, false, 0, wrapped
		}

		response, err := c.httpClient.Do(httpRequest)
		if err != nil {
			if errors.Is(ctx.Err(), context.Canceled) {
				wrapped := context.Canceled
				return Response[json.RawMessage]{Ok: false, Error: ToError(wrapped)}, false, 0, wrapped
			}

			if errors.Is(ctx.Err(), context.DeadlineExceeded) {
				timeoutErr := Error{
					Category: "TimeoutError",
					Code: "REQUEST_TIMEOUT",
					Message: "Request timeout",
				}
				return Response[json.RawMessage]{Ok: false, Error: timeoutErr}, true, 0, timeoutErr
			}

			wrapped := fmt.Errorf("http request failed: %w", err)
			return Response[json.RawMessage]{Ok: false, Error: ToError(wrapped)}, true, 0, wrapped
		}
		defer response.Body.Close()

		if response.StatusCode >= 500 {
			httpErr := Error{
				Category: "HTTPError",
				Code: "BAD_STATUS",
				Message: fmt.Sprintf("unexpected HTTP status: %s", response.Status),
				Details: map[string]any{"status": response.StatusCode},
			}
			return Response[json.RawMessage]{Ok: false, Error: httpErr}, true, response.StatusCode, httpErr
		}

		if response.StatusCode < 200 || response.StatusCode >= 300 {
			httpErr := Error{
				Category: "HTTPError",
				Code: "BAD_STATUS",
				Message: fmt.Sprintf("unexpected HTTP status: %s", response.Status),
				Details: map[string]any{"status": response.StatusCode},
			}
			return Response[json.RawMessage]{Ok: false, Error: httpErr}, false, response.StatusCode, httpErr
		}

		var raw struct {
			Ok bool \`json:"ok"\`
			Output json.RawMessage \`json:"output"\`
			Error Error \`json:"error"\`
		}

		if err := json.NewDecoder(response.Body).Decode(&raw); err != nil {
			wrapped := fmt.Errorf("failed to decode VDL response: %w", err)
			return Response[json.RawMessage]{Ok: false, Error: ToError(wrapped)}, false, response.StatusCode, wrapped
		}

		if !raw.Ok {
			return Response[json.RawMessage]{Ok: false, Error: raw.Error}, false, response.StatusCode, raw.Error
		}

		return Response[json.RawMessage]{Ok: true, Output: raw.Output}, false, response.StatusCode, nil
	}

	// applyHeaderProviders applies global, RPC-scoped, and per-operation header providers in order.
	func (c *internalClient) applyHeaderProviders(ctx context.Context, rpcName string, header http.Header, opHeaderProviders []HeaderProvider) error {
		for _, provider := range c.headerProviders {
			if err := provider(ctx, header); err != nil {
				return fmt.Errorf("global header provider failed: %w", err)
			}
		}

		c.mu.RLock()
		rpcProviders := append([]HeaderProvider(nil), c.rpcHeaderProviders[rpcName]...)
		c.mu.RUnlock()

		for _, provider := range rpcProviders {
			if err := provider(ctx, header); err != nil {
				return fmt.Errorf("rpc header provider failed: %w", err)
			}
		}

		for _, provider := range opHeaderProviders {
			if err := provider(ctx, header); err != nil {
				return fmt.Errorf("operation header provider failed: %w", err)
			}
		}

		return nil
	}

	// stream establishes a Server-Sent Events subscription for the given stream.
	func (c *internalClient) stream(ctx context.Context, rpcName string, streamName string, input any, opHeaderProviders []HeaderProvider, opReconnectConf *ReconnectConfig, opMaxMessageSize int64, onConnect func(), onDisconnect func(error), onReconnect func(int, time.Duration)) <-chan Response[json.RawMessage] {
		events := make(chan Response[json.RawMessage], 1)

		operation, ok := c.lookupOperation(rpcName, streamName)
		if !ok {
			errValue := Error{
				Category: "ClientError",
				Code: "INVALID_STREAM",
				Message: fmt.Sprintf("%s.%s stream not found in schema", rpcName, streamName),
				Details: map[string]any{"rpc": rpcName, "stream": streamName},
			}
			events <- Response[json.RawMessage]{
				Ok: false,
				Error: errValue,
			}
			close(events)
			if onDisconnect != nil {
				onDisconnect(errValue)
			}
			return events
		}

		reqInfo := RequestInfo{
			RPCName: rpcName,
			OperationName: streamName,
			Input: input,
			Type: OperationTypeStream,
			Annotations: cloneAnnotations(operation.Annotations),
		}

		invoker := func(callCtx context.Context, req RequestInfo) (Response[json.RawMessage], error) {
			reconnectConf := c.mergeReconnectConfig(req.RPCName, opReconnectConf)
			maxMessageSize := c.mergeMaxMessageSize(req.RPCName, opMaxMessageSize)
			payload, err := encodeRequestPayload(req.Input)
			if err != nil {
				errValue := ToError(fmt.Errorf("failed to marshal input for %s.%s: %w", req.RPCName, req.OperationName, err))
				events <- Response[json.RawMessage]{Ok: false, Error: errValue}
				close(events)
				if onDisconnect != nil {
					onDisconnect(errValue)
				}
				return Response[json.RawMessage]{Ok: false, Error: errValue}, nil
			}

			url := fmt.Sprintf("%s/%s/%s", c.baseURL, req.RPCName, req.OperationName)

			go func() {
				defer close(events)
				var finalErr error
				defer func() {
					if onDisconnect != nil {
						onDisconnect(finalErr)
					}
				}()

				reconnectAttempt := 0
				for {
					if callCtx.Err() != nil {
						finalErr = callCtx.Err()
						return
					}

					httpRequest, err := http.NewRequestWithContext(callCtx, http.MethodPost, url, bytes.NewReader(payload))
					if err != nil {
						finalErr = err
						events <- Response[json.RawMessage]{Ok: false, Error: ToError(err)}
						return
					}

					httpRequest.Header.Set("Content-Type", "application/json")
					httpRequest.Header.Set("Accept", "text/event-stream")

					if err := c.applyHeaderProviders(callCtx, req.RPCName, httpRequest.Header, opHeaderProviders); err != nil {
						finalErr = err
						events <- Response[json.RawMessage]{Ok: false, Error: ToError(err)}
						return
					}

					response, err := c.httpClient.Do(httpRequest)
					if err != nil {
						shouldReconnect := true
						if reconnectConf.ShouldReconnect != nil {
							shouldReconnect = reconnectConf.ShouldReconnect(callCtx, ReconnectDecisionContext{
								Request: req,
								Attempt: reconnectAttempt + 1,
								ResponseStatus: 0,
								Error: err,
							})
						}

						if shouldReconnect && reconnectAttempt < reconnectConf.MaxAttempts {
							reconnectAttempt++
							delay := calculateReconnectBackoff(reconnectConf, reconnectAttempt)
							if onReconnect != nil {
								onReconnect(reconnectAttempt, delay)
							}
							if waitErr := waitForBackoff(callCtx, delay); waitErr != nil {
								finalErr = waitErr
								return
							}
							continue
						}

						finalErr = err
						events <- Response[json.RawMessage]{Ok: false, Error: ToError(err)}
						return
					}

					if response.StatusCode >= 500 {
						httpErr := Error{
							Category: "HTTPError",
							Code: "BAD_STATUS",
							Message: fmt.Sprintf("unexpected HTTP status: %s", response.Status),
							Details: map[string]any{"status": response.StatusCode},
						}

						shouldReconnect := true
						if reconnectConf.ShouldReconnect != nil {
							shouldReconnect = reconnectConf.ShouldReconnect(callCtx, ReconnectDecisionContext{
								Request: req,
								Attempt: reconnectAttempt + 1,
								ResponseStatus: response.StatusCode,
								Error: httpErr,
							})
						}
						response.Body.Close()

						if shouldReconnect && reconnectAttempt < reconnectConf.MaxAttempts {
							reconnectAttempt++
							delay := calculateReconnectBackoff(reconnectConf, reconnectAttempt)
							if onReconnect != nil {
								onReconnect(reconnectAttempt, delay)
							}
							if waitErr := waitForBackoff(callCtx, delay); waitErr != nil {
								finalErr = waitErr
								return
							}
							continue
						}

						finalErr = httpErr
						events <- Response[json.RawMessage]{Ok: false, Error: httpErr}
						return
					}

					if response.StatusCode < 200 || response.StatusCode >= 300 {
						httpErr := Error{
							Category: "HTTPError",
							Code: "BAD_STATUS",
							Message: fmt.Sprintf("unexpected HTTP status: %s", response.Status),
							Details: map[string]any{"status": response.StatusCode},
						}
						response.Body.Close()
						finalErr = httpErr
						events <- Response[json.RawMessage]{Ok: false, Error: httpErr}
						return
					}

					if onConnect != nil {
						onConnect()
					}
					reconnectAttempt = 0

					result := handleStreamEvents(callCtx, response, maxMessageSize, events)
					response.Body.Close()

					if result.reconnectable {
						shouldReconnect := true
						if reconnectConf.ShouldReconnect != nil {
							shouldReconnect = reconnectConf.ShouldReconnect(callCtx, ReconnectDecisionContext{
								Request: req,
								Attempt: reconnectAttempt + 1,
								ResponseStatus: http.StatusOK,
								Error: result.err,
							})
						}

						if shouldReconnect && reconnectAttempt < reconnectConf.MaxAttempts {
							reconnectAttempt++
							delay := calculateReconnectBackoff(reconnectConf, reconnectAttempt)
							if onReconnect != nil {
								onReconnect(reconnectAttempt, delay)
							}
							if waitErr := waitForBackoff(callCtx, delay); waitErr != nil {
								finalErr = waitErr
								return
							}
							continue
						}
					}

					if result.err != nil {
						finalErr = result.err
						if result.deliverErrorEvent {
							events <- Response[json.RawMessage]{Ok: false, Error: ToError(result.err)}
						}
					}
					return
				}
			}()

			return Response[json.RawMessage]{Ok: true}, nil
		}

		_, _ = c.executeChain(ctx, reqInfo, invoker)
		return events
	}

	// streamReadResult describes the outcome of processing an SSE response body.
	type streamReadResult struct {
		reconnectable bool
		deliverErrorEvent bool
		err error
	}

	// handleStreamEvents consumes Server-Sent Events from the response body.
	func handleStreamEvents(ctx context.Context, response *http.Response, maxMessageSize int64, events chan<- Response[json.RawMessage]) streamReadResult {
		scanner := bufio.NewScanner(response.Body)
		scanner.Buffer(make([]byte, 4096), int(maxMessageSize))

		var dataBuffer bytes.Buffer
		flush := func() {
			if dataBuffer.Len() == 0 {
				return
			}

			var event Response[json.RawMessage]
			if err := json.Unmarshal(dataBuffer.Bytes(), &event); err != nil {
				events <- Response[json.RawMessage]{
					Ok: false,
					Error: ToError(fmt.Errorf("received invalid SSE payload: %w", err)),
				}
				dataBuffer.Reset()
				return
			}

			select {
			case events <- event:
			case <-ctx.Done():
			}

			dataBuffer.Reset()
		}

		for {
			select {
			case <-ctx.Done():
				return streamReadResult{}
			default:
			}

			if !scanner.Scan() {
				if err := scanner.Err(); err != nil {
					if err == bufio.ErrTooLong {
						return streamReadResult{
							reconnectable: false,
							deliverErrorEvent: true,
							err: Error{
								Category: "ProtocolError",
								Code: "MESSAGE_TOO_LARGE",
								Message: fmt.Sprintf("stream message exceeded maximum size of %d bytes", maxMessageSize),
							},
						}
					}

					return streamReadResult{reconnectable: true, err: err}
				}

				return streamReadResult{}
			}

			line := scanner.Text()
			if line == "" {
				flush()
				continue
			}

			if strings.HasPrefix(line, ":") {
				continue
			}

			if strings.HasPrefix(line, "data:") {
				chunk := strings.TrimSpace(strings.TrimPrefix(line, "data:"))
				if int64(dataBuffer.Len()+len(chunk)) > maxMessageSize {
					return streamReadResult{
						reconnectable: false,
						deliverErrorEvent: true,
						err: Error{
							Category: "ProtocolError",
							Code: "MESSAGE_TOO_LARGE",
							Message: fmt.Sprintf("stream message accumulation exceeded maximum size of %d bytes", maxMessageSize),
						},
					}
				}

				dataBuffer.WriteString(chunk)
			}
		}
	}

	// encodeRequestPayload marshals the request input using an empty JSON object when the input is nil.
	func encodeRequestPayload(input any) ([]byte, error) {
		if input == nil {
			return []byte("{}"), nil
		}

		return json.Marshal(input)
	}

	// calculateBackoff computes the delay for a retry attempt.
	func calculateBackoff(config *RetryConfig, attempt int) time.Duration {
		delay := config.InitialDelay
		for index := 1; index < attempt; index++ {
			delay = time.Duration(float64(delay) * config.DelayMultiplier)
		}

		if config.MaxDelay > 0 && delay > config.MaxDelay {
			delay = config.MaxDelay
		}

		return applyJitter(delay, config.Jitter)
	}

	// calculateReconnectBackoff computes the delay for a reconnect attempt.
	func calculateReconnectBackoff(config *ReconnectConfig, attempt int) time.Duration {
		delay := config.InitialDelay
		for index := 1; index < attempt; index++ {
			delay = time.Duration(float64(delay) * config.DelayMultiplier)
		}

		if config.MaxDelay > 0 && delay > config.MaxDelay {
			delay = config.MaxDelay
		}

		return applyJitter(delay, config.Jitter)
	}

	// applyJitter applies bounded randomness to the given delay.
	func applyJitter(delay time.Duration, factor float64) time.Duration {
		if factor <= 0 || delay <= 0 {
			return delay
		}

		if factor > 1 {
			factor = 1
		}

		delta := float64(delay) * factor
		minimum := float64(delay) - delta
		maximum := float64(delay) + delta
		if minimum < 0 {
			minimum = 0
		}

		return time.Duration(minimum + (rand.Float64() * (maximum - minimum)))
	}

	// waitForBackoff waits for the given delay or returns when the context is cancelled.
	func waitForBackoff(ctx context.Context, delay time.Duration) error {
		if delay <= 0 {
			return nil
		}

		timer := time.NewTimer(delay)
		defer timer.Stop()

		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-timer.C:
			return nil
		}
	}

	// -----------------------------------------------------------------------------
  // Client Builder
  // -----------------------------------------------------------------------------

	// clientBuilder collects configuration before a generated client is built.
	type clientBuilder struct {
		baseURL string
		opts []internalClientOption
	}

	// WithHTTPClient supplies a custom HTTP client implementation.
	func (b *clientBuilder) WithHTTPClient(client *http.Client) *clientBuilder {
		b.opts = append(b.opts, withHTTPClient(client))
		return b
	}

	// WithHeader registers a static header that is sent with every request.
	func (b *clientBuilder) WithHeader(key string, value string) *clientBuilder {
		b.opts = append(b.opts, withGlobalHeader(key, value))
		return b
	}

	// WithHeaderProvider registers a dynamic header provider.
	func (b *clientBuilder) WithHeaderProvider(provider HeaderProvider) *clientBuilder {
		b.opts = append(b.opts, withHeaderProvider(provider))
		return b
	}

	// WithInterceptor registers a transport interceptor.
	func (b *clientBuilder) WithInterceptor(interceptor Interceptor) *clientBuilder {
		b.opts = append(b.opts, withInterceptor(interceptor))
		return b
	}

	// WithRetryConfig sets the default retry configuration for procedures.
	func (b *clientBuilder) WithRetryConfig(conf RetryConfig) *clientBuilder {
		b.opts = append(b.opts, withGlobalRetryConfig(conf))
		return b
	}

	// WithTimeoutConfig sets the default timeout configuration for procedures.
	func (b *clientBuilder) WithTimeoutConfig(conf TimeoutConfig) *clientBuilder {
		b.opts = append(b.opts, withGlobalTimeoutConfig(conf))
		return b
	}

	// WithReconnectConfig sets the default reconnect configuration for streams.
	func (b *clientBuilder) WithReconnectConfig(conf ReconnectConfig) *clientBuilder {
		b.opts = append(b.opts, withGlobalReconnectConfig(conf))
		return b
	}

	// WithMaxMessageSize sets the default maximum message size for streams.
	func (b *clientBuilder) WithMaxMessageSize(size int64) *clientBuilder {
		b.opts = append(b.opts, withGlobalMaxMessageSize(size))
		return b
	}

	// Build creates the generated RPC client.
	func (b *clientBuilder) Build() *Client {
		intClient := newInternalClient(b.baseURL, VDLProcedures, VDLStreams, b.opts...)
		return &Client{RPCs: &clientRPCRegistry{intClient: intClient}}
	}

  // -----------------------------------------------------------------------------
  // Client Implementation
  // -----------------------------------------------------------------------------

	// Client is the public entrypoint for generated RPC calls.
	type Client struct {
		RPCs *clientRPCRegistry
	}

	// NewClient creates a new generated RPC client builder.
	func NewClient(baseURL string) *clientBuilder {
		return &clientBuilder{baseURL: baseURL, opts: []internalClientOption{}}
	}

	// clientRPCRegistry exposes the generated RPC services.
	type clientRPCRegistry struct {
		intClient *internalClient
	}
`);
