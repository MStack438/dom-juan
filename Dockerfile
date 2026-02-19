# Use official Playwright image which includes all browser dependencies
FROM mcr.microsoft.com/playwright:v1.49.0-jammy

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Run migrations and start server
CMD npm run db:migrate --workspace=server && \
    (npm run db:seed-municipalities --workspace=server || echo 'Seed failed or already complete') && \
    npm run start --workspace=server
