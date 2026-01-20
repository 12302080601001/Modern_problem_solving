# Use a lightweight Node.js version
FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Expose the port (must match your .env)
EXPOSE 3001

# Command to run the app
CMD ["npm", "start"]