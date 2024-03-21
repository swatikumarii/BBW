#!/bin/bash


echo "‾-‾-‾-‾-‾-‾-‾-‾-‾-‾-‾-‾-‾-‾-‾-‾-‾-‾-‾-‾-‾-‾-‾-‾-‾-‾-‾-‾-‾-‾-‾-‾-‾-‾-‾-‾-‾-"
if [ "$1" = 'docker:build' ]
then
    echo "Building Docker"
    cd Docker
    docker build --build-arg USER_ID=$(id -u) --build-arg GROUP_ID=$(id -g) -t bbw:v1 .
elif [ "$1" = 'docker:up' ]
then
    echo "Starting Docker"
    cd Docker
    docker-compose up -d
    docker exec -it -u $(id -u):$(id -g) bbw bash


elif [ "$1" = 'docker:down' ]
then
    echo "Stopping Docker"
    cd Docker
    docker-compose down

elif [ "$1" = 'init' ]
then
    DIR=`pwd`
    CartridgePath='storefront-reference-architecture:plugin_bundling:plugin_event_traking:plugin_gift_wrap_greeting_card:plugin_marketing_tiles:plugin_plugin_notify_back_in_stock:plugin_popups'
    for i in $(echo $CartridgePath | tr ":" "\n")
        do
            echo ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
            echo "Cartridge Path => " $i
            echo "Command => " $1
            cd $DIR/$i
            echo ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
            echo "npm Install"
            echo ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
            npm install
            echo "Compiling Fonts"
            echo ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
            npm run compile:fonts
            echo ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
            echo "Compiling scss"
            echo ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
            npm run compile:scss
            echo ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
            echo "Compiling js"
            echo ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
            npm run compile:js
        done
fi
echo "_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-"
echo "Done!"