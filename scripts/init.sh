#!/bin/bash
# XXX - fix it
APPHOME=/home/app
PORT=${2:-3000}
case "$1" in
  start)
    forever start ${APPHOME}/app.js $PORT
    ;;
  stop)
    forever stop ${APPHOME}/app.js $PORT
    ;;
  restart)
    forever restart ${APPHOME}/app.js $PORT
    ;;
  list)
    forever list
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|list}"
    exit 1
esac
exit 0

