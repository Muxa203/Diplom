#!/bin/bash

BASEDIR=$(dirname $(dirname $(which mysqld)))
MYSQL_DATA=/home/runner/mysql_data
MYSQL_RUN=/home/runner/mysql_run
MYSQL_TMP=/home/runner/mysql_tmp
MYSQL_SOCK=$MYSQL_RUN/mysql.sock
SCHEMA_FILE=$(cd "$(dirname "$0")" && pwd)/database/schema.sql
PROJECT_ROOT=$(cd "$(dirname "$0")" && pwd)
INITIALIZED_FLAG=$MYSQL_DATA/.initialized

mkdir -p $MYSQL_DATA $MYSQL_RUN $MYSQL_TMP

start_mysql() {
    pkill -x mysqld 2>/dev/null || true
    sleep 1
    rm -f $MYSQL_SOCK

    setsid mysqld --no-defaults \
        --datadir=$MYSQL_DATA \
        --basedir=$BASEDIR \
        --user=runner \
        --socket=$MYSQL_SOCK \
        --pid-file=$MYSQL_RUN/mysql.pid \
        --tmpdir=$MYSQL_TMP \
        --port=3306 \
        --bind-address=127.0.0.1 \
        --skip-grant-tables \
        0</dev/null 1>$MYSQL_RUN/mysqld.log 2>&1 &

    echo "Waiting for MySQL to start..."
    for i in $(seq 1 30); do
        sleep 1
        if mysql --no-defaults -u root --socket=$MYSQL_SOCK --connect-timeout=1 -e "SELECT 1;" 2>/dev/null; then
            echo "MySQL ready."
            return 0
        fi
    done
    echo "ERROR: MySQL failed to start"
    tail -20 $MYSQL_RUN/mysqld.log
    return 1
}

init_db() {
    echo "Initializing database for first time..."

    mysql --no-defaults -u root --socket=$MYSQL_SOCK \
        < $BASEDIR/share/mysql/mysql_system_tables.sql 2>/dev/null || true

    mysql --no-defaults -u root --socket=$MYSQL_SOCK mysql \
        < $BASEDIR/share/mysql/mysql_system_tables_data.sql 2>/dev/null || true

    mysql --no-defaults -u root --socket=$MYSQL_SOCK \
        < $SCHEMA_FILE

    touch $INITIALIZED_FLAG
    echo "Database initialized."
}

start_mysql

if [ ! -f $INITIALIZED_FLAG ]; then
    init_db
fi

echo "Starting PHP server on 0.0.0.0:5000..."
exec php -S 0.0.0.0:5000 -t "$PROJECT_ROOT" "$PROJECT_ROOT/router.php"
