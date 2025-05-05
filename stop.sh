#!/bin/bash

# Stop any running Node.js processes
echo "Stopping Node.js processes..."
pkill -f "node server.js"
pkill -f "npm start"

# Stop Neo4j
echo "Stopping Neo4j..."
systemctl stop neo4j

echo "All services have been stopped." 