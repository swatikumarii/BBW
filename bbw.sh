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
    export USER_INFO=$(id -u):$(id -g)
    export USER_ID=$(id -u)
    export GROUP_ID=$(id -g)
    docker-compose build
    USER_INFO=$(id -u):$(id -g) docker-compose run --rm bbw


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

elif [ "$1" = 'meta:import' ]
then
    echo "Approve 2 factor-Auth with Salesforce Authenticator."
    SFCC_CI_AUTH_RES=$(sfcc-ci client:auth)
    echo "$SFCC_CI_AUTH_RES"
    if [ "$SFCC_CI_AUTH_RES" = 'Authentication succeeded' ]
    then
        echo "SFCC-CI Authenticated Successfully!"
        SFCC_CI_AUTH_STATUS=true
        OCAPIACCESS_TOKEN=$(sfcc-ci client:auth:token)
        FOLDER_TO_UPLOAD="meta"
        echo "Start Archiving $FOLDER_TO_UPLOAD folder into $FOLDER_TO_UPLOAD.zip"
        zip -r -q $FOLDER_TO_UPLOAD.zip $FOLDER_TO_UPLOAD
        SANDBOX_URL=$(cat dw.json | underscore select '.hostname' --outfmt text)
        echo "$SANDBOX_URL"
        IS_DATA_UPLOADED=$(sfcc-ci instance:upload $FOLDER_TO_UPLOAD.zip -i ${SANDBOX_URL})
        if [ "$IS_DATA_UPLOADED" = 'Instance import file '$FOLDER_TO_UPLOAD'.zip uploaded to '${SANDBOX_URL} ]
        then
            IS_DATA_IMPORTED=$(sfcc-ci instance:import $FOLDER_TO_UPLOAD.zip -i ${SANDBOX_URL} -s)
            echo "${IS_DATA_IMPORTED}"
        else
            echo "Metadata not uploaded."
        fi
    else
    echo "Authentication Failed."
    fi
fi
echo "_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-"
echo "Done!"
