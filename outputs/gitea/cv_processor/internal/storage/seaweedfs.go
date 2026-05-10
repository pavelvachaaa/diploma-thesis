package storage

import (
	"context"
	"errors"
	"fmt"
	"io"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/smithy-go"
)

// PermanentError represents an error that should not trigger a retry
type PermanentError struct {
	Err error
}

func (e *PermanentError) Error() string {
	return e.Err.Error()
}

func (e *PermanentError) Unwrap() error {
	return e.Err
}

// IsPermanentError checks if the error is a permanent (non-retryable) error
func IsPermanentError(err error) bool {
	var permErr *PermanentError
	return errors.As(err, &permErr)
}

type SeaweedClient struct {
	client *s3.Client
}

// NewSeaweed creates a new authenticated SeaweedFS S3 client
func NewSeaweed(
	ctx context.Context,
	endpoint string,
	accessKey string,
	secretKey string,
) (*SeaweedClient, error) {

	cfg, err := config.LoadDefaultConfig(
		ctx,
		config.WithRegion("us-east-1"), // required, but ignored by SeaweedFS
		config.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(
				accessKey,
				secretKey,
				"",
			),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("load aws config: %w", err)
	}

	s3Client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.UsePathStyle = true // REQUIRED for SeaweedFS
	})

	return &SeaweedClient{client: s3Client}, nil
}

func (s *SeaweedClient) Download(
	ctx context.Context,
	bucket string,
	key string,
) ([]byte, error) {

	out, err := s.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, classifyS3Error(err)
	}
	defer out.Body.Close()

	data, err := io.ReadAll(out.Body)
	if err != nil {
		return nil, fmt.Errorf("read response body: %w", err)
	}

	return data, nil
}

func classifyS3Error(err error) error {
	var apiErr smithy.APIError
	if errors.As(err, &apiErr) {
		switch apiErr.ErrorCode() {
		case "NoSuchKey",
			"NoSuchBucket",
			"AccessDenied",
			"InvalidRequest":
			return &PermanentError{Err: err}
		default:
			return err
		}
	}
	return err
}
