FROM nginx:latest

# Stage 1: Build be
FROM golang:1.18-alpine as b-be
WORKDIR /app
COPY ./ ./
RUN go mod download
RUN go build -o ./bin/launcher .

# Stage 2: Merge builds
FROM alpine:3.14
COPY --from=b-be /app/bin/ /app/bin/
COPY ./html /html

EXPOSE 8070
RUN ls app/bin
ENTRYPOINT [ "/app/bin/launcher" ]