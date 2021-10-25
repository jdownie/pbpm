FROM alpine:latest
RUN apk update && apk upgrade && apk add python3 py3-flask bash py3-graphviz py3-requests
WORKDIR /pbpm
CMD flask run -h 0.0.0.0 --reload
