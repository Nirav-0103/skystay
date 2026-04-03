# ── SkyStay Infrastructure — Terraform ────────────────────────
# Region: ap-south-1 (Mumbai) — closest to Indian users
# ──────────────────────────────────────────────────────────────

terraform {
  required_version = ">= 1.7"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.27"
    }
  }

  # Remote state — keeps team in sync
  backend "s3" {
    bucket         = "skystay-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true
    dynamodb_table = "skystay-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "SkyStay"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# ── Variables ─────────────────────────────────────────────────
variable "aws_region"   { default = "ap-south-1" }
variable "environment"  { default = "prod" }
variable "cluster_name" { default = "skystay-prod" }

# ── VPC ───────────────────────────────────────────────────────
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.5.3"

  name = "skystay-${var.environment}-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway     = true
  single_nat_gateway     = false   # HA: one NAT per AZ
  enable_dns_hostnames   = true
  enable_dns_support     = true

  # Tags needed for EKS auto-discovery
  public_subnet_tags  = { "kubernetes.io/role/elb" = "1" }
  private_subnet_tags = { "kubernetes.io/role/internal-elb" = "1" }
}

# ── EKS Cluster ───────────────────────────────────────────────
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "20.8.5"

  cluster_name    = var.cluster_name
  cluster_version = "1.29"

  vpc_id                         = module.vpc.vpc_id
  subnet_ids                     = module.vpc.private_subnets
  cluster_endpoint_public_access = true

  # ── Node Groups ────────────────────────────────────────────
  eks_managed_node_groups = {
    # General workloads (backend + frontend pods)
    app = {
      name           = "skystay-app"
      instance_types = ["t3.medium"]
      min_size       = 2
      max_size       = 10
      desired_size   = 3

      labels = { role = "app" }
    }

    # Spot instances for cost saving (non-critical tasks)
    spot = {
      name           = "skystay-spot"
      instance_types = ["t3.medium", "t3.large"]
      capacity_type  = "SPOT"
      min_size       = 0
      max_size       = 5
      desired_size   = 1

      labels = { role = "spot" }
      taints = [{
        key    = "spot"
        value  = "true"
        effect = "NO_SCHEDULE"
      }]
    }
  }

  # Add-ons (auto updated by AWS)
  cluster_addons = {
    coredns                = { most_recent = true }
    kube-proxy             = { most_recent = true }
    vpc-cni                = { most_recent = true }
    aws-ebs-csi-driver     = { most_recent = true }
  }
}

# ── MongoDB Atlas (managed) or DocumentDB ─────────────────────
# Using AWS DocumentDB (MongoDB-compatible) for production
resource "aws_docdb_cluster" "skystay" {
  cluster_identifier      = "skystay-${var.environment}"
  engine                  = "docdb"
  master_username         = "skystay_admin"
  master_password         = var.db_password
  backup_retention_period = 7
  preferred_backup_window = "02:00-03:00"
  skip_final_snapshot     = false
  db_subnet_group_name    = aws_docdb_subnet_group.skystay.name
  vpc_security_group_ids  = [aws_security_group.docdb.id]

  tags = { Name = "skystay-docdb" }
}

resource "aws_docdb_cluster_instance" "skystay" {
  count              = 2   # 1 primary + 1 replica
  identifier         = "skystay-${var.environment}-${count.index}"
  cluster_identifier = aws_docdb_cluster.skystay.id
  instance_class     = "db.t3.medium"
}

variable "db_password" {
  description = "DocumentDB master password"
  sensitive   = true
}

resource "aws_docdb_subnet_group" "skystay" {
  name       = "skystay-docdb-subnet"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_security_group" "docdb" {
  name   = "skystay-docdb-sg"
  vpc_id = module.vpc.vpc_id

  ingress {
    from_port   = 27017
    to_port     = 27017
    protocol    = "tcp"
    cidr_blocks = [module.vpc.vpc_cidr_block]
  }
}

# ── ElastiCache Redis ─────────────────────────────────────────
resource "aws_elasticache_replication_group" "skystay" {
  replication_group_id = "skystay-${var.environment}-redis"
  description          = "SkyStay Redis cache"
  node_type            = "cache.t3.micro"
  num_cache_clusters   = 2      # primary + replica
  port                 = 6379

  subnet_group_name  = aws_elasticache_subnet_group.skystay.name
  security_group_ids = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
}

resource "aws_elasticache_subnet_group" "skystay" {
  name       = "skystay-redis-subnet"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_security_group" "redis" {
  name   = "skystay-redis-sg"
  vpc_id = module.vpc.vpc_id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [module.vpc.vpc_cidr_block]
  }
}

# ── S3 for Hotel Images (replaces local /uploads) ─────────────
resource "aws_s3_bucket" "uploads" {
  bucket = "skystay-${var.environment}-hotel-images"
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket                  = aws_s3_bucket.uploads.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = "*"
      Action    = ["s3:GetObject"]
      Resource  = "${aws_s3_bucket.uploads.arn}/*"
    }]
  })
}

# ── ECR Repositories ─────────────────────────────────────────
resource "aws_ecr_repository" "backend" {
  name                 = "skystay-backend"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
}

resource "aws_ecr_repository" "frontend" {
  name                 = "skystay-frontend"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
}

# ── Outputs ───────────────────────────────────────────────────
output "cluster_endpoint"    { value = module.eks.cluster_endpoint }
output "docdb_endpoint"      { value = aws_docdb_cluster.skystay.endpoint }
output "redis_endpoint"      { value = aws_elasticache_replication_group.skystay.primary_endpoint_address }
output "s3_bucket"           { value = aws_s3_bucket.uploads.bucket }
output "ecr_backend"         { value = aws_ecr_repository.backend.repository_url }
output "ecr_frontend"        { value = aws_ecr_repository.frontend.repository_url }
