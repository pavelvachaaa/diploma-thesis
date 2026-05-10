FROM golang:1.23-alpine AS builder
WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum* ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /job-processor ./cmd/server

FROM alpine:3.20
RUN apk add --no-cache ca-certificates

COPY --from=builder /job-processor /job-processor
ENTRYPOINT ["/job-processor"]
