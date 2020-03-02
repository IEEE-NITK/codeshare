for subdir in ./docker/*/; do
    cd $subdir
    LANG=$(echo $subdir | cut -d'/' -f 3)
    echo "INFO: Building docker for ${LANG}.."
    echo ""
    docker build -t $LANG .
    echo ""
    echo "INFO: Done building docker for ${LANG}.."
    cd ..
done