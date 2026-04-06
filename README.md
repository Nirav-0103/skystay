# SkyStay — MNC-Level Automation Setup

Hotel & Flight Booking platform with production-grade DevOps.

---

## Project Structure

```
skystay-automation/
├── .github/workflows/
│   └── ci-cd.yml              ← GitHub Actions pipeline
├── docker/
│   ├── Dockerfile.backend     ← Node.js multi-stage Docker
│   ├── Dockerfile.frontend    ← Next.js multi-stage Docker
│   └── docker-compose.yml     ← Local dev (all services)
├── terraform/
│   └── main.tf                ← AWS infra (VPC, EKS, DocumentDB, Redis, S3, ECR)
├── k8s/
│   ├── deployments/
│   │   └── backend-deployment.yaml   ← K8s Deployment + Service
│   ├── hpa/
│   │   └── hpa.yaml           ← Auto-scaling (3→20 pods)
│   └── monitoring/
├── monitoring/
│   ├── prometheus/
│   │   ├── prometheus.yml     ← Scrape config
│   │   └── alerts.yml         ← 10+ alert rules
│   └── grafana/dashboards/
└── README.md
```

---

## Quick Start — Local Development

```bash
# 1. Copy env file
cp backend/.env.example backend/.env
# Fill in GROQ_API_KEY, JWT_SECRET, etc.

# 2. Start everything (MongoDB, Redis, Backend, Frontend, Prometheus, Grafana)
cd docker
docker compose up -d

# 3. Check services
open http://localhost:3000      # Frontend (Next.js)
open http://localhost:5000/api/health   # Backend health
open http://localhost:9090      # Prometheus
open http://localhost:3001      # Grafana (admin / skystay_grafana)
```

---

## CI/CD Pipeline (GitHub Actions)

### Flow
```
Git Push → Lint+Test → Docker Build → Push to ECR → Deploy to K8s → Slack notify
```

### Branch Strategy
| Branch    | Action               |
|-----------|----------------------|
| `develop` | Auto deploy → Staging|
| `main`    | Manual approval → Production |

### GitHub Secrets required
```
AWS_ACCOUNT_ID
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
NEXT_PUBLIC_API_URL
SLACK_WEBHOOK_URL
```

---

## Terraform — AWS Infrastructure

```bash
cd terraform

# First time setup
terraform init
terraform plan -var="db_password=YourSecurePass123!"
terraform apply -var="db_password=YourSecurePass123!"

# This creates:
# ✅ VPC with 3 AZs (high availability)
# ✅ EKS cluster (Kubernetes)
# ✅ DocumentDB (MongoDB-compatible, 2 nodes)
# ✅ ElastiCache Redis (primary + replica)
# ✅ S3 bucket for hotel images
# ✅ ECR repos for Docker images
```

---

## Kubernetes — Deploy to EKS

```bash
# Connect to cluster
aws eks update-kubeconfig --name skystay-prod --region ap-south-1

# Create namespace
kubectl create namespace skystay-prod

# Create secrets (replace values)
kubectl create secret generic skystay-secrets \
  --from-literal=mongo-uri="mongodb://..." \
  --from-literal=jwt-secret="your_jwt_secret" \
  --from-literal=gemini-api-key="your_gemini_key" \
  --from-literal=redis-url="redis://..." \
  -n skystay-prod

# Deploy
kubectl apply -f k8s/deployments/backend-deployment.yaml
kubectl apply -f k8s/hpa/hpa.yaml

# Monitor
kubectl get pods -n skystay-prod -w
kubectl get hpa -n skystay-prod
```

---

## Auto-Scaling Behaviour

| Condition                  | Action               |
|----------------------------|----------------------|
| CPU > 70% for 1 min        | +3 pods (max: 20)    |
| Memory > 80% for 1 min     | +3 pods              |
| Low traffic for 5 min      | -1 pod (min: 3)      |
| Festival/sale traffic spike | Auto scales to 20    |

---

## Monitoring — Prometheus + Grafana

### Alerts configured
| Alert                | Trigger                    | Severity |
|----------------------|----------------------------|----------|
| BackendDown          | API unreachable > 1 min    | Critical |
| HighErrorRate        | 5xx errors > 5%            | Warning  |
| SlowAPIResponse      | p95 latency > 2s           | Warning  |
| HighCPUUsage         | CPU > 85% for 10 min       | Warning  |
| HighMemoryUsage      | Memory > 90%               | Critical |
| MongoDBDown          | DB unreachable             | Critical |
| PodCrashLooping      | Pod restarts detected      | Critical |
| HPAMaxReplicasReached| At scaling limit           | Warning  |

### Grafana Dashboard
- Real-time API response times
- Booking success/failure rates
- Pod health and replica counts
- MongoDB + Redis metrics
- Node CPU/Memory overview

---

## Environment Variables (backend/.env)

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=change_this_in_production
ADMIN_EMAIL=admin@skystay.com
ADMIN_PASSWORD=strong_password_here
GROQ_API_KEY=your_groq_api_key
REDIS_URL=redis://localhost:6379
```

---

## Production Checklist

- [ ] Change all default passwords
- [ ] Set JWT_SECRET to 64+ char random string
- [ ] Enable HTTPS (cert-manager + Let's Encrypt on K8s)
- [ ] Set CORS origin to your actual domain (not `*`)
- [ ] Enable MongoDB authentication
- [ ] Configure S3 for hotel image uploads (replace local /uploads)
- [ ] Set up Slack webhook for alerts
- [ ] Review rate limiting (currently 500 req/15min per IP)
