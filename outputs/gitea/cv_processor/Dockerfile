FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install git for go mod download
RUN apk add --no-cache git

# Download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /cv-processor ./cmd/worker

# Runtime stage
FROM alpine:3.20

RUN apk add --no-cache ca-certificates

COPY --from=builder /cv-processor /cv-processor

ENTRYPOINT ["/cv-processor"]
