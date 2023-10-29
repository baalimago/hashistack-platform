package main

import (
	"context"
	"fmt"
	"launcher/internal/services"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/gofiber/adaptor/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/spf13/viper"
)

func initConf() {
	viper.SetConfigFile("./conf.yml")
	viper.SetDefault("metrics.port", 8071)
	viper.BindEnv("metrics.port", "METRICS_PORT")
	viper.SetDefault("port", 8070)
	viper.BindEnv("port", "PORT")
	viper.SetDefault("frontend.location", "./html")
	viper.BindEnv("frontend.location", "FRONTEND_LOCATION")
	viper.AutomaticEnv()
}

func main() {
	initConf()

	ctx, ctxCancel := context.WithCancel(context.Background())

	metricsApp := fiber.New()
	metricsApp.Get("/metrics", adaptor.HTTPHandler(promhttp.Handler()))
	go func() {
		err := metricsApp.Listen(fmt.Sprintf(":%v", viper.GetInt("metrics.port")))
		if err != nil {
			log.Println("metrics app failed, err: %w", err)
		} else {
			log.Println("metrics app has returned")
		}
	}()

	d, err := services.NewDiscoverer()
	if err != nil {
		panic(fmt.Errorf("failed to create discoverer: %w", err))
	}

	go func() {
		err = d.Start(ctx)
		if err != nil {
			panic(fmt.Errorf("failed to start discoverer: %w", err))
		}
	}()
	errChan := d.Errors()
	go func() {
		for {
			select {
			case <-ctx.Done():
			case err := <-errChan:
				log.Printf("discoverer error: %v\n", err)
			}
		}
	}()
	if err != nil {
		// Cancelled here also to make linter not whine
		ctxCancel()
		panic(fmt.Errorf("failed to start discoverer: %w", err))
	}

	app := fiber.New()
	api := app.Group("api/v1/")
	api.Get("subServices", d.FiberHandler)
	app.Use(cors.New(cors.ConfigDefault))
	app.Use(logger.New(logger.Config{
		Format: "[${ip}]:${port} ${status} - ${method} ${path}\n",
	}))
	app.Use(func(c *fiber.Ctx) error {
		c.Response().Header.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Response().Header.Add("Access-Control-Allow-Headers", "DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type")
		c.Response().Header.Add("Cross-Origin-Opener-Policy", "same-origin")
		c.Response().Header.Add("Cross-Origin-Embedder-Policy", "require-corp")
		return c.Next()
	})
	app.Static("/", "./html")

	// Redirect all endpoints to frontend
	app.Get("*", func(c *fiber.Ctx) error {
		return c.SendFile("./html/" + "index.html")
	})

	go func() {

		err := app.Listen(fmt.Sprintf(":%v", viper.GetInt("port")))
		if err != nil {
			log.Println("fiber app failed, err: %w", err)
		} else {
			log.Println("fiber has returned")
		}
		syscall.Kill(syscall.Getpid(), syscall.SIGINT)
	}()

	log.Println("app started awaiting shutdown")
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c
	log.Fatal("application shutdown initiated")
	ctxCancel()
	app.Shutdown()
}
