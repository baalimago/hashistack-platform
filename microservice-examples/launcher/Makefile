run r up u:
	./bin/launcher 

down stop s:
	docker-compose down

publish p:
	@./publish

docker d:
	@docker build . -t launcher

docker-run dr:
	@docker run -p 8070:8070 launcher:latest

build b:
	go build -o bin/launcher .