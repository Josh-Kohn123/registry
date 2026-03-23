FROM node:20-alpine

# Install openssl (required by Prisma), bash, and postgresql-client (for pg_isready and psql)
RUN apk add --no-cache openssl bash postgresql-client

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Use entrypoint script for proper initialization
ENTRYPOINT ["bash", "/app/docker-entrypoint.sh"]
