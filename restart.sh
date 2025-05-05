#!/bin/bash

# Stop any running Node.js processes
echo "Stopping any running Node.js processes..."
pkill -f "node server.js"
pkill -f "npm start"

# Restart Neo4j
echo "Restarting Neo4j..."
systemctl restart neo4j
sleep 5  # Wait for Neo4j to start

# Start the backend server
echo "Starting backend server..."
cd /var/www/Filter
npm run server &

# Start the frontend server
echo "Starting frontend server..."
npm start &

echo "All services have been restarted." 