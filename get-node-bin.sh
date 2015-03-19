#!/bin/bash

NODE_VER=0.12.0
echo Downloading node-v${NODE_VER}-linux-x64.tar.gz
wget -q http://nodejs.org/dist/v${NODE_VER}/node-v${NODE_VER}-linux-x64.tar.gz
if [ ! -e node-v${NODE_VER}-linux-x64.tar.gz ]
then
    echo Node binary distribution file could not be downloaded
    exit 1
fi
echo Preparing node.js runtime directories
tar zxf node-v${NODE_VER}-linux-x64.tar.gz
rm node-v${NODE_VER}-linux-x64.tar.gz
mv node-v${NODE_VER}-linux-x64 node

echo change mods of executables
chmod +x node/bin/npm
chmod +x node/bin/node

echo Installing dependencies
node/bin/npm install

