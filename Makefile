push:
	npm install --package-lock-only
	sudo docker build --tag=kyoheiudev/signal:$(VER) .
	sudo docker push kyoheiudev/signal:$(VER)
