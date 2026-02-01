# Music Downloader - Deployment Guide

## 📦 Prerequisites

- Docker installed on your system
- Docker Compose (optional but recommended)

## 🚀 Quick Deployment

### Using Deployment Scripts

#### On Linux/macOS:
```bash
# Make script executable
chmod +x deploy.sh

# Build the image
./deploy.sh build

# Deploy the application
./deploy.sh deploy

# Clean up
./deploy.sh clean
```

#### On Windows:
```powershell
# Build the image
.\deploy.ps1 Build

# Deploy the application
.\deploy.ps1 Deploy

# Clean up
.\deploy.ps1 Clean
```

### Using Docker Compose

```bash
# Build and start services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Using Docker Commands Directly

```bash
# Build the image
docker build -t music-downloader-app .

# Run the container
docker run -d \
  --name music-downloader-container \
  --restart unless-stopped \
  -p 80:80 \
  music-downloader-app

# View logs
docker logs music-downloader-container

# Stop container
docker stop music-downloader-container

# Remove container
docker rm music-downloader-container
```

## 🌐 Access Your Application

Once deployed, access your application at:
- **Local**: http://localhost
- **Production**: http://your-domain.com

## 🛠️ Production Deployment

For production environments, use the production compose file:

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

This includes:
- Health checks
- Optimized security headers
- Better restart policies

## 🔧 Configuration Options

### Environment Variables

You can customize the deployment by setting environment variables:

```bash
docker run -d \
  --name music-downloader-container \
  -p 80:80 \
  -e NODE_ENV=production \
  music-downloader-app
```

### Custom Port

To run on a different port:

```bash
docker run -d \
  --name music-downloader-container \
  -p 3000:80 \
  music-downloader-app
```

Then access at: http://localhost:3000

## 📊 Monitoring

### View Container Status
```bash
docker ps
```

### View Application Logs
```bash
docker logs music-downloader-container
```

### Real-time Logs
```bash
docker logs -f music-downloader-container
```

## 🔒 Security Considerations

1. **HTTPS**: For production, consider using a reverse proxy like Nginx with SSL termination
2. **Firewall**: Ensure only necessary ports are exposed
3. **Updates**: Regularly rebuild and redeploy with security updates

## 🆘 Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   # Check what's using port 80
   netstat -tulpn | grep :80
   
   # Kill the process or use a different port
   ```

2. **Permission denied**:
   ```bash
   # Run with sudo on Linux/macOS
   sudo ./deploy.sh build
   ```

3. **Docker daemon not running**:
   ```bash
   # Start Docker service
   sudo systemctl start docker  # Linux
   # Or start Docker Desktop on Windows/macOS
   ```

### Debugging Steps

1. Check container logs:
   ```bash
   docker logs music-downloader-container
   ```

2. Check container status:
   ```bash
   docker ps -a
   ```

3. Inspect container details:
   ```bash
   docker inspect music-downloader-container
   ```

## 🔄 Updates

To update your application:

1. Pull latest code changes
2. Rebuild the image: `./deploy.sh build`
3. Redeploy: `./deploy.sh deploy`

Or with Docker Compose:
```bash
docker-compose down
docker-compose up -d --build
```

## 📈 Scaling

For high-traffic scenarios, consider:

1. **Multiple instances**:
   ```bash
   docker run -d -p 8080:80 music-downloader-app
   docker run -d -p 8081:80 music-downloader-app
   ```

2. **Load balancer**: Use NGINX or HAProxy to distribute traffic

3. **Container orchestration**: Consider Kubernetes for large-scale deployments