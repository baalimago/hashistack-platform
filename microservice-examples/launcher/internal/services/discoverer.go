package services

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/hashicorp/consul/api"
)

type discoverer struct {
	errChan      chan error
	consulClient *api.Client
	subServices  []subService
}

type subService struct {
	Name        string `json:"name"`
	Subdomain   string `json:"subdomain"`
	Description string `json:"description"`
  TechDetails string  `json:"techDetails"`
}

func NewDiscoverer() (*discoverer, error) {
	consulClient, err := api.NewClient(&api.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to create consul client: %w", err)
	}

	return &discoverer{
		errChan:      make(chan error),
		consulClient: consulClient,
	}, nil
}

func (d *discoverer) Start(ctx context.Context) error {
	var err error
	discoverRoutineDone := make(chan struct{})
	go func() {
		err = d.discover(ctx)
		close(discoverRoutineDone)
	}()

	<-discoverRoutineDone
	return err
}

func (d *discoverer) parseSubServices(services map[string][]string) error {
	d.subServices = make([]subService, 0)
	for jobName, tags := range services {
		name := jobName
		if strings.Contains(jobName, "sidecar") {
			continue
		}
		descr := ""
		subDomain := ""
    techDetails := ""
		enabled := false

		for _, t := range tags {
			if strings.Contains(t, "launcher.name=") {
				enabled = true
				split := strings.Split(t, "=")
				if len(split) != 2 {
					return errors.New("tag should at most contain 1 '='")
				}
				name = split[1]
			}

			if strings.Contains(t, "launcher.description=") {
				enabled = true
				split := strings.Split(t, "=")
				if len(split) != 2 {
					return errors.New("tag should at most contain 1 '='")
				}
				descr = split[1]
			}

			if strings.Contains(t, "launcher.subDomain=") {
				split := strings.Split(t, "=")
				if len(split) != 2 {
					return errors.New("tag should at most contain 1 '='")
				}
				subDomain = split[1]
			}

      if strings.Contains(t, "launcher.techDetails=") {
        split := strings.Split(t, "=")
        if len(split) != 2 {
          return errors.New("tag should at most contain 1 '='")
        }
        techDetails= split[1]
      }
		}

		if enabled {
			d.subServices = append(d.subServices, subService{
				Name:        name,
				Description: descr,
				Subdomain:   subDomain,
        TechDetails: techDetails,
			})
		}
	}
	return nil
}

func (d *discoverer) updateSubServices() error {
	catalog := d.consulClient.Catalog()
	services, _, err := catalog.Services(&api.QueryOptions{})
	if err != nil {
		return fmt.Errorf("failed to query services: %w", err)
	}

	err = d.parseSubServices(services)
	if err != nil {
		return fmt.Errorf("failed to parse services: %w", err)
	}
	return nil
}

func (d *discoverer) discover(ctx context.Context) error {
	t := time.NewTicker(time.Second * 5)
	for {
		select {
		case <-ctx.Done():
			return fmt.Errorf("ctx done: %w", ctx.Err())
		case <-t.C:
			err := d.updateSubServices()
			if err != nil {
				select {
				case d.errChan <- err:
				default:
				}
			}
		}
	}
}

func (d *discoverer) FiberHandler(fCtx *fiber.Ctx) error {
	return fCtx.JSON(d.subServices)
}

// Errors chanel where runtime errors will be sent
func (d *discoverer) Errors() <-chan error {
	return d.errChan
}
